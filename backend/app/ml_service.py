import tensorflow as tf
import numpy as np
import os
import random
from app.config import MODEL_PATH
from app.utils import preprocess_image

# Global variable
model = None

def load_model():
    """Loads the model into memory on startup."""
    global model
    
    # Check if file exists and is not empty
    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 0:
        try:
            print(f"Loading model from {MODEL_PATH}...")
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading model: {e}")
            model = None
    else:
        print(f"Warning: Model file at {MODEL_PATH} is missing or empty.")
        print("System running in MOCK MODE (Simulated Predictions).")
        model = None

def predict(image_bytes: bytes):
    """
    Preprocesses the image and returns the prediction.
    """
    # 1. Preprocess
    processed_image = preprocess_image(image_bytes)

    # 2. Predict
    if model:
        # REAL PREDICTION
        prediction_probs = model.predict(processed_image)
        # Assuming output is a single probability (0 to 1)
        probability = float(prediction_probs[0][0])
        is_mock = False
    else:
        # MOCK PREDICTION (For testing without a real model)
        probability = random.uniform(0, 1)
        is_mock = True

    # 3. Logic (Threshold usually 0.5)
    if probability > 0.5:
        label = "Malignant (Positive)"
    else:
        label = "Benign (Negative)"
    
    return label, probability, is_mock