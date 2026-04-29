import os
import re

js_dir = r"d:\FOODIQ\client\js"

for js_file in os.listdir(js_dir):
    if not js_file.endswith('.js') or js_file in ['api.js', 'utils.js']:
        continue
    
    file_path = os.path.join(js_dir, js_file)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove $
    content = re.sub(r'const \$ = id => document\.getElementById\(id\);\n?', '', content)
    
    # Remove showToast
    content = re.sub(r'function showToast.*?\}\n?', '', content, flags=re.DOTALL)
    # in auth.js it's showMsg
    
    # Remove token/user global auth guards at top
    content = re.sub(r'// Auth guard\s*const token = localStorage\.getItem\(\'nutriguide_token\'\);\s*const user = JSON\.parse\([^)]+\);\s*if \(!token\).*?\n?', '', content, flags=re.DOTALL)
    content = re.sub(r'const token = localStorage\.getItem\(\'nutriguide_token\'\);\s*const user = JSON\.parse\([^)]+\);\s*if \(!token\).*?\n?', '', content, flags=re.DOTALL)

    # Replace headers() usage with getHeaders()
    content = re.sub(r'function headers\(\)\s*\{.*?\}\n?', '', content, flags=re.DOTALL)
    content = content.replace('headers()', 'getHeaders()')

    # Remove API base URL
    content = re.sub(r'const API = \'\';\n?', '', content)
    
    # Remove duplicate calculateBMR
    content = re.sub(r'function calculateBMR.*?\}\n?', '', content, flags=re.DOTALL)

    # In auth.js:
    if js_file == 'auth.js':
        content = content.replace("window.location.href = '/dashboard.html'", "window.location.href = '/pages/dashboard.html'")
        content = content.replace("window.location.href = '/';", "window.location.href = '/pages/index.html';")
        content = content.replace("API + '/api/auth/login'", "'/api/auth/login'")
        content = content.replace("API + '/api/auth/register'", "'/api/auth/register'")

    # In mealPlan.js:
    if js_file == 'mealPlan.js':
        content = content.replace("fetch(`${API}/api/food/db`", "fetch(`${API_BASE_URL}/api/food/db`")
        content = content.replace("fetch(`${API}/api/mealplan/get`", "fetch(`${API_BASE_URL}/api/meals/get`")
        content = content.replace("fetch(`${API}/api/profile/save`", "fetch(`${API_BASE_URL}/api/profile/save`")
        content = content.replace("fetch(`${API}/api/mealplan/save`", "fetch(`${API_BASE_URL}/api/meals/save`")
        content = content.replace("window.location.href = '/';", "window.location.href = '/pages/index.html';")

    # In tracker.js:
    if js_file == 'tracker.js':
        content = content.replace("fetch(`${API}/api/mealplan/get`", "fetch(`${API_BASE_URL}/api/meals/get`")
        content = content.replace("fetch(`${API}/api/nutrition/user/${user.id}`", "fetch(`${API_BASE_URL}/api/tracker/user/${getUser().id}`")
        content = content.replace("fetch(`${API}/api/mealplan/complete-day`", "fetch(`${API_BASE_URL}/api/meals/complete-day`")
        content = content.replace("window.location.href = '/';", "window.location.href = '/pages/index.html';")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("JS files cleaned up.")
