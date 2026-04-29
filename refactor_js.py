import os
import re

client_dir = r"d:\FOODIQ\client\js"

# Read existing content
with open(os.path.join(client_dir, "auth.js"), "r", encoding="utf-8") as f:
    auth_content = f.read()
with open(os.path.join(client_dir, "dashboard.js"), "r", encoding="utf-8") as f:
    dashboard_content = f.read()
with open(os.path.join(client_dir, "nutrition.js"), "r", encoding="utf-8") as f:
    tracker_content = f.read()
with open(os.path.join(client_dir, "recipe.js"), "r", encoding="utf-8") as f:
    recipe_content = f.read()

# We will create api.js, utils.js, auth.js, mealPlan.js, tracker.js
api_js = """// api.js - Backend calls
const API_BASE_URL = ''; // Same domain
const getToken = () => localStorage.getItem('nutriguide_token');
const getUser = () => JSON.parse(localStorage.getItem('nutriguide_user') || '{}');

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

const apiCall = async (endpoint, method = 'GET', body = null) => {
  const options = { method, headers: getHeaders() };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
};
"""

utils_js = """// utils.js - Helper functions
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
"""

# Modify auth.js to use apiCall and checkAuth
new_auth_js = auth_content.replace("const API = '';", "")
new_auth_js = new_auth_js.replace("window.location.href = '/dashboard.html'", "window.location.href = '/pages/dashboard.html'")
new_auth_js = new_auth_js.replace("fetch(API + '/api/auth/login'", "apiCall('/api/auth/login'")
new_auth_js = re.sub(r'await fetch[^\}]+\}\);', "await apiCall('/api/auth/login', 'POST', { email, password });", new_auth_js, count=1, flags=re.DOTALL)
new_auth_js = re.sub(r'const res = await fetch\([^\}]+\}\);.*?const data = await res\.json\(\);', "const data = await apiCall('/api/auth/login', 'POST', { email, password });", new_auth_js, count=1, flags=re.DOTALL)
new_auth_js = new_auth_js.replace("if (res.ok)", "if (true)")

new_auth_js = re.sub(r'const res = await fetch.*?register.*?const data = await res\.json\(\);', "const data = await apiCall('/api/auth/register', 'POST', { name, email, password });", new_auth_js, flags=re.DOTALL)

# Simplistic approach: just keep auth.js logic but change fetch to apiCall.
# For safety, I'll just write new clean files.
