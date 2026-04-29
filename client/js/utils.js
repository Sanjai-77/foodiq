// utils.js - Helper functions

const $ = id => document.getElementById(id);

function showToast(msg, type = 'success') {
  const c = $('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
}

function calculateBMR(age, gender, weight, height) {
  return gender === 'male' ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;
}

function checkAuth() {
  const token = localStorage.getItem('nutriguide_token');
  const path = window.location.pathname;
  if (!token && !path.endsWith('index.html') && !path.endsWith('/') && !path.endsWith('forgot-password.html') && !path.endsWith('reset-password.html')) {
    window.location.href = '/pages/index.html';
  }
}

// Global UI bindings
window.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = $('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('nutriguide_token');
      localStorage.removeItem('nutriguide_user');
      window.location.href = '/pages/index.html';
    });
  }
  const mobileMenuBtn = $('mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => $('navLinks').classList.toggle('mobile-open'));
  }
  const user = JSON.parse(localStorage.getItem('nutriguide_user') || '{}');
  const userAvatar = $('userAvatar');
  if (userAvatar && user.name) {
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
});

window.addEventListener('scroll', () => {
  const nav = $('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
});
