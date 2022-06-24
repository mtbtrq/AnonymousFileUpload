import React, { useEffect } from 'react';
const config = require("./config.json");

function App() {
    useEffect(() => {
        const setPreviousURLs = () => {
            if (localStorage.getItem("urls")) {
                document.getElementById("yourPreviouslyUploadedFilesText").classList.remove("hidden");
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

        let fileStringUnformatted;
        let fileSize;
        let fileName;
        const handleChange = () => {
            const file = document.getElementById("fileEl")['files'][0];
            fileSize = file.size/1_000_000;
            fileName = file.name;
            document.getElementById("statusEl").textContent = `${fileName} (${fileSize.toFixed(3)} MB)`;
            
            if (fileSize >= 10) {
                return document.getElementById("instructionsEl").textContent = "Please select a file that is lighter than 10 MB.";
            };
            
            var reader = new FileReader();

            reader.onload = () => {
                fileStringUnformatted = reader.result;
            };
            reader.readAsDataURL(file);
        };
        document.getElementById("fileEl").addEventListener("change", handleChange);

        const uploadFile = async () => {
            if (fileStringUnformatted) {
                const statusEl = document.getElementById("statusEl");
                statusEl.textContent = "Uploading...";
                const fileArray = fileStringUnformatted.split(",");

                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({file: fileArray[1], size: fileSize, fileName: fileName})
                };
    
                try {
                    await fetch(`${config.apiURL}/upload`, options).then(async response => {
                        if (!(response.status === 413)) {
                            const jsonResponse = await response.json();
                            if (jsonResponse.success) {
                                const url = `${config.apiURL}/i/${jsonResponse.code}`;
                                statusEl.textContent = "";
                                document.getElementById("instructionsEl").innerHTML = `Uploaded! Download URL: <a href="${url}" target="_blank">${url}</a>`;
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
                                newLi.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
                                document.getElementById("yourPreviouslyUploadedFilesText").classList.remove("hidden");
                                previousLinkUlEl.appendChild(newLi);
                            } else {
                                statusEl.textContent = "Something went wrong! Contact Mutayyab on discord: Mutyyab.#4275";
                            };
                        } else { return statusEl.textContent = "The request payload is too large, please select a lighter file!" };
                    });
                } catch (err) {
                    console.log(err);
                    statusEl.textContent = "Something went wrong!";
                };

                fileStringUnformatted = "";
                document.getElementById("fileEl").value = "";
            };
        };
        document.getElementById("submitButtonEl").addEventListener("click", uploadFile);

        const setStats = async () => {
            try {
                await fetch(`${config.apiURL}/stats`).then(async response => {
                    const jsonResponse = await response.json();
                    document.getElementById("statsEl").textContent = `${jsonResponse.filesUploaded} file(s) uploaded with a total file size of ${(jsonResponse.fileSizeUploaded).toFixed(2)} MB.`;
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
            <h1 id="title">Anonymously Upload Files</h1>
            <p>This service doesn't store any of your personal data and is fully open source.</p>
            <p id="statsEl"></p>
            
            <br />
            <p className="hidden" id="yourPreviouslyUploadedFilesText">Your previously uploaded files:</p>
            <ul id="linksUlEl"></ul>

            <p id="instructionsEl">Only files (below 10 MB) are allowed!</p>
            <p id="statusEl"></p>

            <br />
            <label htmlFor="fileEl" id="customUploadStyle">
                Choose File
                <input type="file" id="fileEl" />
            </label>
            <br />

            <button id="submitButtonEl">Upload</button>
        </div>
    );
};

export default App;