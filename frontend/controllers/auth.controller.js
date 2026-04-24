/**
 * Auth Controller (MVC)
 * ─────────────────────────────────────────────────────────────
 * Responsibility:
 *   - Listens to DOM events on signin-form and signup-form
 *   - Performs UI updates (messages, button states, icons)
 *   - Delegates ALL data/API calls to CancerModel (model layer)
 *   - NO fetch() calls live here — strictly UI orchestration
 * ─────────────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {

    // ─────────────────────────────────────────
    //  Shared Helpers
    // ─────────────────────────────────────────

    const SVG_EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                           <circle cx="12" cy="12" r="3"/>`;
    const SVG_EYE_OFF  = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
                           a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4
                           c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07
                           a3 3 0 1 1-4.24-4.24"/>
                           <line x1="1" y1="1" x2="23" y2="23"/>`;

    /**
     * Attach show/hide toggle to a password input.
     * @param {string} btnId   - toggle button element id
     * @param {string} inputId - password input element id
     * @param {string} svgId   - <svg> element id inside the button
     */
    function attachPasswordToggle(btnId, inputId, svgId) {
        const btn   = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        const svg   = document.getElementById(svgId);
        if (!btn || !input || !svg) return;

        btn.addEventListener('click', () => {
            const isHidden = input.type === 'password';
            input.type     = isHidden ? 'text' : 'password';
            svg.innerHTML  = isHidden ? SVG_EYE_OFF : SVG_EYE_OPEN;
            btn.setAttribute('aria-label',
                isHidden ? 'Hide password' : 'Show password');
        });
    }

    /**
     * Show an inline message in the auth-msg box.
     * @param {string} text
     * @param {'error'|'success'} type
     */
    function showMessage(text, type = 'error') {
        const box = document.getElementById('auth-msg');
        if (!box) return;
        box.textContent  = text;
        box.className    = `auth-message ${type}`;
        box.style.display = 'block';
    }

    function hideMessage() {
        const box = document.getElementById('auth-msg');
        if (box) box.style.display = 'none';
    }

    /**
     * Set a submit button into loading or normal state.
     * @param {HTMLButtonElement} btn
     * @param {boolean} loading
     * @param {string} loadingText
     * @param {string} normalText
     */
    function setButtonState(btn, loading, loadingText, normalText) {
        btn.disabled     = loading;
        btn.textContent  = loading ? loadingText : normalText;
    }

    /**
     * Clear all inline validation errors.
     */
    function clearInlineErrors() {
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        document.querySelectorAll('.field-error-msg').forEach(el => {
            el.textContent = '';
            el.classList.remove('visible');
        });
    }

    /**
     * Show an error message directly beneath a specific input field.
     */
    function showInlineError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(errorId);
        if (input) input.classList.add('input-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }
    }


    // ═════════════════════════════════════════
    //  SIGN-IN PAGE LOGIC
    // ═════════════════════════════════════════
    const signinForm = document.getElementById('signin-form');

    if (signinForm) {

        // Password toggle
        attachPasswordToggle('toggle-pw', 'password', 'eye-icon');

        const loginBtn = document.getElementById('login-btn');

        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessage();
            clearInlineErrors();

            const email    = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Client-side validation
            let hasError = false;
            if (!email) {
                showInlineError('email', 'error-email', 'Email address is required.');
                hasError = true;
            }
            if (!password) {
                showInlineError('password', 'error-password', 'Password is required.');
                hasError = true;
            }

            if (hasError) return;

            setButtonState(loginBtn, true, 'Signing in…', 'Access Portal →');

            try {
                // ── Delegate to Model ──
                await CancerModel.login(email, password);

                showMessage('Login successful! Redirecting…', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 900);

            } catch (error) {
                showMessage(error.message || 'Invalid email or password.');
                setButtonState(loginBtn, false, '', 'Access Portal →');
            }
        });
    }


    // ═════════════════════════════════════════
    //  SIGN-UP PAGE LOGIC
    // ═════════════════════════════════════════
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {

        // Password toggles
        attachPasswordToggle('toggle-pw1', 'password',         'eye1');
        attachPasswordToggle('toggle-pw2', 'confirm-password', 'eye2');

        const pwInput      = document.getElementById('password');
        const confirmInput = document.getElementById('confirm-password');
        const strengthFill = document.getElementById('strength-fill');
        const strengthLbl  = document.getElementById('strength-label');
        const matchHint    = document.getElementById('match-hint');
        const signupBtn    = document.getElementById('signup-btn');

        // ── Password Strength Bar ──────────────────
        const STRENGTH_LEVELS = [
            { pct: '0%',   color: '#e5e7eb', label: '' },
            { pct: '25%',  color: '#ef4444', label: 'Weak' },
            { pct: '50%',  color: '#f97316', label: 'Fair' },
            { pct: '75%',  color: '#eab308', label: 'Good' },
            { pct: '100%', color: '#22c55e', label: 'Strong' },
        ];

        function updateStrengthBar(value) {
            let score = 0;
            if (value.length >= 8)          score++;
            if (/[A-Z]/.test(value))        score++;
            if (/[0-9]/.test(value))        score++;
            if (/[^A-Za-z0-9]/.test(value)) score++;

            const lvl = STRENGTH_LEVELS[score];
            if (strengthFill) {
                strengthFill.style.width      = lvl.pct;
                strengthFill.style.background = lvl.color;
            }
            if (strengthLbl) {
                strengthLbl.textContent  = lvl.label;
                strengthLbl.style.color  = lvl.color;
            }
        }

        // ── Password Match Hint ────────────────────
        function updateMatchHint() {
            if (!matchHint || !confirmInput.value) {
                if (matchHint) matchHint.className = 'match-hint';
                return;
            }
            const matches = pwInput.value === confirmInput.value;
            matchHint.textContent = matches ? '✓ Passwords match' : '✗ Passwords do not match';
            matchHint.className   = `match-hint ${matches ? 'ok' : 'fail'}`;
        }

        pwInput.addEventListener('input', () => {
            updateStrengthBar(pwInput.value);
            updateMatchHint();
        });
        confirmInput.addEventListener('input', updateMatchHint);

        // ── Sign-Up Form Submit ────────────────────
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessage();
            clearInlineErrors();

            const fullname   = document.getElementById('fullname').value.trim();
            const email      = document.getElementById('email').value.trim();
            const password   = pwInput.value;
            const confirm    = confirmInput.value;
            const department = document.getElementById('department').value;
            const terms      = document.getElementById('terms').checked;

            // Client-side validation
            let hasError = false;
            
            if (!fullname) {
                showInlineError('fullname', 'error-fullname', 'Full name is required.');
                hasError = true;
            }
            if (!email) {
                showInlineError('email', 'error-email', 'Email address is required.');
                hasError = true;
            }
            if (!password) {
                showInlineError('password', 'error-password', 'Password is required.');
                hasError = true;
            } else if (password.length < 8) {
                showInlineError('password', 'error-password', 'Password must be at least 8 characters.');
                hasError = true;
            }
            if (!confirm) {
                showInlineError('confirm-password', 'error-confirm', 'Please confirm your password.');
                hasError = true;
            } else if (password !== confirm) {
                showInlineError('confirm-password', 'error-confirm', 'Passwords do not match.');
                hasError = true;
            }
            if (!department) {
                showInlineError('department', 'error-department', 'Please select a department.');
                hasError = true;
            }
            if (!terms) {
                showInlineError('terms', 'error-terms', 'You must agree to the Terms of Service.');
                hasError = true;
            }

            if (hasError) return;

            setButtonState(signupBtn, true, 'Creating account…', 'Create Account →');

            try {
                // ── Delegate to Model ──
                await CancerModel.register(fullname, email, password, department);

                showMessage('Account created! Redirecting to login…', 'success');
                setTimeout(() => { window.location.href = 'signin.html'; }, 1200);

            } catch (error) {
                showMessage(error.message || 'Registration failed. Please try again.');
                setButtonState(signupBtn, false, '', 'Create Account →');
            }
        });
    }

});
