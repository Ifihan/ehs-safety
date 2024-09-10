import os
import time
import hashlib
import hmac
from flask import Flask, request, jsonify, render_template
import requests
import cv2
import numpy as np
from ultralytics import YOLO
import os


app = Flask(__name__)

# Load YOLO model
model = YOLO("models/best.pt")

# Define the list of all classes
tower_classes = [
    "extinguisher",
    "harness",
    "helmet",
    "left-boot",
    "left-glove",
    "right-boot",
    "right-glove",
    "safety-box",
    "vest",
]
ground_classes = [
    "extinguisher",
    "helmet",
    "left-boot",
    "left-glove",
    "right-boot",
    "right-glove",
    "safety-box",
    "vest",
]

# Get Cloudinary credentials from environment variables
cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/signature", methods=["GET"])
def get_signature():
    if not api_secret:
        return jsonify({"error": "API secret not set"}), 500

    timestamp = str(int(time.time()))
    payload = f"timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(payload.encode("utf-8")).hexdigest()
    return jsonify(
        {
            "signature": signature,
            "timestamp": timestamp,
            "api_key": api_key,
            "cloud_name": cloud_name,
        }
    )


@app.route("/detect", methods=["POST"])
def detect():
    data = request.get_json()
    image_urls = data.get("image_urls")
    location = data.get("location")
    if not image_urls:
        return jsonify({"error": "No image URLs provided"}), 400
    if not location:
        return jsonify({"error": "No location provided"}), 400

    if location == "tower":
        classes = tower_classes
    elif location == "ground":
        classes = ground_classes
    else:
        return jsonify({"error": "Invalid location"}), 400

    detected_classes = set()
    for image_url in image_urls:
        # Download the image from Cloudinary
        response = requests.get(image_url)
        img_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        # Run YOLO detection
        results = model(img)
        for result in results:
            for box in result.boxes:
                class_index = int(box.cls.item())  # Convert tensor to int
                detected_classes.add(result.names[class_index])

    # Determine missing classes
    missing_classes = list(set(classes) - detected_classes)

   

    return jsonify(
        {
            "detected": list(detected_classes),
            "missing": list(missing_classes),
            "message": (
                f"The following are the detected items: {', '.join(list(detected_classes))}\n"
                f"The following are the missing items: {', '.join(missing_classes)}"
            ),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
