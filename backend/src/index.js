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

app.post("/upload", (req, res) => {
    try {
        const image = req.body.image;
        const fileSize = req.body.size;

        const code = getCode();

        db.prepare(`INSERT INTO ${config.imagesTableName} VALUES (?, ?)`).run(image, code);

        imagesUploaded += 1;
        if (!isNaN(fileSize)) { imageSizeUploaded += (fileSize/1_000_000) }

        return res.send({
            success: true,
            code: code
        });
    } catch (err) {
        return res.send({
            success: false,
            cause: err.message
        });
    };
});

function getCode() {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for ( var i = 0; i < config.codeLength; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    };
    return result;
};

app.get("/i/:code", (req, res) => {
    const code = req.params.code;
    
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

app.listen(port, () => { console.log(`I'm listening to requests on port ${port}`) });