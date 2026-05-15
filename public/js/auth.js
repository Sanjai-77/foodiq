// auth.js - Login/Register logic

// If already logged in, redirect to dashboard
if (localStorage.getItem('foodiq_token')) {
  window.location.href = 'dashboard.html';
}

function showMsg(text, type) {
  const el = document.getElementById('authMessage');
  el.textContent = text;
  el.className = 'auth-message ' + type;
}

function switchTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('loginForm').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('authMessage').className = 'auth-message';
}

function togglePassword(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.innerHTML = inp.type === 'password'
    ? '<i class="fa-regular fa-eye"></i>'
    : '<i class="fa-regular fa-eye-slash"></i>';
}

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showMsg('All fields are required.', 'error');
  if (password.length < 6) return showMsg('Password must be at least 6 characters.', 'error');

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('foodiq_token', data.token);
      localStorage.setItem('foodiq_user', JSON.stringify(data.user));
      showMsg('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } else {
      showMsg(data.message, 'error');
    }
  } catch (err) {
    console.error('Login network error:', err);
    showMsg('Network error. Please try again.', 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>';
});

// REGISTER
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !password) return showMsg('All fields are required.', 'error');
  if (password.length < 6) return showMsg('Password must be at least 6 characters.', 'error');

  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('foodiq_token', data.token);
      localStorage.setItem('foodiq_user', JSON.stringify(data.user));
      showMsg('Account created! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } else {
      showMsg(data.message, 'error');
    }
  } catch (err) {
    console.error('Register network error:', err);
    showMsg('Network error. Please try again.', 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<span>Create Account</span> <i class="fa-solid fa-arrow-right"></i>';
});

// Event Listeners for UI (moved from inline onclick)
if (document.getElementById('tabLogin')) {
  document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
}
if (document.getElementById('tabRegister')) {
  document.getElementById('tabRegister').addEventListener('click', () => switchTab('register'));
}
if (document.getElementById('toggleLoginPassword')) {
  document.getElementById('toggleLoginPassword').addEventListener('click', function () {
    togglePassword('loginPassword', this);
  });
}
if (document.getElementById('toggleRegPassword')) {
  document.getElementById('toggleRegPassword').addEventListener('click', function () {
    togglePassword('regPassword', this);
  });
}
