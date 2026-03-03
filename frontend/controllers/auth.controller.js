/**
 * CONTROLLER — Auth Controller
 * Responsible for: signup/signin/logout form handling, API calls for auth.
 * Reads from: AuthModel (state), DOM (inputs)
 * Writes to: DOM (error messages, redirects)
 */

const API_URL = 'http://127.0.0.1:8001';

// ── Helpers ──────────────────────────────────────────────────────────────────

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = message; el.style.display = 'block'; }
}

function clearAllErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

function redirectTo(page) {
    window.location.href = page;
}

// ── Sign Up ──────────────────────────────────────────────────────────────────

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const signupBtn = document.getElementById('signupBtn');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validation
        let hasError = false;
        if (!email) { showError('emailError', 'Email is required'); hasError = true; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('emailError', 'Invalid email format'); hasError = true; }
        if (!username) { showError('usernameError', 'Username is required'); hasError = true; }
        else if (username.length < 3) { showError('usernameError', 'Username must be at least 3 characters'); hasError = true; }
        if (!password) { showError('passwordError', 'Password is required'); hasError = true; }
        else if (password.length < 6) { showError('passwordError', 'Password must be at least 6 characters'); hasError = true; }
        if (password !== confirmPassword) { showError('confirmPasswordError', 'Passwords do not match'); hasError = true; }
        if (hasError) return;

        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating Account...';

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });
            const data = await response.json();

            if (response.ok) {
                alert('Account created successfully! Please sign in.');
                redirectTo('signin.html');
            } else {
                showError('generalError', data.detail || 'Registration failed. Please try again.');
            }
        } catch {
            showError('generalError', 'Could not connect to server. Please ensure the backend is running.');
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account';
        }
    });
}

// ── Sign In ──────────────────────────────────────────────────────────────────

const signinForm = document.getElementById('signinForm');
if (signinForm) {
    const signinBtn = document.getElementById('signinBtn');

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        let hasError = false;
        if (!email) { showError('emailError', 'Email is required'); hasError = true; }
        if (!password) { showError('passwordError', 'Password is required'); hasError = true; }
        if (hasError) return;

        signinBtn.disabled = true;
        signinBtn.textContent = 'Signing In...';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                window.AuthModel.setToken(data.access_token);
                redirectTo('index.html');
            } else {
                showError('generalError', data.detail || 'Invalid credentials. Please try again.');
            }
        } catch {
            showError('generalError', 'Could not connect to server. Please ensure the backend is running.');
        } finally {
            signinBtn.disabled = false;
            signinBtn.textContent = 'Sign In';
        }
    });
}

// ── Logout ───────────────────────────────────────────────────────────────────

function logout() {
    window.AuthModel.removeToken();
    redirectTo('signin.html');
}

// Make logout available globally (used by inline onclick in HTML)
window.handleLogout = function () {
    if (confirm('Are you sure you want to logout?')) logout();
};
