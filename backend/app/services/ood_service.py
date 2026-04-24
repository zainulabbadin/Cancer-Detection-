import io
from PIL import Image
import torch
import logging

# We will lazily load clip
clip = None
model = None
preprocess = None
text_features = None

logger = logging.getLogger(__name__)

OOD_THRESHOLD = 0.22

# Prompts intended to capture medical/histopathology images
MEDICAL_PROMPTS = [
    "histopathology image",
    "medical microscope tissue",
    "cancer biopsy slide"
]

def load_clip_model():
    """Download and load the CLIP ViT-B/32 model cache."""
    global clip, model, preprocess, text_features
    try:
        import clip as openai_clip
        clip = openai_clip
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        logger.info("Loading CLIP model 'ViT-B/32'...")
        model, preprocess = clip.load("ViT-B/32", device=device)
        
        # Pre-compute text features for medical prompts
        text_tokens = clip.tokenize(MEDICAL_PROMPTS).to(device)
        with torch.no_grad():
            text_features = model.encode_text(text_tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
        logger.info("✅ CLIP model loaded successfully!")
        print("\n" + "="*50)
        print("✅ CLIP model loaded successfully!")
        print("="*50 + "\n")
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {e}")

def compute_ood_score(image_bytes: bytes) -> float:
    """Computes similarity of the image to medical prompts. Returns score [0, 1]."""
    if model is None or preprocess is None:
        logger.warning("CLIP model not loaded, skipping OOD check.")
        return 1.0 # Default to valid if not loaded
        
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_input = preprocess(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
            # Compute cosine similarity
            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            # Or raw cosine similarity for absolute thresholding:
            raw_similarity = (image_features @ text_features.T).squeeze()
            if raw_similarity.dim() == 0: # single element
                max_score = raw_similarity.item()
            else:
                max_score = raw_similarity.max().item()
                
            return max_score
            
    except Exception as e:
        logger.error(f"Error during OOD score computation: {e}")
        return 1.0


def is_medical_image(image_bytes: bytes, threshold: float = OOD_THRESHOLD) -> tuple[bool, float]:
    """Returns (is_valid, score) for the given image."""
    score = compute_ood_score(image_bytes)
    return (score >= threshold, score)
