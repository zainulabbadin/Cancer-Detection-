let selectedFile = null;

// Auth check
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signin.html';
        return null;
    }
    const username = localStorage.getItem('username') || 'Doctor';
    document.getElementById('welcomeMessage').textContent = `Welcome, Dr. ${username}`;
    return token;
}

// Show Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        if(container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    const token = checkAuth();
    if (!token) return;

    // Elements
    const btnLogout = document.getElementById('btnLogout');
    const uploadZone = document.getElementById('uploadZone');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const btnAnalyze = document.getElementById('btnAnalyze');
    
    // Pipeline & Result Elements
    const pipelineContainer = document.getElementById('pipelineContainer');
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3')
    ];
    const resultContainer = document.getElementById('resultContainer');
    const oodBadge = document.getElementById('oodBadge');
    const resultType = document.getElementById('resultType');
    const resultConfidence = document.getElementById('resultConfidence');
    const confidenceRing = document.getElementById('confidenceRing');
    const resultMessage = document.getElementById('resultMessage');
    const btnDownloadPdf = document.getElementById('btnDownloadPdf');

    // Logout
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'signin.html';
    });

    // File Selection
    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
            btnAnalyze.disabled = false;
            
            // Reset UI
            pipelineContainer.style.display = 'none';
            resultContainer.style.display = 'none';
            steps.forEach(s => {
                s.classList.remove('active', 'done');
            });
            btnDownloadPdf.style.display = 'none';
        } else {
            showToast('Please select a valid image file (JPEG/PNG).', 'error');
        }
    }

    // Drag and Drop
    uploadZone.addEventListener('click', () => imageInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Analyze Process
    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function setStep(index, state) {
        if (state === 'active') {
            steps[index].classList.add('active');
        } else if (state === 'done') {
            steps[index].classList.remove('active');
            steps[index].classList.add('done');
        }
    }

    btnAnalyze.addEventListener('click', async () => {
        if (!selectedFile) return;

        btnAnalyze.disabled = true;
        btnAnalyze.textContent = 'Processing...';
        
        // Reset and Show Pipeline
        resultContainer.style.display = 'none';
        steps.forEach(s => s.classList.remove('active', 'done'));
        pipelineContainer.style.display = 'flex';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // STEP 1: OOD Check (Simulated fast start)
            await setStep(0, 'active');
            
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            await delay(1000); // Visual buffer for step 1
            await setStep(0, 'done');

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'signin.html';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Analysis failed');
            }

            // Processing based on OOD result
            if (!data.is_valid) {
                // Rejected by OOD
                showToast('Image rejected: Not a medical image', 'error');
                
                resultContainer.style.display = 'block';
                oodBadge.textContent = "Invalid Medical Image";
                oodBadge.className = "ood-badge ood-invalid";
                
                document.getElementById('predictionDetails').style.display = 'none';
                resultMessage.textContent = data.message;
                
                btnAnalyze.textContent = 'Analyze Scan';
                btnAnalyze.disabled = false;
                return;
            }

            // STEP 2: ML Model Processing
            await setStep(1, 'active');
            await delay(1500); // Visual buffer to simulate model time if fast
            await setStep(1, 'done');

            // STEP 3: Formatting Results
            await setStep(2, 'active');
            await delay(800);
            await setStep(2, 'done');

            // Show Validation Success
            showToast('Analysis completed successfully');
            
            // Populate Results
            resultContainer.style.display = 'block';
            document.getElementById('predictionDetails').style.display = 'flex';
            
            oodBadge.textContent = "Valid Medical Image (" + (data.ood_score.toFixed(2)) + ")";
            oodBadge.className = "ood-badge ood-valid";
            
            resultType.textContent = data.prediction;
            resultMessage.textContent = data.message;
            
            // Animate Confidence Ring
            const confValue = (data.confidence * 100).toFixed(1);
            resultConfidence.textContent = `${confValue}%`;
            
            // Circumference is 251.2
            const offset = 251.2 - (251.2 * confValue) / 100;
            setTimeout(() => {
                confidenceRing.style.strokeDashoffset = offset;
            }, 100);

            // PDF Data Prep
            window.latestResult = data;
            btnDownloadPdf.style.display = 'block';

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
            steps.forEach(s => s.classList.remove('active'));
        } finally {
            btnAnalyze.textContent = 'Analyze Scan';
            btnAnalyze.disabled = false;
        }
    });

    // PDF Generation
    btnDownloadPdf.addEventListener('click', () => {
        if (!window.latestResult || !window.jspdf) {
            showToast("Cannot generate PDF.", 'error');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const data = window.latestResult;
            const date = new Date().toLocaleString();
            
            doc.setFontSize(22);
            doc.text("Cancer Detection Report", 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Date & Time: ${date}`, 20, 35);
            doc.text(`File Analyzed: ${data.filename}`, 20, 45);
            
            doc.setLineWidth(0.5);
            doc.line(20, 50, 190, 50);

            if (!data.is_valid) {
                 doc.setTextColor(239, 68, 68);
                 doc.text("Status: INVALID MEDICAL IMAGE", 20, 65);
                 doc.setTextColor(0,0,0);
                 doc.text(`Message: ${data.message}`, 20, 75);
            } else {
                 doc.text(`Validation Score: ${data.ood_score.toFixed(3)} (Valid Medical Image)`, 20, 65);
                 doc.text(`Detected Condition: ${data.prediction}`, 20, 75);
                 doc.text(`Confidence Level: ${(data.confidence * 100).toFixed(2)}%`, 20, 85);
                 doc.text(`Message: ${data.message}`, 20, 95);
            }
            
            doc.save(`Medical_Report_${data.filename}.pdf`);
            showToast("Report downloaded successfully!");
        } catch (err) {
            console.error("PDF generation failed:", err);
            showToast("PDF generation failed.", "error");
        }
    });
});
