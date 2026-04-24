/**
 * UIManager — View Layer (MVC)
 * ─────────────────────────────────────────────────────
 * Responsibility:
 *   - All DOM reads/writes for the upload page (index.html)
 *   - Zero fetch() calls — strictly DOM manipulation
 *   - Called by app.controller.js (the orchestrator)
 * ─────────────────────────────────────────────────────
 */

class UIManager {

    // ── Helpers ──────────────────────────────────────────
    static _el(id) { return document.getElementById(id); }

    static _setStatus(message, type = '') {
        const el = this._el('upload-status');
        if (!el) return;
        el.textContent = message;
        el.className   = `upload-status ${type}`.trim();
    }

    // ── Upload State ─────────────────────────────────────

    /** Reset to initial upload box state */
    static showUploadState() {
        const dropZone    = this._el('drop-zone');
        const previewArea = this._el('preview-area');
        const btn         = this._el('btn-process');
        const imgEl       = this._el('preview-img');

        if (dropZone)    dropZone.style.display    = 'block';
        if (previewArea) previewArea.style.display  = 'none';
        if (imgEl)       imgEl.src                 = '';
        if (btn) {
            btn.disabled    = true;
            btn.textContent = 'Analyze Scan';
        }

        this._setStatus('');
    }

    /** Show selected image preview, hide upload zone */
    static showImagePreview(fileObj) {
        const dropZone    = this._el('drop-zone');
        const previewArea = this._el('preview-area');
        const imgEl       = this._el('preview-img');

        if (dropZone)    dropZone.style.display    = 'none';
        if (previewArea) previewArea.style.display  = 'flex';

        if (imgEl && fileObj) {
            const reader = new FileReader();
            reader.onload = (e) => { imgEl.src = e.target.result; };
            reader.readAsDataURL(fileObj);
        }
    }

    // ── Button States ─────────────────────────────────────

    static enableAnalyzeButton() {
        const btn = this._el('btn-process');
        if (btn) {
            btn.disabled    = false;
            btn.textContent = 'Analyze Scan';
        }
    }

    static disableAnalyzeButton(text = 'Analyzing…') {
        const btn = this._el('btn-process');
        if (btn) {
            btn.disabled    = true;
            btn.textContent = text;
        }
    }

    // ── Status Messages ───────────────────────────────────

    static showAnalyzingStatus() {
        this._setStatus('Running AI diagnostic pipeline…', 'info');
    }

    static showErrorStatus(message) {
        this._setStatus(message, 'error');
    }

    // ── Nav Username ──────────────────────────────────────

    static setNavUsername() {
        const token = localStorage.getItem('cancer_ai_token');
        const fullname = localStorage.getItem('user_fullname');
        const email = localStorage.getItem('user_email');
        const el = this._el('nav-username');
        if (!el) return;

        if (fullname) {
            el.textContent = `Welcome, Mr. ${fullname}`;
        } else if (email) {
            el.textContent = `Welcome, Mr. ${email.split('@')[0]}`;
        } else if (!token) {
            // Not logged in — redirect
            window.location.href = 'signin.html';
        }
    }
}
