/**
 * CONTROLLER — App Controller
 * Responsible for: image upload, analyze button, result display, PDF download.
 * Reads from: AuthModel (token), DOM (file input, buttons)
 * Writes to: DOM (result box, preview, loading state)
 */

const API_URL = 'http://127.0.0.1:8001';

// ── Auth Guard ───────────────────────────────────────────────────────────────
if (!window.AuthModel.isAuthenticated()) {
    window.location.href = 'signin.html';
}

// ── DOM Refs ─────────────────────────────────────────────────────────────────
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const imagePreview = document.getElementById('imagePreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultBox = document.getElementById('resultBox');
const loading = document.getElementById('loading');
const predValue = document.getElementById('predValue');
const confValue = document.getElementById('confValue');
const systemMsg = document.getElementById('systemMsg');
const imageIdValue = document.getElementById('imageIdValue');
const dateValue = document.getElementById('dateValue');

// ── State ────────────────────────────────────────────────────────────────────
let selectedFile = null;
let lastDiagnosis = null;

// ── Utility Functions ─────────────────────────────────────────────────────────

function generatePatientImageId(filename) {
    const timestamp = Date.now();
    const base = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
    const suffix = timestamp.toString().slice(-6);
    return `IMG-${base}-${suffix}`;
}

function formatDateTime() {
    return new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
}

// ── Load and display logged-in user's username ────────────────────────────────

async function loadUserInfo() {
    const token = window.AuthModel.getToken();
    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const userData = await response.json();
            document.getElementById('usernameDisplay').textContent = `👤 ${userData.username}`;
            document.getElementById('userInfo').style.display = 'flex';
        } else {
            window.AuthModel.removeToken();
            window.location.href = 'signin.html';
        }
    } catch (err) {
        console.error('Error loading user info:', err);
    }
}
loadUserInfo();

// ── File Selection ────────────────────────────────────────────────────────────

fileInput.addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        selectedFile = e.target.files[0];
        fileName.textContent = selectedFile.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(selectedFile);

        analyzeBtn.disabled = false;
        resultBox.style.display = 'none';
        lastDiagnosis = null;
    }
});

// ── Analyze ───────────────────────────────────────────────────────────────────

analyzeBtn.addEventListener('click', async function () {
    if (!selectedFile) return;

    analyzeBtn.disabled = true;
    loading.style.display = 'block';
    resultBox.style.display = 'none';

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        const token = window.AuthModel.getToken();
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            const patientImageId = generatePatientImageId(selectedFile.name);
            const diagnosisDate = formatDateTime();
            const confidencePercent = (data.confidence * 100).toFixed(2) + '%';

            // Store for PDF generation
            lastDiagnosis = {
                patientImageId,
                cancerType: data.prediction,
                confidence: confidencePercent,
                date: diagnosisDate,
                filename: selectedFile.name,
                message: data.message
            };

            // Update View
            imageIdValue.textContent = patientImageId;
            predValue.textContent = data.prediction;
            confValue.textContent = confidencePercent;
            dateValue.textContent = diagnosisDate;
            systemMsg.textContent = data.message;
            predValue.style.color = data.prediction.includes('Malignant') ? '#dc2626' : '#16a34a';
            resultBox.style.display = 'block';

        } else if (response.status === 401) {
            alert('Session expired. Please sign in again.');
            window.AuthModel.removeToken();
            window.location.href = 'signin.html';
        } else {
            alert('Error: ' + data.detail);
        }
    } catch {
        alert("Could not connect to backend. Make sure it's running on port 8001.");
    } finally {
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
});

// ── PDF Generation ────────────────────────────────────────────────────────────

window.downloadDiagnosisPDF = function () {
    if (!lastDiagnosis) {
        alert('No diagnosis data available. Please analyze an image first.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 90, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text('Medical AI Diagnostic', pageWidth / 2, 38, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
    doc.text('Cancer Detection System — Diagnosis Report', pageWidth / 2, 60, { align: 'center' });
    doc.setFontSize(9);
    doc.text('CONFIDENTIAL — For Medical Use Only', pageWidth / 2, 78, { align: 'center' });

    let y = 110;
    doc.setDrawColor(37, 99, 235); doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y); y += 18;

    // Report Info Section
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('Report Information', margin, y); y += 18;

    [['Patient Image ID', lastDiagnosis.patientImageId],
    ['Original Filename', lastDiagnosis.filename],
    ['Report Date & Time', lastDiagnosis.date]].forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(80, 80, 80);
        doc.text(label + ':', margin, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
        doc.text(String(value), margin + 140, y);
        y += 16;
    });

    y += 10;
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y); y += 20;

    // Diagnosis Results Section
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(30, 30, 30);
    doc.text('Diagnosis Results', margin, y); y += 18;

    const isMalignant = lastDiagnosis.cancerType.toLowerCase().includes('malignant');
    const boxColor = isMalignant ? [220, 38, 38] : [22, 163, 74];
    doc.setFillColor(...boxColor);
    doc.roundedRect(margin, y - 14, contentWidth, 30, 4, 4, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('Cancer Type: ' + lastDiagnosis.cancerType, pageWidth / 2, y + 6, { align: 'center' });
    y += 44;

    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Confidence Score:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(lastDiagnosis.confidence, margin + 140, y); y += 20;

    // Confidence bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 12, 3, 3, 'F');
    doc.setFillColor(...boxColor);
    doc.roundedRect(margin, y, contentWidth * (parseFloat(lastDiagnosis.confidence) / 100), 12, 3, 3, 'F');
    y += 28;

    if (lastDiagnosis.message) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
        doc.text(lastDiagnosis.message, pageWidth / 2, y, { align: 'center', maxWidth: contentWidth });
        y += 20;
    }

    y += 10;
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y); y += 20;

    // Disclaimer
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(150, 150, 150);
    doc.text('Disclaimer', margin, y); y += 13;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const disclaimer = 'This report is generated by an AI-based cancer detection system and is intended for informational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with any questions you may have regarding a medical condition.';
    const lines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(lines, margin, y);

    // Footer
    doc.setDrawColor(37, 99, 235); doc.setLineWidth(1);
    doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text('Medical AI Diagnostic — Cancer Detection System', margin, pageHeight - 20);
    doc.text('Generated: ' + lastDiagnosis.date, pageWidth - margin, pageHeight - 20, { align: 'right' });

    doc.save(`Diagnosis_${lastDiagnosis.patientImageId.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`);
};
