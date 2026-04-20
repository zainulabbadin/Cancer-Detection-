import '../models/auth.model.js';

const API_URL = 'http://127.0.0.1:8000'; // Make sure this matches backend port

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) { 
        el.textContent = message; 
        el.style.display = 'block'; 
    }
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

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const btnSubmit = document.getElementById('btnSubmit');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Creating Account...';

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
                showError('generalError', data.detail || 'Registration failed.');
            }
        } catch {
            showError('generalError', 'Could not connect to server.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Create Account';
        }
    });
}

const signinForm = document.getElementById('signinForm');
if (signinForm) {
    const btnSubmit = document.getElementById('btnSubmit');

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Signing In...';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                // Try to get username if returned, else default
                localStorage.setItem('username', email.split('@')[0]);
                redirectTo('index.html');
            } else {
                showError('generalError', data.detail || 'Invalid credentials.');
            }
        } catch (err) {
            console.error(err);
            showError('generalError', 'Could not connect to server.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Sign In';
        }
    });
}
