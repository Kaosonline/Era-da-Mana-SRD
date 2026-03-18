import os
import re
import unicodedata

# Configurações - ALTERE SE NECESSÁRIO
INPUT= r"C:\Users\antun\OneDrive\Desktop\talentos\talentos_traduzidos\talentos4.md"  # caminho do arquivo de talentos
OUTPUT= r"C:\Users\antun\OneDrive\Desktop\PROJETO\Era-da-Mana-SRD\src\content\talentos"  # pasta de saída para os arquivos individuais

def create_filename(title):
    """Cria um nome de arquivo válido a partir do título"""
    # Remove acentos
    title = unicodedata.normalize('NFKD', title).encode('ASCII', 'ignore').decode('ASCII')
    # Converte para minúsculas
    title = title.lower()
    # Remove caracteres especiais, mantém letras, números, hífens e espaços
    title = re.sub(r'[^a-z0-9\s-]', '', title)
    # Substitui espaços por hífens
    title = re.sub(r'\s+', '-', title)
    # Limita tamanho
    return title[:50] + '.md'

def main():
    # Criar pasta de saída se não existir
    os.makedirs(OUTPUT, exist_ok=True)
    
    # Ler arquivo de entrada
    try:
        with open(INPUT, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {INPUT}")
        print("   Verifique se o caminho está correto.")
        return
    
    # Dividir por '###' (início de cada talento)
    # Usamos split com regex para pegar o ### no início da linha
    blocks = re.split(r'(?=^### )', content, flags=re.MULTILINE)
    
    count = 0
    errors = []
    
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        
        # Extrair título (primeira linha após ###)
        lines = block.split('\n')
        title_line = lines[0].strip()
        
        # Remover o '### ' do início
        if title_line.startswith('### '):
            title = title_line[4:].strip()
        else:
            title = title_line
        
        if not title:
            errors.append(f"Título vazio no bloco: {block[:50]}...")
            continue
        
        # Criar nome de arquivo
        filename = create_filename(title)
        output_path = os.path.join(OUTPUT, filename)
        
        # Se já existe, adiciona contador
        counter = 1
        while os.path.exists(output_path):
            name_without_ext = create_filename(title)[:-3]  # remove .md
            filename = f"{name_without_ext}-{counter}.md"
            output_path = os.path.join(OUTPUT, filename)
            counter += 1
        
        # Salvar arquivo
        try:
            # Garantir que o bloco começa com ###
            if not block.startswith('###'):
                block = f'### {block}'
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(block + '\n')
            print(f"✅ {filename}")
            count += 1
        except Exception as e:
            errors.append(f"Erro ao salvar {filename}: {str(e)}")
    
    # Resumo
    print(f"\n🎯 Total de talentos extraídos: {count}")
    if errors:
        print(f"⚠️  Erros encontrados: {len(errors)}")
        for error in errors[:10]:  # mostrar apenas os primeiros 10 erros
            print(f"   - {error}")
        if len(errors) > 10:
            print(f"   ... e mais {len(errors) - 10} erros")

if __name__ == '__main__':
    main()