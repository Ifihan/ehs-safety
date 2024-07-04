document.getElementById('file-input').onchange = function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
};

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
    if (fileInput.files.length === 0) {
        alert('Please upload or capture an image before submitting.');
        return;
    }

    const signatureResponse = await fetch('/signature');
    const signatureData = await signatureResponse.json();
    console.log("Signature Data:", signatureData);  // Debugging line
    
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
    console.log("Cloudinary Data:", cloudinaryData);  // Debugging line
    const imageUrl = cloudinaryData.secure_url;

    const response = await fetch('/detect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: imageUrl })
    });

    const data = await response.json();
    console.log("Detect Response Data:", data);  // Debugging line

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

    // Scroll to the results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
};
