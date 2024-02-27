document.getElementById('show-login').addEventListener('click', function() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('show-login').classList.add('login-active');
    document.getElementById('show-register').classList.remove('login-active');
});
document.getElementById('show-register').addEventListener('click', function() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('show-login').classList.remove('login-active');
    document.getElementById('show-register').classList.add('login-active');
});

function checkPassword() {
    var password = document.getElementById('register-password').value;
    var confirmPassword = document.getElementById('register-confirm-password').value;
    if (password !== confirmPassword) {
        document.getElementById('register-confirm-password').setCustomValidity('Passwords do not match');
        document.getElementById('register-confirm-password').reportValidity();
        return false;
    } else {
        document.getElementById('register-confirm-password').setCustomValidity('');
        return true;
    }
}

async function register() {
    if (!checkPassword()) return;
    document.getElementById('register-button').disabled = true;
    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: document.getElementById('register-username').value,
            password: document.getElementById('register-password').value,
            role: document.getElementById('is-teacher').checked ? 'teacher' : 'student'
        })
    }).catch(err => {
        console.error(err);
        document.getElementById('register-button').disabled = false;
    });
    const res = await response.json();
    const success = res._id !== undefined;
    if (!success) {
        document.getElementById('register-button').disabled = false;
        document.getElementById('register-username').setCustomValidity(res.message);
        document.getElementById('register-username').reportValidity();
    } else {
        localStorage.setItem('user', JSON.stringify(res));
        location.href = 'index.html';
    }
}

async function login() {
    document.getElementById('login-button').disabled = true;
    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
        })
    }).catch(err => {
        console.error(err);
        document.getElementById('login-button').disabled = false;
    });
    const res = await response.json();
    const success = res._id !== undefined;
    if (!success) {
        document.getElementById('login-button').disabled = false;
        document.getElementById('login-password').setCustomValidity(res.message);
        document.getElementById('login-password').reportValidity();
    } else {
        localStorage.setItem('user', JSON.stringify(res));
        location.href = 'index.html';
    }
}
