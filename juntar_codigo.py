import re
import base64
import os

print("Montando arquivo único (com imagens embutidas)...")

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Lemos os módulos na ordem correta
files = [
    'src/Config.js', 
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
        # Removemos os imports e exports
        content = re.sub(r'^import .*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'export const ', 'const ', content)
        content = re.sub(r'export class ', 'class ', content)
        js_code += f"\n// ===== {file.split('/')[-1]} =====\n" + content + "\n"

# ---> MAGIA NEGRA PARA EMBUTIR AS IMAGENS <---
# Vamos procurar por todas as strings que carregam texturas (ex: './assets/textures/floor_tiles.png')
# e substituir pela string Base64 da imagem correspondente.

texture_paths = [
    './assets/textures/floor_tiles.png',
    './assets/textures/wall_bricks.png',
    './assets/textures/golem_rock.png',
    './assets/textures/wood.png'
]

for path in texture_paths:
    if os.path.exists(path):
        with open(path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            base64_url = f"data:image/png;base64,{encoded_string}"
            # Substitui no código JS
            js_code = js_code.replace(f"'{path}'", f"'{base64_url}'")
            print(f"Imagem embutida: {path}")

# Substituímos a tag module pelo código inteiro
html_content = html_content.replace(
    '<script type="module" src="./src/Main.js"></script>',
    f'<script>\n"use strict";\n{js_code}\n</script>'
)

with open('Crypt_Guardian_unico_build.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Arquivo 'Crypt_Guardian_unico_build.html' gerado com sucesso!")