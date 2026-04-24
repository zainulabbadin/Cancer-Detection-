/**
 * Model Layer (MVC)
 * Strictly handles all external data fetching and API communication.
 * NO DOM manipulation resides here.
 */

const API_BASE_URL = 'http://localhost:8000';

class CancerModel {

    // --- Auth API ---
    static async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }
        
        const data = await response.json();
        localStorage.setItem('cancer_ai_token', data.access_token);
        
        // Fetch user profile to get full name
        try {
            const meRes = await fetch(`${API_BASE_URL}/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });
            if (meRes.ok) {
                const meData = await meRes.json();
                localStorage.setItem('user_fullname', meData.username);
                localStorage.setItem('user_email', meData.email);
            }
        } catch (e) {
            console.warn("Could not fetch user profile details.");
        }
        
        return data;
    }

    static async register(fullname, email, password, department) {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Map fullname -> username to match backend schema
            body: JSON.stringify({ username: fullname, email, password })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }
        
        return await response.json();
    }

    static getToken() {
        return localStorage.getItem('cancer_ai_token');
    }

    static logout() {
        localStorage.removeItem('cancer_ai_token');
        localStorage.removeItem('user_fullname');
        localStorage.removeItem('user_email');
    }

    // --- Core API ---
    /**
     * Submit image for the full pipeline classification
     * @param {File} imageFile 
     * @returns {Promise<Object>} JSON response 
     */
    static async runPredictionPipeline(imageFile) {
        try {
            const token = this.getToken();
            if (!token) throw new Error("Not authenticated");

            const formData = new FormData();
            formData.append('file', imageFile);

            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Prediction request failed');
            }

            return await response.json();
            
        } catch (error) {
            console.error('[Model Layer Error]', error);
            throw error;
        }
    }
}
