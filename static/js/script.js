document.getElementById('camera-button').onclick = function () {
    startCamera();
};

function startCamera() {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
            video.style.display = 'block';
            canvas.style.display = 'none';
            document.getElementById('camera-button').textContent = 'Capture Picture';

            document.getElementById('camera-button').onclick = function () {
                capturePicture(stream);
            };

            disableOptions();
        })
        .catch(function (err) {
            console.error('Error accessing camera: ', err);
        });
}

function capturePicture(stream) {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    
    fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
            const fileInput = document.getElementById('file-input');
            const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            for (const existingFile of fileInput.files) {
                dataTransfer.items.add(existingFile);
            }
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;

            displayPreviews();

            video.srcObject.getTracks().forEach(track => track.stop());
            video.style.display = 'none';
            document.getElementById('camera-button').textContent = 'Take Picture';
            document.getElementById('camera-button').onclick = function () {
                startCamera();
            };
        });
}

function displayPreviews() {
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = '';

    for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Image Preview">
                <button class="delete-button" data-index="${i}">&times;</button>
            `;
            previewContainer.appendChild(previewItem);

            previewItem.querySelector('.delete-button').onclick = function () {
                deleteImage(i);
            };
        };
        reader.readAsDataURL(file);
    }
}

function deleteImage(index) {
    const fileInput = document.getElementById('file-input');
    const dataTransfer = new DataTransfer();

    for (let i = 0; i < fileInput.files.length; i++) {
        if (i !== index) {
            dataTransfer.items.add(fileInput.files[i]);
        }
    }

    fileInput.files = dataTransfer.files;
    displayPreviews();

    // Re-enable options if all images are deleted
    if (fileInput.files.length === 0) {
        enableOptions();
    }
}

document.getElementById('upload-form').onsubmit = async function (e) {
    e.preventDefault();

    const fileInput = document.getElementById('file-input');
    const selectedLocation = document.querySelector('input[name="location"]:checked');
    const submitButton = document.getElementById('submit-button');
    const spinner = document.getElementById('spinner');

    if (!selectedLocation) {
        alert('Please select a work type option.');
        return;
    }

    if (fileInput.files.length === 0) {
        alert('Please upload or capture an image before submitting.');
        return;
    }

    submitButton.disabled = true;
    spinner.style.display = 'inline-block';

    const signatureResponse = await fetch('/signature');
    const signatureData = await signatureResponse.json();
    
    const imageUrls = [];
    for (const file of fileInput.files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureData.api_key);
        formData.append('timestamp', signatureData.timestamp);
        formData.append('signature', signatureData.signature);

        const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/upload`, {
            method: 'POST',
            body: formData
        });

        const cloudinaryData = await cloudinaryResponse.json();
        imageUrls.push(cloudinaryData.secure_url);
    }

    const response = await fetch('/detect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_urls: imageUrls, location: selectedLocation.value })
    });

    const data = await response.json();

    spinner.style.display = 'none';
    submitButton.disabled = false;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <p><strong>The following are the detected items:</strong></p>
        <div class="detected">
            <ul>${data.detected.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
        <p><strong>The following are the missing items:</strong></p>
        <div class="missing">
            <ul>${data.missing.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
    `;

    showModal(data);

    // Scroll to the results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
};

function showModal(data) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    const modalActionButton = document.getElementById('modal-action-button');
    const closeButton = document.querySelector('.close-button');

    if (data.missing.length === 0) {
        modalMessage.textContent = "You are fit for the task!";
        modalActionButton.textContent = "Close";
    } else {
        modalMessage.innerHTML = `
            <span style='color: red;'>You are not fit for the task.</span>
            <br>
            <span>Please try again and make sure to capture all required items.</span>
        `;
        modalActionButton.textContent = "Try Again";
    }

    modal.style.display = "block";

    closeButton.onclick = function() {
        modal.style.display = "none";
    }

    modalActionButton.onclick = function() {
        modal.style.display = "none";
         //resetUI(); did not want to waste time checking why I could not change the option when the reset UI happens hence I just reload the page
         // We can check this out later 
        // This will refresh the current webpage
        window.location.reload();

    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function resetUI() {
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const video = document.getElementById('camera');
    const preview = document.getElementById('preview');
    const resultsDiv = document.getElementById('results');

    // Clear the file input
    const dataTransfer = new DataTransfer();
    fileInput.files = dataTransfer.files;

    // Clear the preview container
    previewContainer.innerHTML = '';

    // Clear the results section
    resultsDiv.innerHTML = '';

    // Hide the video and preview elements
    video.style.display = 'none';
    preview.style.display = 'none';

    // Re-enable the options
    enableOptions();

    // Reset the camera button text and functionality
    document.getElementById('camera-button').textContent = 'Take Picture';
    document.getElementById('camera-button').onclick = function () {
        startCamera();
    };
}

function disableOptions() {
    const radioButtons = document.querySelectorAll('input[name="location"]');
    radioButtons.forEach(button => {
        button.disabled = true;
    });
}

function enableOptions() {
    const radioButtons = document.querySelectorAll('input[name="location"]');
    radioButtons.forEach(button => {
        button.disabled = false;
    });
}

// Handle radio button clicks
const radioButtons = document.querySelectorAll('input[name="location"]');
radioButtons.forEach(button => {
    button.onclick = function () {
        if (document.getElementById('file-input').files.length > 0) {
            showOptionPopup();
            return false; // Prevent changing the option
        }
    };
});

function showOptionPopup() {
    const popup = document.getElementById('option-popup');
    const closePopupButton = document.querySelector('.close-popup-button');
    const popupOkButton = document.getElementById('popup-ok-button');

    popup.style.display = 'block';

    closePopupButton.onclick = function() {
        popup.style.display = 'none';
    }

    popupOkButton.onclick = function() {
        popup.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == popup) {
            popup.style.display = 'none';
        }
    }
}
