const app = require("express")();
const bodyParser = require("body-parser");

app.use(require("cors")());
const config = require("./config.json");
const db = new require("better-sqlite3")(`${config["databaseName"]}.db`);

const port = process.env.PORT || config.port;
app.use(bodyParser.json({ limit: config.fileSizeLimit }));
app.use(bodyParser.urlencoded({ extended: true }));

let filesUploaded = 0;
let fileSizeUploaded = 0;

app.get("/", (req, res) => { return res.redirect(config.incorrectCodeRedirectURL) });
app.get("/i", (req, res) => { return res.redirect(config.incorrectCodeRedirectURL) });

app.get("/stats", (req, res) => {
    return res.send({
        "filesUploaded": filesUploaded,
        "fileSizeUploaded": fileSizeUploaded
    });
});

db.prepare(`CREATE TABLE IF NOT EXISTS ${config.tableName} (base64Code text, code text, fileName text)`).run();

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
        const file = req.body.file;
        const fileSize = req.body.size;
        const fileName = req.body.fileName;
        const code = getCode();

        db.prepare(`INSERT INTO ${config.tableName} VALUES (?, ?, ?)`).run(file, code, fileName);

        filesUploaded += 1;
        if (!isNaN(fileSize)) { fileSizeUploaded += (fileSize/1_000_000) };

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
    var randomChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for ( var i = 0; i < config.codeLength; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    };
    return result;
};

app.get("/i/:code", (req, res) => {
    const code = (req.params.code).toLowerCase();
    
    const filesData = db.prepare(`SELECT * FROM ${config.tableName} WHERE code = ?`).all(code);
    
    if (!(filesData.length > 0)) { return res.redirect(config.incorrectCodeRedirectURL) };

    const fileCode = filesData[0]["base64Code"];
    
    const file = Buffer.from(fileCode, 'base64');

    res.header({
        "Content-Disposition": `attachment; filename="${filesData[0]["fileName"]}`
    });
    return res.end(file);
});

app.post("/truncate", (req, res) => {
    const usersPassword = req.body.password;
    const password = process.env.password || "admin123";

    if (usersPassword === password) {
        db.prepare(`DELETE from ${config.tableName}`).run();
        fileSizeUploaded = 0;
        filesUploaded = 0;
        res.send({ success: true });

        if (config.sendAlertsToAPI) {
            try {
                const fetch = require("node-fetch-commonjs");
                const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `**Anonymous Files**\nTruncated Database.` }) };
                const apiURL = process.env.alertsAPI || config.alertsAPIURL;
                await fetch(apiURL, options);
            } catch (err) {
                console.log(err);
            };
        } else {
            console.log("Truncated Database.");
        };
    } else {
        return res.send({
            success: false,
            cause: "Incorrect password entered!"
        });
    };
});

app.listen(port, () => { console.log(`I'm listening to requests on port ${port}`) });