/**
 * MODEL — Auth State Management
 * Responsible for: token storage, auth state queries.
 * No DOM access. No API calls.
 */

const AUTH_TOKEN_KEY = 'auth_token';

function setToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function removeToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

function isAuthenticated() {
    return getToken() !== null;
}

// Expose on window for scripts that cannot use ES modules
window.AuthModel = { setToken, getToken, removeToken, isAuthenticated };
