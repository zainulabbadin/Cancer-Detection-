"""
Prediction Service — Loads the PyTorch Lightning ConvNeXt cancer classifier.

Model architecture (custom ConvNeXt variant):
  dims=[128,256,512,1024], depths=[3,3,27,3]
  - fc_main  → 8 main cancer types
  - fc_sub   → 26 cancer subtypes
  - Input: 224×224 RGB, normalised with ImageNet stats
"""

import io
import os
import random
import logging

import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision.models import ConvNeXt
from torchvision.models.convnext import CNBlockConfig

from app.config import MODEL_PATH

logger = logging.getLogger(__name__)

# ── Label Maps ───────────────────────────────────────────────────────────────

# Exact label mappings from training  (130,002 images)
# Main Class Mapping: {'ALL':0,'Brain Cancer':1,'Breast Cancer':2,'Cervical Cancer':3,
#   'Kidney Cancer':4,'Lung and Colon Cancer':5,'Lymphoma':6,'Oral Cancer':7}
MAIN_LABELS = [
    "ALL (Acute Lymphoblastic Leukemia)",  # 0
    "Brain Cancer",                         # 1
    "Breast Cancer",                        # 2
    "Cervical Cancer",                      # 3
    "Kidney Cancer",                        # 4
    "Lung and Colon Cancer",                # 5
    "Lymphoma",                             # 6
    "Oral Cancer",                          # 7
]

# Subclass Mapping (26 classes)
SUB_LABELS = [
    "ALL — Benign",                  # 0  all_benign
    "ALL — Early Stage",             # 1  all_early
    "ALL — Pre-B Stage",             # 2  all_pre
    "ALL — Pro-B Stage",             # 3  all_pro
    "Brain — Glioma",                # 4  brain_glioma
    "Brain — Meningioma",            # 5  brain_menin
    "Brain — Tumor (Other)",         # 6  brain_tumor
    "Breast — Benign",               # 7  breast_benign
    "Breast — Malignant",            # 8  breast_malignant
    "Cervix — Dyskeratosis",         # 9  cervix_dyk
    "Cervix — Koilocytosis",         # 10 cervix_koc
    "Cervix — Metaplasia",           # 11 cervix_mep
    "Cervix — Parabasal",            # 12 cervix_pab
    "Cervix — Superficial-Fibrous",  # 13 cervix_sfi
    "Kidney — Normal",               # 14 kidney_normal
    "Kidney — Tumor",                # 15 kidney_tumor
    "Colon — Adenocarcinoma",        # 16 colon_aca
    "Colon — Benign Tissue",         # 17 colon_bnt
    "Lung — Adenocarcinoma",         # 18 lung_aca
    "Lung — Benign Tissue",          # 19 lung_bnt
    "Lung — Squamous Cell Carcinoma",# 20 lung_scc
    "Lymphoma — CLL",                # 21 lymph_cll
    "Lymphoma — Follicular",         # 22 lymph_fl
    "Lymphoma — Mantle Cell",        # 23 lymph_mcl
    "Oral — Normal",                 # 24 oral_normal
    "Oral — Squamous Cell Carcinoma",# 25 oral_scc
]

# ── ImageNet normalisation constants ──────────────────────────────────────────
MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
STD  = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)

# ConvNeXt block config matching the checkpoint exactly
# dims=[128,256,512,1024], depths=[3,3,27,3]
BLOCK_SETTING = [
    CNBlockConfig(128, 256, 3),
    CNBlockConfig(256, 512, 3),
    CNBlockConfig(512, 1024, 27),
    CNBlockConfig(1024, None, 3),
]

# ── Global Model State ────────────────────────────────────────────────────────

_backbone: nn.Module | None = None
_fc_main:  nn.Linear | None = None
_fc_sub:   nn.Linear | None = None
_pool = nn.AdaptiveAvgPool2d((1, 1))
_device = "cpu"


