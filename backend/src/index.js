const express = require("express");
const app = express()
const cors = require("cors");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");

app.use(cors());
const config = require("./config.json");
const db = new Database(`${config["databaseName"]}.db`);

const port = process.env.PORT || config.port;
app.use(bodyParser.json({ limit: "15mb"}));
app.use(bodyParser.urlencoded({ extended: true }));

db.prepare(`CREATE TABLE IF NOT EXISTS ${config.imagesTableName} (imagebase64Code text, dateUploaded text)`).run();

app.post("/upload", (req, res) => {
    try {
        const image = req.body.image;

        const current_date = new Date();
        
        const date = `${current_date.getDate()}/${current_date.getMonth() + 1}/${current_date.getFullYear()} ${current_date.getUTCHours()}:${current_date.getUTCMinutes()}:${current_date.getUTCSeconds()} UTC`;
    
        db.prepare(`INSERT INTO ${config.imagesTableName} VALUES (?, ?)`).run(image, date)
    
        return res.send({
            success: true
        });
    } catch (err) {
        res.send({
            success: false,
            cause: err
        })
    }
});

app.listen(port, () => { console.log(`I'm listening to requests on port ${port}`) });