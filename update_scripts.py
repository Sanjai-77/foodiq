import os
import re

pages_dir = r"d:\FOODIQ\client\pages"
html_files = [os.path.join(pages_dir, f) for f in os.listdir(pages_dir) if f.endswith('.html')]

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add utils and api
    if "utils.js" not in content:
        content = re.sub(r'(<script src="\.\./js/[^"]+"></script>)', r'<script src="../js/utils.js"></script>\n  <script src="../js/api.js"></script>\n  \1', content)

    # Rename dashboard to mealPlan
    content = content.replace("dashboard.js", "mealPlan.js")
    # Rename nutrition to tracker
    content = content.replace("nutrition.js", "tracker.js")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("HTML scripts updated.")
