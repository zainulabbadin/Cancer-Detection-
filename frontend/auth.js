// API Base URL
const API_URL = 'http://127.0.0.1:8001';

// ==================== UTILITY FUNCTIONS ====================

// Store authentication token
function setToken(token) {
    localStorage.setItem('auth_token', token);
}

// Get authentication token
function getToken() {
    return localStorage.getItem('auth_token');
}

// Remove authentication token
function removeToken() {
    localStorage.removeItem('auth_token');
}

// Check if user is authenticated
function isAuthenticated() {
    return getToken() !== null;
}

// Redirect to page
function redirectTo(page) {
    window.location.href = page;
}

// Display error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Clear error message
function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Clear all errors
function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-msg');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

// ==================== SIGN UP FUNCTIONALITY ====================

if (document.getElementById('signupForm')) {
    const signupForm = document.getElementById('signupForm');
    const signupBtn = document.getElementById('signupBtn');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        // Get form values
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validation
        let hasError = false;

        if (!email) {
            showError('emailError', 'Email is required');
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('emailError', 'Invalid email format');
            hasError = true;
        }

        if (!username) {
            showError('usernameError', 'Username is required');
            hasError = true;
        } else if (username.length < 3) {
            showError('usernameError', 'Username must be at least 3 characters');
            hasError = true;
        }

        if (!password) {
            showError('passwordError', 'Password is required');
            hasError = true;
        } else if (password.length < 6) {
            showError('passwordError', 'Password must be at least 6 characters');
            hasError = true;
        }

        if (password !== confirmPassword) {
            showError('confirmPasswordError', 'Passwords do not match');
            hasError = true;
        }

        if (hasError) return;

        // Disable button and show loading
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating Account...';

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Success - redirect to sign in
                alert('Account created successfully! Please sign in.');
                redirectTo('signin.html');
            } else {
                // Show error from server
                showError('generalError', data.detail || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('generalError', 'Could not connect to server. Please ensure the backend is running.');
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account';
        }
    });
}

// ==================== SIGN IN FUNCTIONALITY ====================

if (document.getElementById('signinForm')) {
    const signinForm = document.getElementById('signinForm');
    const signinBtn = document.getElementById('signinBtn');

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Client-side validation
        let hasError = false;

        if (!email) {
            showError('emailError', 'Email is required');
            hasError = true;
        }

        if (!password) {
            showError('passwordError', 'Password is required');
            hasError = true;
        }

        if (hasError) return;

        // Disable button and show loading
        signinBtn.disabled = true;
        signinBtn.textContent = 'Signing In...';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token
                setToken(data.access_token);

                // Redirect to main page
                redirectTo('index.html');
            } else {
                // Show error from server
                showError('generalError', data.detail || 'Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            showError('generalError', 'Could not connect to server. Please ensure the backend is running.');
        } finally {
            signinBtn.disabled = false;
            signinBtn.textContent = 'Sign In';
        }
    });
}

// ==================== LOGOUT FUNCTIONALITY ====================

function logout() {
    removeToken();
    redirectTo('signin.html');
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.authUtils = {
        isAuthenticated,
        getToken,
        setToken,
        removeToken,
        logout,
        redirectTo,
        showError,
        clearError,
        clearAllErrors
    };
}
