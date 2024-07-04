document.getElementById('camera-button').onclick = function () {
    startCamera();
};

function startCamera() {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
            video.style.display = 'block';
            canvas.style.display = 'none';
            document.getElementById('camera-button').textContent = 'Capture Picture';

            document.getElementById('camera-button').onclick = function () {
                capturePicture();
            };
        })
        .catch(function (err) {
            console.error('Error accessing camera: ', err);
        });
}

function capturePicture() {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    video.srcObject.getTracks().forEach(track => track.stop());
    video.style.display = 'none';

    const dataUrl = canvas.toDataURL('image/png');
    preview.src = dataUrl;
    preview.style.display = 'block';

    fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
            const fileInput = document.getElementById('file-input');
            const file = new File([blob], 'photo.png', { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;

            document.getElementById('camera-button').textContent = 'Take Picture';
            document.getElementById('camera-button').onclick = function () {
                startCamera();
            };
        });
}

document.getElementById('upload-form').onsubmit = async function (e) {
    e.preventDefault();

    const fileInput = document.getElementById('file-input');
    const selectedLocation = document.querySelector('input[name="location"]:checked');
    const submitButton = document.getElementById('submit-button');
    const spinner = document.getElementById('spinner');

    if (!selectedLocation) {
        alert('Please select a location option.');
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
    
    const file = fileInput.files[0];
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
    const imageUrl = cloudinaryData.secure_url;

    const response = await fetch('/detect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: imageUrl, location: selectedLocation.value })
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
    } else if (data.missing.length <= 2) {
        modalMessage.textContent = "Warning: Please retake the picture.";
        modalActionButton.textContent = "Try Again";
    } else {
        modalMessage.innerHTML = "<span style='color: red;'>You are not fit for the task.</span>";
        modalActionButton.textContent = "Try Again";
    }

    modal.style.display = "block";

    closeButton.onclick = function() {
        modal.style.display = "none";
    }

    modalActionButton.onclick = function() {
        if (modalActionButton.textContent === "Try Again") {
            modal.style.display = "none";
            const video = document.getElementById('camera');
            video.style.display = 'none';
            document.getElementById('preview').style.display = 'none';
        } else {
            modal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}