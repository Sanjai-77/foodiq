import os
import re

js_dir = r"d:\FOODIQ\client\js"

for js_file in os.listdir(js_dir):
    if js_file in ['api.js', 'utils.js', 'auth.js']:
        continue
    
    file_path = os.path.join(js_dir, js_file)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove redundant global event listeners in mealPlan and tracker
    content = re.sub(r"\$\('logoutBtn'\)\.addEventListener\('click',.*?\);\n?", "", content, flags=re.DOTALL|re.MULTILINE)
    content = re.sub(r"\$\('mobileMenuBtn'\)\.addEventListener\('click',.*?\);\n?", "", content, flags=re.DOTALL|re.MULTILINE)
    content = re.sub(r"window\.addEventListener\('scroll',.*?\);\n?", "", content, flags=re.DOTALL|re.MULTILINE)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Redundant event listeners removed.")
