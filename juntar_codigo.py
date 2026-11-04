import re

print("Montando arquivo único...")

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Ordem de injeção das dependências
files = [
    'src/Input.js', 
    'src/CameraManager.js', 
    'src/LightManager.js', 
    'src/LevelMap.js', 
    'src/Player.js', 
    'src/Guardian.js', 
    'src/Main.js'
]
js_code = ""

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        # Remove imports e convert exports para escopo global do script único
        content = re.sub(r'^import .*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'export const ', 'const ', content)
        content = re.sub(r'export class ', 'class ', content)
        js_code += f"\n// ===== {file.split('/')[-1]} =====\n" + content + "\n"

html_content = html_content.replace(
    '<script type="module" src="./src/Main.js"></script>',
    f'<script>\n"use strict";\n{js_code}\n</script>'
)

with open('Crypt_Guardian_unico_build.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Arquivo 'Crypt_Guardian_unico_build.html' gerado com sucesso!")