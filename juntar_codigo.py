import re

print("Montando arquivo único...")

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Lemos os módulos na ordem correta
files = ['src/LevelMap.js', 'src/Player.js', 'src/Guardian.js', 'src/Main.js']
js_code = ""

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        # Removemos os imports e exports para o arquivo único
        content = re.sub(r'^import .*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'export class ', 'class ', content)
        js_code += f"\n// ===== {file.split('/')[-1]} =====\n" + content + "\n"

# Substituímos a tag module pelo código inteiro
html_content = html_content.replace(
    '<script type="module" src="./src/Main.js"></script>',
    f'<script>\n"use strict";\n{js_code}\n</script>'
)

with open('Crypt_Guardian_unico_build.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Arquivo 'Crypt_Guardian_unico_build.html' gerado com sucesso!")
