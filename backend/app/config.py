import os

# Base directory of the app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the trained model (backend/models/cancer_model.h5)
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "cancer_model.h5")

# Allowed image types
ALLOWED_EXTENSIONS = {"image/jpeg", "image/png", "image/jpg"}