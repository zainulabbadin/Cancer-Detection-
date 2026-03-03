import tensorflow as tf
import numpy as np
import os
import random

from app.config import MODEL_PATH
from app.utils import preprocess_image

# ── Global Model State ───────────────────────────────────────────────────────
_model = None


def load_model():
    """Load the Keras model into memory once at startup."""
    global _model

    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 0:
        try:
            print(f"Loading model from {MODEL_PATH}...")
            _model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading model: {e}")
            _model = None
    else:
        print(f"Warning: Model file at {MODEL_PATH} is missing or empty.")
        print("System running in MOCK MODE (Simulated Predictions).")
        _model = None


def predict(image_bytes: bytes) -> tuple[str, float, bool]:
    """
    Preprocess the image and return (label, confidence, is_mock).
    """
    processed_image = preprocess_image(image_bytes)

    if _model:
        prediction_probs = _model.predict(processed_image)
        probability = float(prediction_probs[0][0])
        is_mock = False
    else:
        probability = random.uniform(0, 1)
        is_mock = True

    label = "Malignant (Positive)" if probability > 0.5 else "Benign (Negative)"
    return label, probability, is_mock
