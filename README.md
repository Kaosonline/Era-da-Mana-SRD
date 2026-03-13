
# Era da Mana RPG – Compêndio de Regras

Um site simples de referência de regras para **Era da Mana RPG**, inspirado no estilo de d20pfsrd e Archives of Nethys. Focado em ser **fácil de instalar, rodar e modificar** mesmo com pouco conhecimento de programação.

## 🎯 Propósito

Fornecer uma **wiki online** das regras de Era da Mana RPG, organizada por categorias (raças, classes, magias, equipamentos, etc.), com busca integrada e interface limpa.

## ✨ Funcionalidades

- **Navegação por categorias**: Menu lateral com todas as seções
- **Busca em tempo real**: Encontre regras por título ou conteúdo
- **Navegação entre páginas**: Botões Anterior/Próximo e voltar à categoria
- **Modo claro/escuro**: Tema adaptável ao sistema ou manual
- **Design responsivo**: Funciona em desktop e mobile
- **Fácil de customizar**: Adicione novas páginas criando arquivos markdown
- **Sem banco de dados**: Todo conteúdo armazenado em arquivos estáticos

## 🚀 Como Usar (passo a passo)

### Requisitos
- Um navegador moderno (Chrome, Firefox, Edge)
- Acesso a um terminal (Prompt de Comando, PowerShell, Terminal)

### Instalação e Execução

1. **Abra o terminal** na pasta do projeto

2. **Instale as dependências** (rode uma vez só):
```bash
npm install
```

3. **Inicie o servidor local**:
```bash
npm run dev
```

4. **Abra no navegador**: 
   - Vá em `http://localhost:5173/`
   - Pronto! O site está rodando

### Parar o servidor
Pressione `Ctrl+C` no terminal

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── Header/          # Cabeçalho com logo, tema
│   ├── Sidebar/         # Menu de navegação por categorias
│   └── ContentView/     # Área de exibição do conteúdo
├── content/             # TODO O CONTEÚDO (você edita aqui!)
│   ├── races/           # Regras de raças
│   ├── classes/         # Regras de classes
│   ├── spells/          # Lista de magias
│   ├── feats/           # Talentos
│   ├── skills/          # Perícias
│   ├── equipment/       # Equipamentos
│   ├── conditions/      # Condições de combate
│   └── ...
├── utils/
│   ├── dataLoader.ts    # Carrega os arquivos .md automaticamente
│   └── markdownParser.ts # Converte markdown para HTML
├── App.tsx              # Componente principal
└── main.tsx            # Ponto de entrada
```

## 📝 Como Adicionar/Editar Conteúdo

### 1. Criar uma nova página
- Vá em `src/content/`
- Escolha a categoria (ou crie uma nova pasta)
- Crie um arquivo `.md` (ex: `dwarf.md`)

### 2. Formato do arquivo markdown
```markdown
# Título da Página

**Outros dados relevantes** em negrito

Texto descritivo aqui.

## Subseção
Conteúdo com formatação:

### Lista
- Item 1
- Item 2

### Tabela (use HTML se precisar)
| Coluna 1 | Coluna 2 |
|----------|----------|
| Dado 1   | Dado 2   |
```

### 3. O sistema automaticamente:
- Detecta a nova página
- Adiciona ao menu pela pasta onde está
- Indexa para busca
- Formata o texto

## 🔧 Personalização Rápida

### Mudar o nome do site
Edite `src/components/Header/Header.tsx`:
```tsx
<h1 className="header-title">Era da Mana RPG</h1>
```

### Cores do tema
Edite `src/styles/variables.css` (bloco `:root` para claro, `[data-theme="dark"]` para escuro)

### Adicionar nova categoria
1. Crie uma pasta em `src/content/` (ex: `monsters/`)
2. Coloque arquivos `.md` dentro
3. Pronto - aparece automaticamente no menu

## 🔍 Busca

A busca funciona por:
- Título da página
- Texto completo do conteúdo
- É case-insensitive (não diferencia maiúsculas/minúsculas)
- O texto encontrado é destacado amarelo

## 🌐 Deploy (publicar online)

### Opção 1: GitHub Pages (grátis)
```bash
npm run build
```
- Envie a pasta `dist/` para o GitHub Pages

### Opção 2: Netlify/Vercel
- Conecte o repositório
- Build command: `npm run build`
- Output directory: `dist`

### Opção 3: Servidor próprio
- Basta servir os arquivos estáticos da pasta `dist/`

## 📦 Tecnologias Utilizadas

- **React 18** - Interface
- **Vite** - Build tool ultrarrápido
- **TypeScript** - Tipagem segura
- **CSS Variables** - Temas claro/escuro
- **Google Fonts** - Tipografia Cinzel (títulos) e Inter (corpo)
- **Markdown** - Formato fácil de escrever regras

### Por que não usei um CMS?
Para manter **simplicidade total**:
- Não precisa de banco de dados
- Não precisa de backend
- Edita direto no arquivo .md
- Versiona facilmente no Git

## 🐛 Problemas Comuns

### "Site todo azul/escuro sem conteúdo"
- Verifique se a pasta `src/content/` tem arquivos `.md`
- Reinicie o servidor (`Ctrl+C` → `npm run dev`)

### Busca não funciona
- Certifique-se que o texto está nos arquivos `.md`
- A busca só indexa após recarregar a página

### Não aparece alguma categoria
- A categoria é definida pela **pasta** onde o arquivo está
- Ex: `src/content/spells/fireball.md` → categoria "spells"

## 📖 Exemplo de Conteúdo

`src/content/races/human.md`:
```markdown
# Humano

**Atributos-chave:** +2 em uma habilidade à sua escolha

**Tamanho:** Médio

**Deslocamento:** 30 pés

Os humanos são as pessoas mais comuns e adaptáveis do mundo.

### Traços raciais
- **Aumento de Atributos:** +2 para uma habilidade à sua escolha.
- **Médio:** Humanos são criaturas Médias.
- **Deslocamento:** Humanos têm deslocamento base de 30 pés.
- **Talentos:** Humanos ganham um talento extra no 1º nível.

*Fonte: Era da Mana RPG*
```

**Nota:** O sistema extrai automaticamente o título da primeira linha que começa com `# ` (hash seguido de espaço).

## 🛠️ Desenvolvimento

### Scripts disponíveis
- `npm run dev` - Servidor de desenvolvimento (hot reload)
- `npm run build` - Gera versão otimizada para produção
- `npm run preview` - Pré-visualiza a build

## 📄 Licença

Este projeto usa conteúdo do **Era da Mana RPG**.
- O código-fonte deste site: **MIT** (livre para usar/modificar)
- O conteúdo de regras: **Open Game License (OGL)** ou licença específica do sistema.

## 🤝 Contribuindo

1. Adicione conteúdo nos arquivos `.md`
2. Mantenha a estrutura de pastas
3. Teste localmente antes de enviar
4. Siga o estilo dos arquivos existentes

---

**Feito com ♥ para a comunidade de RPG**  
Inspirado no trabalho da Paizo Publishing e Arquivos de Nethys
