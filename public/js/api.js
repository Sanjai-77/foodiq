// api.js - Centralized API calls
// Single source of truth for all backend communication

const API_BASE = 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('foodiq_token');
const getUser = () => JSON.parse(localStorage.getItem('foodiq_user') || '{}');

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

const apiCall = async (endpoint, method = 'GET', body = null) => {
  const options = { method, headers: getHeaders() };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API Error');
    return data;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err);
    throw err;
  }
};
