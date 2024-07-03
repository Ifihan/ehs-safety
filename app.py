from flask import Flask, request, jsonify, render_template
import cv2
import numpy as np
from ultralytics import YOLO

app = Flask(__name__)

# Load YOLO model
model = YOLO("models/best.pt")

# Define the list of all classes
all_classes = [
    "extinguisher",
    "harness",
    "helment",
    "left-boot",
    "left-glove",
    "right-boot",
    "right-glove",
    "safety-box",
    "vest",
]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/detect", methods=["POST"])
def detect():
    if "file" not in request.files:
        return jsonify({"error": "No file part"})
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"})

    if file:
        img_bytes = np.fromfile(file, np.uint8)
        img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

        # Run YOLO detection
        results = model(img)
        detected_classes = set()
        for result in results:
            for box in result.boxes:
                class_index = int(box.cls.item())  # Convert tensor to int
                detected_classes.add(result.names[class_index])

        # Determine missing classes
        missing_classes = list(set(all_classes) - detected_classes)

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
