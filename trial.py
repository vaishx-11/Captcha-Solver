from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import cv2
import torch
from ultralytics import YOLO
from torchvision import transforms
from PIL import Image
import torch.nn as nn

app = Flask(__name__)

# Enable CORS for all domains
CORS(app)

# Load YOLO model (already trained)
yolo_model = YOLO(r"C:\Users\Venka\OneDrive\Desktop\captchasolver\yolo_trained_model.pt")

# Define CNN Model
class CNN(nn.Module):
    def __init__(self, num_classes):
        super(CNN, self).__init__()
        self.conv_layers = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        self.fc_layers = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * (64 // 8) * (64 // 8), 128),  # Adjust dimensions if needed
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.conv_layers(x)
        x = self.fc_layers(x)
        return x

# Load CNN Model
num_classes = 36  # Number of classes (26 letters + 10 digits)
cnn_model = CNN(num_classes=num_classes)
cnn_weights_path = r"C:\Users\Venka\OneDrive\Desktop\captchasolver\cnn_captcha_classifier.pth"  # Path to saved weights
cnn_model.load_state_dict(torch.load(cnn_weights_path))
cnn_model.eval()

# Define preprocessing for CNN
cnn_preprocess = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

# Function to process YOLO predictions and return sorted bounding boxes
def process_yolo_output(yolo_results):
    boxes = yolo_results[0].boxes.xyxy.cpu().numpy()  # Bounding boxes
    scores = yolo_results[0].boxes.conf.cpu().numpy()  # Confidence scores
    labels = yolo_results[0].boxes.cls.cpu().numpy()  # Class indices
    box_data = [(box, score, label) for box, score, label in zip(boxes, scores, labels)]
    # Sort by x-coordinate (x1) for character sequence
    sorted_boxes = sorted(box_data, key=lambda b: b[0][0])  # Sort by x1 (left-most point)
    return sorted_boxes

# Function to predict text from Captcha using YOLO and CNN
def predict_captcha(image_path):
    img_cv = cv2.imread(image_path)  # Load image for YOLO
    if img_cv is None:
        raise ValueError(f"Image not found: {image_path}")

    yolo_results = yolo_model(image_path)  # Run YOLO inference
    sorted_boxes = process_yolo_output(yolo_results)

    captcha_text = ""
    for i, (box, score, label) in enumerate(sorted_boxes):
        if score < 0.5:  # Filter low-confidence detections
            continue

        x1, y1, x2, y2 = map(int, box)  # Bounding box coordinates
        cropped_image = img_cv[y1:y2, x1:x2]  # Crop the character

        cropped_image_pil = Image.fromarray(cropped_image)
        input_tensor = cnn_preprocess(cropped_image_pil)
        input_batch = input_tensor.unsqueeze(0)  # Add batch dimension

        # CNN Prediction
        with torch.no_grad():
            output = cnn_model(input_batch)
            _, predicted = torch.max(output, 1)

        # Map predicted index to character
        character_map = "23456789abcdefghijkmnopqrstuvwxyz"
        if predicted.item() < len(character_map):
            character = character_map[predicted.item()]
        else:
            character = "?"  # Placeholder for out-of-range predictions

        captcha_text += character

    return captcha_text

@app.route('/predict_captcha', methods=['POST'])
def predict():
    image_path = request.json.get('image_path')
    if not image_path:
        return jsonify({"error": "Image path is required"}), 400

    try:
        captcha_text = predict_captcha(image_path)
        return jsonify({"captcha_text": captcha_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
