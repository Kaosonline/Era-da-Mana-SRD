# Era da Mana RPG – Compêndio de Regras

Um site de referência de regras para **Era da Mana RPG**, inspirado no estilo do d20pfsrd e Archives of Nethys. Focado em ser **fácil de instalar, rodar e modificar** mesmo com pouco conhecimento de programação.

## 🎯 Propósito

Fornecer uma **wiki online** das regras de Era da Mana RPG, organizada por categorias (raças, magias, talentos, condições, etc.), com **busca avançada**, **filtros para magias** e **carregamento otimizado** para milhares de páginas.

## ✨ Funcionalidades

- **Navegação por categorias**: Menu lateral virtualizado com todas as seções
- **Busca em tempo real**: Encontre regras por título ou conteúdo
- **Filtros avançados de magias**:
  - Por **nível** (0-9)
  - Por **escola** (Abjuração, Conjuração, etc.)
  - Por **tempo de conjuração** (1 ação, 1 rodada, etc.)
  - Por **duração** (instantânea, concentração, etc.)
- **Links internos entre páginas**: Links `.md` relativos são resolvidos automaticamente para rotas do SPA
- **Navegação entre páginas**: Botões Anterior/Próximo e voltar à categoria
- **Modo claro/escuro**: Tema adaptável ao sistema ou manual
- **Design responsivo**: Funciona em desktop e mobile
- **Carregamento otimizado**: Índice pré-gerado + lazy loading de conteúdo + sidebar virtualizada
- **Sem banco de dados**: Todo conteúdo em arquivos markdown estáticos

## 🚀 Como Usar

### Requisitos

- Node.js 18+
- Navegador moderno (Chrome, Firefox, Edge)

### Instalação e Execução

```bash
# Instale as dependências (uma vez só)
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:5173/` no navegador.

### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Gera build otimizada para produção |
| `npm run preview` | Pré-visualiza a build de produção |
| `npm run generate-index` | Regenera o índice de conteúdo manualmente |

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── Header/          # Cabeçalho com logo e tema
│   ├── Sidebar/         # Menu lateral virtualizado
│   ├── ContentView/     # Exibição do conteúdo
│   └── FavoritesPanel/  # Painel de favoritos
├── content/             # TODO O CONTEÚDO (edite aqui!)
│   ├── regras/          # Regras gerais
│   ├── magias/          # Magias (com metadados)
│   ├── talentos/        # Talentos
│   ├── condições/       # Condições de combate
│   ├── raças/           # Raças
│   └── ...
├── utils/
│   ├── dataLoader.ts    # Carrega índice + lazy loading de conteúdo
│   ├── spellParser.ts   # Extrai metadados de magias
│   └── markdownParser.ts # Converte markdown para HTML
├── contexts/            # Contextos React (tema, favoritos)
├── types/               # Tipos TypeScript
├── styles/              # CSS global e variáveis de tema
└── App.tsx              # Componente principal
```

## ⚡ Otimizações de Performance

O projeto utiliza 3 estratégias para carregar rapidamente mesmo com **6000+ páginas**:

### 1. Índice Pré-gerado
Durante o build, um script (`scripts/generate-index.ts`) varre todos os arquivos `.md` e gera `public/content-index.json` (~1MB) contendo apenas metadados (título, categoria, nível de magia, etc). O app carrega esse arquivo leve ao invés de processar milhares de arquivos.

### 2. Lazy Loading de Conteúdo
O conteúdo completo do markdown só é carregado quando o usuário acessa uma página específica. A sidebar e a home usam apenas o índice leve.

### 3. Sidebar Virtualizada
A barra lateral renderiza apenas os itens visíveis na tela, mantendo o DOM leve mesmo com milhares de entradas.

## 📝 Como Adicionar Conteúdo

### Criar uma nova página

1. Vá em `src/content/`
2. Escolha a categoria (ou crie uma nova pasta)
3. Crie um arquivo `.md` (ex: `dwarf.md`)
4. O sistema detecta automaticamente ao recarregar

### Formato Básico

```markdown
# Título da Página

**Dado importante** em negrito

Texto descritivo aqui.

## Subseção

- Item 1
- Item 2

| Coluna 1 | Coluna 2 |
|----------|----------|
| Dado 1   | Dado 2   |
```

### Links entre Páginas

Links `.md` relativos são resolvidos automaticamente para a rota correta:

```markdown
Veja mais em [Capacidade de Carga](capacidade-de-carga.md)
```

Se o arquivo estiver na mesma categoria (ex: `regras/`), o link resolve para `/regras/capacidade-de-carga`.

### Formato para MAGIAS

Para que os **filtros funcionem**, as magias devem seguir este padrão:

```markdown
### Nome da Magia

**Escola** Ilusão (Vislumbre); **Nível** Arcano 2, Divino 2

**Tempo de Conjuração** 1 rodada  **Componentes** V, S

**Alcance** perto (7,5m + 1,5m/2 níveis)  **Alvos** 1 aliado/nível  **Duração** 1 minuto/nível (D)  **Teste de Resistência** Vontade anula  **Resistência a Magia** sim

**DESCRIÇÃO**
Texto completo da magia...
```

Campos reconhecidos para filtros:
- `**Escola**` → filtro "Escola"
- `**Nível**` → filtro "Nível" (extrai o menor número)
- `**Tempo de Conjuração**` → filtro "Tempo de Conjuração"
- `**Duração**` → filtro "Duração"

## 🔧 Personalização

### Mudar o nome do site
Edite `src/components/Header/Header.tsx`

### Cores do tema
Edite `src/styles/variables.css` (bloco `:root` para claro, `[data-theme="dark"]` para escuro)

### Adicionar nova categoria
1. Crie uma pasta em `src/content/` (ex: `monstros/`)
2. Coloque arquivos `.md` dentro
3. Aparece automaticamente no menu

## 🌐 Deploy

### Netlify / Vercel
- Conecte o repositório
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite

### GitHub Pages
```bash
npm run build
```
Envie a pasta `dist/` para o GitHub Pages.

### Servidor próprio
```bash
python -m http.server --directory dist 8000
```

## 📦 Tecnologias

- **React 18** – Interface
- **Vite** – Build tool e dev server
- **TypeScript** – Tipagem segura
- **React Router** – Navegação SPA
- **CSS Variables** – Temas claro/escuro
- **Markdown** – Formato de conteúdo

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| Site sem conteúdo | Verifique se `src/content/` tem arquivos `.md` e reinicie o servidor |
| Busca não encontra | A busca só funciona após `npm run dev` (o índice é gerado no start) |
| Categoria não aparece | A categoria é definida pela **pasta** onde o arquivo está |
| Filtros de magia não aparecem | Selecione a categoria "magias" e verifique o formato dos metadados |
| Links não funcionam | Use caminhos relativos `.md` (ex: `capacidade-de-carga.md`) |

## 📄 Licença

- Código-fonte: **MIT**
- Conteúdo de regras: **Open Game License (OGL)** ou licença específica do sistema

## 🤝 Contribuindo

1. Adicione conteúdo nos arquivos `.md`
2. Mantenha a estrutura de pastas
3. Para magias, use o formato com metadados
4. Teste localmente antes de enviar

---

**Feito com ♥ para a comunidade de RPG**
