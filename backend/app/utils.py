import io
import numpy as np
from PIL import Image

def preprocess_image(image_bytes: bytes, target_size=(224, 224)) -> np.ndarray:
    """
    Reads image bytes, resizes, and normalizes it for the model.
    """
    # Open image from bytes
    image = Image.open(io.BytesIO(image_bytes))
    
    # Ensure image is RGB
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    # Resize to the input size your model expects (e.g., 224x224)
    image = image.resize(target_size)
    
    # Convert to numpy array
    img_array = np.array(image)
    
    # Normalize pixel values (0-255 -> 0-1)
    img_array = img_array / 255.0
    
    # Add batch dimension (1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array