const app = require("express")();
const bodyParser = require("body-parser");

app.use(require("cors")());
const config = require("./config.json");
const db = new require("better-sqlite3")(`${config["databaseName"]}.db`);

const port = process.env.PORT || config.port;
app.use(bodyParser.json({ limit: config.imageSizeLimit }));
app.use(bodyParser.urlencoded({ extended: true }));

let imagesUploaded = 0;
let imageSizeUploaded = 0;

app.get("/", (req, res) => { return res.redirect(config.incorrectCodeRedirectURL) });
app.get("/i", (req, res) => { return res.redirect(config.incorrectCodeRedirectURL) });

app.get("/stats", (req, res) => {
    return res.send({
        "imagesUploaded": imagesUploaded,
        "imageSizeUploaded": imageSizeUploaded
    });
});

db.prepare(`CREATE TABLE IF NOT EXISTS ${config.imagesTableName} (imagebase64Code text, code text)`).run();

const limiter = require('express-rate-limit').rateLimit({
    windowMs: config.rateLimitTimeMilliseconds,
    max: config.requestsPerTime,
    standardHeaders: true,
    message: {
        success: false,
        cause: "You're sending too many requests. Please try again in a while."
    },
    statusCode: 200
});

app.post("/upload", limiter, (req, res) => {
    try {
        const image = req.body.image;
        const fileSize = req.body.size;
        const mimeType = req.body.mimeType;

        if (mimeType == "data:image/jpeg;base64" || mimeType == "data:image/png;base64") {
            const code = getCode();

            db.prepare(`INSERT INTO ${config.imagesTableName} VALUES (?, ?)`).run(image, code);
    
            imagesUploaded += 1;
            if (!isNaN(fileSize)) { imageSizeUploaded += (fileSize/1_000_000) }
    
            return res.send({
                success: true,
                code: code
            });
        } else { return res.send({ success: false, cause: "Please only upload JPEG or PNG files!" }) }
    } catch (err) {
        return res.send({
            success: false,
            cause: err.message
        });
    };
});

function getCode() {
    var randomChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for ( var i = 0; i < config.codeLength; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    };
    return result;
};

app.get("/i/:code", (req, res) => {
    const code = (req.params.code).toLowerCase();
    
    const imagesData = db.prepare(`SELECT * FROM ${config.imagesTableName} WHERE code = ?`).all(code);
    
    if (!(imagesData.length > 0)) { return res.redirect(config.incorrectCodeRedirectURL) };

    const imageCode = imagesData[0]["imagebase64Code"];
    
    const img = Buffer.from(imageCode, 'base64');

    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
    });
    return res.end(img);
});

app.post("/truncate", (req, res) => {
    const usersPassword = req.body.password;
    const password = process.env.password || "admin123";

    if (usersPassword === password) {
        db.prepare(`DELETE from ${config.imagesTableName}`).run();
        imageSizeUploaded = 0;
        imagesUploaded = 0;
        return res.send({ success: true });
    } else {
        return res.send({
            success: false,
            cause: "Incorrect password entered!"
        });
    };
});

app.listen(port, () => { console.log(`I'm listening to requests on port ${port}`) });