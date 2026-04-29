// api.js - Centralized API calls

const API_BASE_URL = ''; 
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
