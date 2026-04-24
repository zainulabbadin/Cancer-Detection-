/**
 * Result Controller (MVC)
 * ─────────────────────────────────────────────────────
 * Responsibility:
 *   - Reads diagnosis result from localStorage (set by app.controller.js)
 *   - Populates all result UI elements (DOM manipulation only)
 *   - Fills hidden PDF data store for PDFController
 *   - Binds Logout and PDF Download buttons
 * ─────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Read data from localStorage ──────────────────────
    const imgSrc     = localStorage.getItem('result_image')      || '';
    const rId        = localStorage.getItem('result_id')         || 'IMG-000000';
    const filename   = localStorage.getItem('result_filename')   || 'scan.jpg';
    const reportDate = localStorage.getItem('result_date')       || '—';
    const diagnosis  = localStorage.getItem('result_diagnosis')  || 'Unknown';
    const percRaw    = parseFloat(localStorage.getItem('result_confidence') || '0');
    const oodScore   = parseFloat(localStorage.getItem('result_ood_score')  || '0');
    const isValid    = localStorage.getItem('result_is_valid') !== 'false';

    const perc    = (percRaw * 100).toFixed(1);
    const percInt = Math.round(percRaw * 100);

    // ── Detect cancer / benign ───────────────────────────
    const isCancer = isValid &&
        !diagnosis.toLowerCase().includes('benign') &&
        !diagnosis.toLowerCase().includes('normal');

    // ── Scanned image ────────────────────────────────────
    const imgEl = document.getElementById('result-img');
    if (imgEl && imgSrc) imgEl.src = imgSrc;

    // ── Badge ────────────────────────────────────────────
    const badge = document.getElementById('result-badge');
    if (badge) {
        if (!isValid) {
            badge.textContent  = 'Invalid Image';
            badge.className    = 'result-badge badge-invalid';
        } else if (isCancer) {
            badge.textContent  = 'Cancer Detected';
            badge.className    = 'result-badge badge-danger';
        } else {
            badge.textContent  = 'No Cancer Detected';
            badge.className    = 'result-badge badge-safe';
        }
    }

    // ── Report info rows ─────────────────────────────────
    _setText('res-id',       rId);
    _setText('res-filename', filename);
    _setText('res-date',     reportDate);

    // ── Diagnosis card ───────────────────────────────────
    const diagnosisBox = document.getElementById('diagnosis-main-box');
    if (diagnosisBox && isCancer) diagnosisBox.classList.add('is-danger');

    _setText('res-diagnosis-text', diagnosis);
    _setText('res-diagnosis-sub',  isValid ? 'Deep learning classification result' : 'Image failed OOD validation');
    _setText('res-perc',           `${perc}%`);
    _setText('res-conf-pct',       `${perc}%`);

    // ── Confidence bar ───────────────────────────────────
    const barFill = document.getElementById('res-conf-fill');
    if (barFill) {
        barFill.style.width      = `${percInt}%`;
        barFill.style.background = isCancer ? '#ef4444' : '#34d399';
    }

    // ── Circular SVG progress ────────────────────────────
    // r=38 → circumference = 2*π*38 ≈ 238.8
    const CIRCUMFERENCE = 238.8;
    const circleProg = document.getElementById('res-circle');
    if (circleProg) {
        const offset = CIRCUMFERENCE - (percRaw * CIRCUMFERENCE);
        circleProg.classList.toggle('circle-danger', isCancer);
        setTimeout(() => {
            circleProg.style.strokeDashoffset = offset;
        }, 100);
    }

    // ── Result note ──────────────────────────────────────
    _setText('res-note', isValid ? 'Analysis completed by AI Diagnostic Engine.' : 'Image rejected — not a valid medical scan.');

    // ── Populate hidden PDF data store ───────────────────
    _setText('pdf-id',          rId);
    _setText('pdf-filename',    filename);
    _setText('pdf-date',        reportDate);
    _setText('pdf-result-text', diagnosis);
    _setText('pdf-conf-text',   `${perc}%`);
    const pdfFill = document.getElementById('pdf-conf-fill');
    if (pdfFill) pdfFill.setAttribute('data-value', percInt.toString());

    // ── Bind PDF Download ────────────────────────────────
    PDFController.bindDownloadButton();

    // ── Logout ───────────────────────────────────────────
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            CancerModel.logout();
            window.location.href = 'signin.html';
        });
    }

    // ── Nav username ─────────────────────────────────────
    const fullname = localStorage.getItem('user_fullname');
    const email = localStorage.getItem('user_email') || '';
    const nameEl = document.getElementById('nav-username');
    if (nameEl) {
        if (fullname) {
            nameEl.textContent = `Welcome, Mr. ${fullname}`;
        } else if (email) {
            nameEl.textContent = `Welcome, Mr. ${email.split('@')[0]}`;
        }
    }

    // ── Helper ───────────────────────────────────────────
    function _setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
});
