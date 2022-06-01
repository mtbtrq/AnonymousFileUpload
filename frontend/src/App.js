import React, { useEffect } from 'react';
const config = require("./config.json");

function App() {
    useEffect(() => {
        let imageStringUnformatted;
        const setImage = () => {
            const file = document.getElementById("fileEl")['files'][0];
            
            var reader = new FileReader();

            reader.onload = () => {
                imageStringUnformatted = reader.result;
                document.getElementById("chosenImage").src = imageStringUnformatted;
            }
            reader.readAsDataURL(file);
        }
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
                    body: JSON.stringify({image: imageStringFormatted})
                };
    
                await fetch(`${config.apiURL}/upload`, options).then(async response => {
                    const jsonResponse = await response.json();
                    if (jsonResponse.success) {
                        statusEl.textContent = `Uploaded! \nImage URL: ${config.apiURL}/${jsonResponse.code}`
                    } else {
                        console.log(jsonResponse.cause)
                        statusEl.textContent = jsonResponse.cause;
                    };
                });
            };
        };
        document.getElementById("submitButtonEl").addEventListener("click", uploadImage);
    }, []);

    return (
        <div id="mainDiv">
            <h1>Anonymously Upload Images</h1>
            <p>This service doesn't store any of your data and is fully open source.</p>

            <p id="instructionsEl">Only image files (below 5 MB) are allowed!</p>
            <p id="statusEl"></p>
            <input type="file" id="fileEl" accept="image/png, image/jpeg" title="Choose any PNG or JPEG file"/>
            <br />
            <button id="submitButtonEl">Submit</button>
            <img id="chosenImage" width="70%"/>
        </div>
    );
};

export default App;