/**
 * App Controller (MVC)
 * Orchestrates DOM events — wires Upload, Pipeline, and Auth flows.
 * PDF logic is fully delegated to pdf.controller.js (PDFController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Logout Binding ───────────────────────────────────────
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            CancerModel.logout();
            window.location.href = 'signin.html';
        });
    }

    const dropZone  = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('btn-process');

    let activeFile = null;

    // Exit early if this page doesn't have the upload section
    if (!dropZone || !processBtn) return;

    // ── Upload: Click & Drag & Drop ──────────────────────────
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--btn-blue)';
        dropZone.style.background  = 'rgba(29, 161, 242, 0.05)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background  = '';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background  = '';
        if (e.dataTransfer.files?.length > 0) {
            _handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files?.length > 0) {
            _handleFileSelection(e.target.files[0]);
        }
    });

    function _handleFileSelection(file) {
        if (!file.type.startsWith('image/')) {
            alert('Invalid format. Please upload a JPEG or PNG image.');
            return;
        }
        activeFile = file;
        UIManager.showImagePreview(file);
        UIManager.enablePredictButton();
    }

    // ── Analyze: Pipeline Orchestrator ───────────────────────
    processBtn.addEventListener('click', async () => {
        if (!activeFile) return;

        UIManager.disablePredictButton();
        UIManager.animatePipelineSteps();

        try {
            const objectUrl = URL.createObjectURL(activeFile);
            const result    = await CancerModel.runPredictionPipeline(activeFile);

            setTimeout(() => {
                if (result.is_valid === false) {
                    UIManager.showErrorState(result, objectUrl, activeFile.name);
                } else {
                    UIManager.showSuccessState(result, objectUrl, activeFile.name);
                }
                UIManager.enablePredictButton();
            }, 1000);

        } catch (error) {
            alert('System Error: ' + error.message);
            UIManager.showUploadState();
            UIManager.enablePredictButton();
        }
    });

    // ── PDF Download ─────────────────────────────────────────
    // Delegated entirely to pdf.controller.js
    PDFController.bindDownloadButton();
});
