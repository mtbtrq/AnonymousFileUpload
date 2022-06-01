import React, { useEffect } from 'react';
const config = require("./config.json");

function App() {
    useEffect(() => {
        let imageStringUnformatted;
        let imageSize;
        const setImage = () => {
            const file = document.getElementById("fileEl")['files'][0];
            imageSize = file.size;
            
            if (imageSize >= 5000000) {
                return document.getElementById("instructionsEl").textContent = "Please select an image that is lighter than 5 MB.";
            };
            
            var reader = new FileReader();

            reader.onload = () => {
                imageStringUnformatted = reader.result;
                document.getElementById("chosenImage").src = imageStringUnformatted;
            }
            reader.readAsDataURL(file);
        };
        document.getElementById("fileEl").addEventListener("change", setImage);

        const uploadImage = async () => {
            if (imageStringUnformatted) {
                const statusEl = document.getElementById("statusEl");
                statusEl.textContent = "Uploading...";
                const imageStringFormatted = imageStringUnformatted.replace("data:", "").replace(/^.+,/, "");
            
                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({image: imageStringFormatted, size: imageSize})
                };
    
                try {
                    await fetch(`${config.apiURL}/upload`, options).then(async response => {
                        const jsonResponse = await response.json();
                        if (jsonResponse.success) {
                            setStats();
                            const code = jsonResponse.code;
                            statusEl.innerHTML = `Uploaded! Image URL: <a href="${config.apiURL}/i/${code}" target="_blank">${config.apiURL}/i/${code}</a>`
                        } else if (jsonResponse.cause === "You're sending too many requests. Please try again in a while.") {
                            return statusEl.textContent = "You're sending too many requests. Please try again in a while."
                        } else {
                            console.log(jsonResponse)
                            statusEl.textContent = "Something went wrong! Contact Mutayyab on discord: Mutyyab.#4275";
                        };
                    });
                } catch (err) {
                    statusEl.textContent = "Something went wrong!"
                };
                document.getElementById("chosenImage").src = "";
                imageStringUnformatted = "";
                document.getElementById("fileEl").value = ""
            };
        };
        document.getElementById("submitButtonEl").addEventListener("click", uploadImage);

        const setStats = async () => {
            try {
                await fetch(`${config.apiURL}/stats`).then(async response => {
                    const jsonResponse = await response.json();
                    document.getElementById("statsEl").textContent = `${jsonResponse.imagesUploaded} image(s) uploaded with a total file size of ${(jsonResponse.imageSizeUploaded).toFixed(2)} MB.`
                });
            } catch (err) {
                document.getElementById("statusEl").textContent = "Something went wrong! Contact Mutayyab on discord: Mutyyab.#4275";
                return console.log(err);
            };
        };
        setStats();
    }, []);

    return (
        <div id="mainDiv">
            <h1 id="title">Anonymously Upload Images</h1>
            <p>This service doesn't store any of your personal data and is fully open source.</p>
            <p id="statsEl"></p>

            <p id="instructionsEl">Only image files (below 5 MB) are allowed!</p>
            <p id="statusEl"></p>
            <br />
            <input type="file" id="fileEl" accept="image/png, image/jpeg" title="Choose any PNG or JPEG file"/>
            <br />
            <button id="submitButtonEl">Submit</button>
            <img id="chosenImage" width="70%"/>
        </div>
    );
};

export default App;