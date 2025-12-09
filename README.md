# Cancer Detection System

A web-based application to detect cancer from medical images using Deep Learning.

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, FastAPI
- **ML Engine:** TensorFlow / Keras

## Setup Instructions

### 1. Backend Setup
Navigate to the backend folder:
```bash
cd backend



---

### How to Run This

1.  **Copy/Paste:** Copy the code blocks above into the corresponding files we created earlier.
2.  **Terminal 1 (Backend):**
    ```bash
    cd backend
    uvicorn app.main:app --reload
    ```
3.  **Terminal 2 (Frontend):**
    Open `frontend/index.html` in Chrome/Firefox.
4.  **Test:** Upload an image and click Analyze. Since you likely don't have the real model file yet, it will say "Analysis successful (SIMULATED MODE)" and give you a random result to prove the system works.