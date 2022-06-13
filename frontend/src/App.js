import React, { useEffect } from 'react';
const config = require("./config.json");

function App() {
    useEffect(() => {
        const setPreviousURLs = () => {
            if (localStorage.getItem("urls")) {
                document.getElementById("yourPreviouslyUploadedImagesText").classList.remove("hidden");
                const previousURLs = JSON.parse(localStorage.getItem("urls"));
                if (previousURLs.length > 5) {
                    previousURLs.splice(0, previousURLs.length - 5)
                    localStorage.setItem("urls", JSON.stringify(previousURLs))
                };
                const previousLinkUlEl = document.getElementById("linksUlEl");
                for (let url of previousURLs) {
                    const newLi = document.createElement("li");
                    newLi.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
                    previousLinkUlEl.appendChild(newLi);
                };
            };
        };
        setPreviousURLs();

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
                const chosenImageEl = document.getElementById("chosenImage")
                chosenImageEl.src = imageStringUnformatted;
                chosenImageEl.classList.remove("hidden")
            };
            reader.readAsDataURL(file);
        };
        document.getElementById("fileEl").addEventListener("change", setImage);

        const uploadImage = async () => {
            if (imageStringUnformatted) {
                const statusEl = document.getElementById("statusEl");
                statusEl.textContent = "Uploading...";
                const imageArray = imageStringUnformatted.split(",");

                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({image: imageArray[1], size: imageSize, mimeType: imageArray[0]})
                };
    
                try {
                    await fetch(`${config.apiURL}/upload`, options).then(async response => {
                        const jsonResponse = await response.json();
                        if (jsonResponse.success) {
                            const url = `${config.apiURL}/i/${jsonResponse.code}`;
                            statusEl.textContent = "";
                            document.getElementById("instructionsEl").innerHTML = `Uploaded! Image URL: <a href="${url}" target="_blank">${url}</a>`;
                            setStats();

                            if (!(localStorage.getItem("urls"))) {
                                localStorage.setItem("urls", JSON.stringify([url]));
                            } else {
                                const previousURLs = JSON.parse(localStorage.getItem("urls"));
                                previousURLs.push(url);
                                localStorage.setItem("urls", JSON.stringify(previousURLs));
                            };

                            const previousLinkUlEl = document.getElementById("linksUlEl");
                            const newLi = document.createElement("li");
                            newLi.innerHTML = `<a href="${url}" target="_blank">${url}</a>`
                            document.getElementById("yourPreviouslyUploadedImagesText").classList.remove("hidden")
                            previousLinkUlEl.appendChild(newLi);

                        } else if (jsonResponse.cause === "You're sending too many requests. Please try again in a while.") {
                            return statusEl.textContent = "You're sending too many requests. Please try again in a while.";
                        } else if (jsonResponse.cause === "Please only upload JPEG or PNG files!") {
                            return statusEl.textContent = "Please only upload JPEG or PNG files!";
                        } else {
                            console.log(jsonResponse);
                            statusEl.textContent = "Something went wrong! Contact Mutayyab on discord: Mutyyab.#4275";
                        };
                    });
                } catch (err) {
                    console.log(err);
                    statusEl.textContent = "Something went wrong!";
                };

                const chosenImage = document.getElementById("chosenImage");
                chosenImage.src = "";
                chosenImage.classList.add("hidden");
                imageStringUnformatted = "";
                document.getElementById("fileEl").value = "";
            };
        };
        document.getElementById("submitButtonEl").addEventListener("click", uploadImage);

        const setStats = async () => {
            try {
                await fetch(`${config.apiURL}/stats`).then(async response => {
                    const jsonResponse = await response.json();
                    document.getElementById("statsEl").textContent = `${jsonResponse.imagesUploaded} image(s) uploaded with a total file size of ${(jsonResponse.imageSizeUploaded).toFixed(2)} MB.`;
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
            
            <br />
            <p className="hidden" id="yourPreviouslyUploadedImagesText">Your previously uploaded images:</p>
            <ul id="linksUlEl"></ul>

            <p id="instructionsEl">Only image files (below 5 MB) are allowed!</p>
            <p id="statusEl"></p>

            <br />
            <label htmlFor="fileEl" id="customUploadStyle">
                Choose File
                <input type="file" id="fileEl" accept="image/png, image/jpeg" title="Choose any PNG or JPEG file"/>
            </label>
            <br />

            <button id="submitButtonEl">Upload</button>
            <img id="chosenImage" width="70%" alt="User's photograph selection" className='hidden'/>
        </div>
    );
};

export default App;