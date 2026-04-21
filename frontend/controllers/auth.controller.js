/**
 * Auth Controller (MVC)
 * Strictly handles SignIn and SignUp UI Events.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');

    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = signinForm.querySelector('button');
            
            btn.innerText = 'Authenticating...';
            btn.disabled = true;

            try {
                // Call real login API
                await CancerModel.login(email, password);
                window.location.href = 'index.html';
            } catch (error) {
                alert('Login Failed: ' + error.message);
                btn.innerText = 'Secure Login';
                btn.disabled = false;
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = signupForm.querySelector('button');
            
            btn.innerText = 'Creating Account...';
            btn.disabled = true;

            try {
                // Call real register API
                await CancerModel.register(fullname, email, password);
                alert('Account created! Please sign in.');
                window.location.href = 'signin.html';
            } catch (error) {
                alert('Registration Failed: ' + error.message);
                btn.innerText = 'Create Account';
                btn.disabled = false;
            }
        });
    }

});
