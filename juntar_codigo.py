import base64
import os
import re

print("Montando arquivo único (com CSS e imagens embutidos)...")

with open("index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# Ordem respeitando as dependências entre os módulos atuais
files = [
    "src/Config.js",
    "src/UI.js",
    "src/Entity.js",
    "src/CameraManager.js",
    "src/LevelMap.js",
    "src/Player.js",
    "src/GuardianAI.js",
    "src/Guardian.js",
    "src/Main.js",
]

js_parts = []
for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
        content = re.sub(r"^import .*\n?", "", content, flags=re.MULTILINE)
        content = re.sub(
            r"^export\s+(?=(const|let|var|class|function)\b)",
            "",
            content,
            flags=re.MULTILINE,
        )
        js_parts.append(f"// ===== {os.path.basename(file)} =====\n{content}")

js_code = "\n\n".join(js_parts)


# Embute automaticamente qualquer textura local referenciada no código JS
def embed_texture(match):
    quote, path = match.group(1), match.group(2)
    if os.path.exists(path):
        ext = os.path.splitext(path)[1].lstrip(".").lower()
        mime = "jpeg" if ext == "jpg" else ext
        with open(path, "rb") as img:
            b64 = base64.b64encode(img.read()).decode("utf-8")
        print(f"Imagem embutida: {path}")
        return f"{quote}data:image/{mime};base64,{b64}{quote}"
    print(f"Aviso: textura não encontrada em '{path}'")
    return match.group(0)


js_code = re.sub(
    r"""(['"])(\.{1,2}/[^'"]+\.(?:png|jpg|jpeg|webp))\1""",
    embed_texture,
    js_code,
)


# Embute CSS local (<link rel="stylesheet" href="...">), se existir
def embed_css(match):
    tag = match.group(0)
    if 'rel="stylesheet"' not in tag and "rel='stylesheet'" not in tag:
        return tag
    href_match = re.search(r"""href=['"]([^'"]+)['"]""", tag)
    if not href_match:
        return tag
    href = href_match.group(1)
    if href.startswith(("http://", "https://", "//")):
        return tag
    target = href if os.path.exists(href) else href.lstrip("./")
    if os.path.exists(target):
        with open(target, "r", encoding="utf-8") as css_file:
            print(f"CSS embutido: {target}")
            return f"<style>\n{css_file.read()}\n</style>"
    return tag


html_content = re.sub(r"<link\b[^>]*>", embed_css, html_content, flags=re.IGNORECASE)

# Substitui a tag <script type="module" src="...Main.js"></script> pelo bundle
html_content = re.sub(
    r"<script\b[^>]*Main\.js[^>]*>\s*</script>",
    lambda _: f'<script>\n"use strict";\n{js_code}\n</script>',
    html_content,
    flags=re.IGNORECASE,
)

output_file = "Crypt_Guardian_unico_build.html"
with open(output_file, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Arquivo '{output_file}' gerado com sucesso!")