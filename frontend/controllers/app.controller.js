/**
 * AppController — Controller Layer (MVC)
 * ─────────────────────────────────────────────────────
 * Responsibility:
 *   - Bind DOM events on index.html (upload page)
 *   - Orchestrate the flow: select → preview → analyze → redirect
 *   - Delegate UI changes to UIManager
 *   - Delegate API calls to CancerModel
 *   - NO direct DOM manipulation (use UIManager methods)
 *   - NO fetch() calls (use CancerModel methods)
 * ─────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Auth Guard & Nav ──────────────────────────────────
    UIManager.setNavUsername();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            CancerModel.logout();
            window.location.href = 'signin.html';
        });
    }

    // ── Element Refs ──────────────────────────────────────
    const dropZone   = document.getElementById('drop-zone');
    const fileInput  = document.getElementById('file-input');
    const processBtn = document.getElementById('btn-process');
    const removeBtn  = document.getElementById('btn-remove-image');

    // Guard: exit early if upload section not on this page
    if (!dropZone || !processBtn) return;

    // ── State ─────────────────────────────────────────────
    let activeFile = null;

    // ── Upload: Click to Browse ───────────────────────────
    dropZone.addEventListener('click',  () => fileInput.click());
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) _handleFileSelection(file);
    });

    // ── Remove Image ──────────────────────────────────────
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            activeFile       = null;
            fileInput.value  = '';
            UIManager.showUploadState();
        });
    }

    // ── File Validation ───────────────────────────────────
    function _handleFileSelection(file) {
        const ALLOWED = ['image/jpeg', 'image/png'];
        if (!ALLOWED.includes(file.type)) {
            UIManager.showErrorStatus('Invalid format. Please upload a JPEG or PNG image.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10 MB limit
            UIManager.showErrorStatus('File too large. Maximum size is 10 MB.');
            return;
        }
        activeFile = file;
        UIManager.showImagePreview(file);
        UIManager.enableAnalyzeButton();
    }

    // ── Analyze: API Call → localStorage → Redirect ───────
    processBtn.addEventListener('click', async () => {
        if (!activeFile) return;

        UIManager.disableAnalyzeButton('Analyzing…');
        UIManager.showAnalyzingStatus();

        try {
            const result = await CancerModel.runPredictionPipeline(activeFile);

            // Save all result data to localStorage for result.html
            const rId     = `IMG-${Math.random().toString().slice(2, 8).toUpperCase()}`;
            const dateStr = new Date().toLocaleString('en-US');

            // Convert image to base64 then redirect
            const reader = new FileReader();
            reader.onload = (e) => {
                const store = {
                    result_image:      e.target.result,
                    result_id:         rId,
                    result_filename:   activeFile.name,
                    result_date:       dateStr,
                    result_diagnosis:  result.prediction || result.main_class || 'Unknown',
                    result_confidence: String(result.confidence   ?? 0),
                    result_ood_score:  String(result.ood_score     ?? 0),
                    result_is_valid:   String(result.is_valid !== false),
                };
                Object.entries(store).forEach(([k, v]) => localStorage.setItem(k, v));

                // Small delay so user sees the analyzing state
                setTimeout(() => { window.location.href = 'result.html'; }, 800);
            };
            reader.readAsDataURL(activeFile);

        } catch (error) {
            UIManager.showErrorStatus(`Error: ${error.message}`);
            UIManager.enableAnalyzeButton();
        }
    });

});
