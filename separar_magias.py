import os
import re

PASTA_ENTRADA = r"C:\Users\Administrator\Desktop\tradutor\tradutor\traduzidas"
PASTA_SAIDA = r"C:\Users\Administrator\Desktop\tradutor\tradutor\magias_separadas"

os.makedirs(PASTA_SAIDA, exist_ok=True)

def limpar_nome(nome):
    nome = nome.lower()
    nome = re.sub(r"[^\w\s-]", "", nome)
    nome = nome.replace(" ", "-")
    return nome

total = 0

for arquivo in os.listdir(PASTA_ENTRADA):

    if not arquivo.endswith(".md"):
        continue

    caminho = os.path.join(PASTA_ENTRADA, arquivo)

    with open(caminho, "r", encoding="utf-8") as f:
        conteudo = f.read()

    partes = re.split(r"\n### ", conteudo)

    for i, parte in enumerate(partes):

        if i == 0:
            continue

        texto = "### " + parte.strip()

        nome = texto.split("\n")[0].replace("###", "").strip()

        nome_arquivo = limpar_nome(nome)

        caminho_saida = os.path.join(PASTA_SAIDA, nome_arquivo + ".md")

        with open(caminho_saida, "w", encoding="utf-8") as f:
            f.write(texto)

        total += 1

print(f"{total} magias separadas com sucesso!")