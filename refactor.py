import os
import re

client_dir = r"d:\FOODIQ\client"
pages_dir = os.path.join(client_dir, "pages")

html_files = [os.path.join(pages_dir, f) for f in os.listdir(pages_dir) if f.endswith('.html')]

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update CSS links
    content = re.sub(r'href="[\./]*css/styles.css"', 'href="../css/styles.css"', content)
    content = re.sub(r'href="/css/styles.css"', 'href="../css/styles.css"', content)

    # Update JS links
    content = re.sub(r'src="[\./]*js/([^"]+)"', r'src="../js/\1"', content)
    content = re.sub(r'src="/js/([^"]+)"', r'src="../js/\1"', content)

    # Move inline JS in index.html to separate file (e.g. auth.js)
    # The user asked to remove inline JS. Let's do a simple regex or do it manually.

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("HTML files updated.")