def load_model():
    """Load the Lightning checkpoint into the reconstructed ConvNeXt model."""
    global _backbone, _fc_main, _fc_sub, _device

    if not os.path.exists(MODEL_PATH) or os.path.getsize(MODEL_PATH) == 0:
        logger.warning("⚠️  Model file missing or empty: %s", MODEL_PATH)
        logger.warning("⚠️  Running in MOCK MODE (simulated predictions).")
        return

    try:
        logger.info("Loading model from %s …", MODEL_PATH)
        print(f"\n🚀 Deep learning model found at {MODEL_PATH}, starting to load...")
        _device = "cuda" if torch.cuda.is_available() else "cpu"

        # Load Lightning checkpoint
        ckpt = torch.load(MODEL_PATH, map_location=_device, weights_only=False)
        sd   = ckpt["state_dict"]

        # ── Backbone ─────────────────────────────────────────────────────────
        backbone_net = ConvNeXt(block_setting=BLOCK_SETTING, stochastic_depth_prob=0.0)
        feat_prefix  = "model.backbone.features."
        feat_sd      = {k[len(feat_prefix):]: v
                        for k, v in sd.items() if k.startswith(feat_prefix)}
        backbone_net.features.load_state_dict(feat_sd, strict=True)
        backbone_net.features.to(_device)
        backbone_net.features.eval()
        _backbone = backbone_net.features

        # ── Heads ─────────────────────────────────────────────────────────────
        fc_main = nn.Linear(1024, 8)
        fc_main.weight.data = sd["model.fc_main.weight"]
        fc_main.bias.data   = sd["model.fc_main.bias"]
        fc_main.to(_device).eval()
        _fc_main = fc_main

        fc_sub = nn.Linear(1024, 26)
        fc_sub.weight.data = sd["model.fc_sub.weight"]
        fc_sub.bias.data   = sd["model.fc_sub.bias"]
        fc_sub.to(_device).eval()
        _fc_sub = fc_sub

        logger.info("✅ Cancer model loaded successfully! (device=%s)", _device)
        print("\n" + "="*50)
        print("✅ Deep learning model loaded successfully!")
        print("="*50 + "\n")

    except Exception as e:
        logger.error("❌ Error loading model: %s", e)
        _backbone = _fc_main = _fc_sub = None


# ── Inference ─────────────────────────────────────────────────────────────────

def _preprocess(image_bytes: bytes) -> torch.Tensor:
    """Convert raw image bytes → normalised (1,3,224,224) tensor."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224), Image.BILINEAR)
    arr = np.array(img, dtype="float32") / 255.0
    t   = torch.from_numpy(arr).permute(2, 0, 1)   # (3,H,W)
    t   = (t - MEAN) / STD
    return t.unsqueeze(0).to(_device)              # (1,3,H,W)


def predict(image_bytes: bytes) -> tuple[str, float, bool]:
    """
    Returns (label, confidence, is_mock).
      label      — "MainType — SubType"
      confidence — softmax prob of the top main class [0,1]
      is_mock    — True when no real model is loaded
    """
    if _backbone is None or _fc_main is None or _fc_sub is None:
        # Mock mode
        main_idx = random.randint(0, len(MAIN_LABELS) - 1)
        sub_idx  = random.randint(0, len(SUB_LABELS)  - 1)
        label    = f"{MAIN_LABELS[main_idx]} — {SUB_LABELS[sub_idx]}"
        return label, round(random.uniform(0.55, 0.98), 4), True

    tensor = _preprocess(image_bytes)
    with torch.no_grad():
        feats      = _backbone(tensor)
        feats      = _pool(feats).flatten(1)
        probs_main = torch.softmax(_fc_main(feats), dim=1)[0]
        probs_sub  = torch.softmax(_fc_sub(feats),  dim=1)[0]

    main_idx   = int(probs_main.argmax())
    sub_idx    = int(probs_sub.argmax())
    confidence = float(probs_main[main_idx])
    label      = f"{MAIN_LABELS[main_idx]} — {SUB_LABELS[sub_idx]}"

    return label, confidence, False
