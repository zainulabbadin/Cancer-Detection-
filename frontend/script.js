const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const imagePreview = document.getElementById('imagePreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultBox = document.getElementById('resultBox');
const loading = document.getElementById('loading');
const predValue = document.getElementById('predValue');
const confValue = document.getElementById('confValue');
const systemMsg = document.getElementById('systemMsg');

// ==================== AUTHENTICATION CHECK ====================
// Check if user is authenticated, redirect to sign in if not
if (!window.authUtils.isAuthenticated()) {
    window.authUtils.redirectTo('signin.html');
}

// Fetch and display current user info
async function loadUserInfo() {
    const token = window.authUtils.getToken();
    try {
        const response = await fetch('http://127.0.0.1:8001/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            document.getElementById('usernameDisplay').textContent = `👤 ${userData.username}`;
            document.getElementById('userInfo').style.display = 'flex';
        } else {
            // Token is invalid, redirect to sign in
            window.authUtils.logout();
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load user info on page load
loadUserInfo();

// Logout handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        window.authUtils.logout();
    }
}

// ==================== IMAGE ANALYSIS ====================

let selectedFile = null;

// Handle File Selection
fileInput.addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        selectedFile = e.target.files[0];
        fileName.textContent = selectedFile.name;

        // Show Preview
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(selectedFile);

        analyzeBtn.disabled = false;
        resultBox.style.display = 'none';
    }
});

// Handle Analyze Button Click
analyzeBtn.addEventListener('click', async function () {
    if (!selectedFile) return;

    // UI Updates
    analyzeBtn.disabled = true;
    loading.style.display = 'block';
    resultBox.style.display = 'none';

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        // Get authentication token
        const token = window.authUtils.getToken();

        // Send to Backend
        const response = await fetch('http://127.0.0.1:8001/predict', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Display Results
            predValue.textContent = data.prediction;
            confValue.textContent = (data.confidence * 100).toFixed(2) + "%";
            systemMsg.textContent = data.message;

            // Color coding
            if (data.prediction.includes("Malignant")) {
                predValue.style.color = "#dc2626"; // Red
            } else {
                predValue.style.color = "#16a34a"; // Green
            }

            resultBox.style.display = 'block';
        } else if (response.status === 401) {
            // Unauthorized - token expired or invalid
            alert("Session expired. Please sign in again.");
            window.authUtils.logout();
        } else {
            alert("Error: " + data.detail);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Could not connect to backend. Make sure it's running on port 8001.");
    } finally {
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
});