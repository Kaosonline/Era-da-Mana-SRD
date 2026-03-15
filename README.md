# Era da Mana RPG – Compêndio de Regras

Um site simples de referência de regras para **Era da Mana RPG**, inspirado no estilo de d20pfsrd e Archives of Nethys. Focado em ser **fácil de instalar, rodar e modificar** mesmo com pouco conhecimento de programação.

## 🎯 Propósito

Fornecer uma **wiki online** das regras de Era da Mana RPG, organizada por categorias (raças, classes, magias, equipamentos, etc.), com **busca avançada** e **filtros específicos para magias**.

## ✨ Funcionalidades

- **Navegação por categorias**: Menu lateral com todas as seções
- **Busca em tempo real**: Encontre regras por título ou conteúdo
- **Filtros avançados de magias**:
  - Por **nível** (0-9)
  - Por **escola** (Abjuração, Conjuração, etc.)
  - Por **tempo de conjuração** (1 ação, 1 rodada, etc.)
  - Por **duração** (instantânea, concentração, etc.)
- **Navegação entre páginas**: Botões Anterior/Próximo e voltar à categoria
- **Modo claro/escuro**: Tema adaptável ao sistema ou manual
- **Design responsivo**: Funciona em desktop e mobile
- **Fácil de customizar**: Adicione novas páginas criando arquivos markdown
- **Sem banco de dados**: Todo conteúdo armazenado em arquivos estáticos
- **Destaque de busca**: Texto encontrado é destacado em amarelo

## 🚀 Como Usar (passo a passo)

### Requisitos
- Um navegador moderno (Chrome, Firefox, Edge)
- Acesso a um terminal (Prompt de Comando, PowerShell, Terminal)
- Node.js 18+ instalado

### Instalação e Execução

1. **Abra o terminal** na pasta do projeto

2. **Instale as dependências** (rode uma vez só):

npm install

3. **Inicie o servidor local**:

npm run dev

4. **Abra no navegador**: 
   - Vá em `http://localhost:5173/`
   - Pronto! O site está rodando

### Parar o servidor
Pressione `Ctrl+C` no terminal

## 📁 Estrutura do Projeto

src/
├── components/           # Componentes reutilizáveis
│   ├── Header/          # Cabeçalho com logo, tema
│   ├── Sidebar/         # Menu de navegação por categorias
│   ├── ContentView/     # Área de exibição do conteúdo
│   └── SpellFilter/     # Componente de filtros de magias (opcional)
├── content/             # TODO O CONTEÚDO (você edita aqui!)
│   ├── races/           # Regras de raças
│   ├── classes/         # Regras de classes
│   ├── spells/          # Lista de magias (com metadados)
│   ├── feats/           # Talentos
│   ├── skills/          # Perícias
│   ├── equipment/       # Equipamentos
│   ├── conditions/      # Condições de combate
│   └── ...
├── utils/
│   ├── dataLoader.ts    # Carrega arquivos .md e extrai metadados
│   ├── SpellParser.ts   # Extrai metadados de magias do markdown
│   └── markdownParser.ts # Converte markdown para HTML
├── types/
│   └── content.ts       # Tipos TypeScript para ContentItem
├── App.tsx              # Componente principal
└── main.tsx            # Ponto de entrada

## 📝 Como Adicionar/Editar Conteúdo

### 1. Criar uma nova página
- Vá em `src/content/`
- Escolha a categoria (ou crie uma nova pasta)
- Crie um arquivo `.md` (ex: `dwarf.md`)

### 2. Formato do arquivo markdown

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

### 3. **Formato específico para MAGIAS**

Para que os **filtros funcionem**, as magias devem seguir este padrão:

### Nome da Magia

**Escola** Ilusão (Vislumbre); **Nível** Arcano 2, Divino 2

**CONJURAÇÃO**
**Tempo de Conjuração** 1 rodada  **Componentes** V, S

**EFEITO**
**Alcance** perto (7,5m + 1,5m/2 níveis)  **Alvos** 1 aliado/nível  **Duração** 1 minuto/nível (D)  **Teste de Resistência** Vontade anula  **Resistência a Magia** sim

**DESCRIÇÃO**
Texto completo da magia...


**Importante**:
- `**Escola**` e `**Nível**` podem estar na **mesma linha** (separados por `;`)
- Os campos reconhecidos para filtros são:
  - `Escola` → filtro "Escola"
  - `Nível` → filtro "Nível" (extrai o menor número)
  - `Tempo de Conjuração` → filtro "Tempo de Conjuração"
  - `Duração` → filtro "Duração"
- O sistema automaticamente:
  - Extrai o título da primeira linha com `###`
  - Remove os metadados do corpo da magia (não aparecem no texto)
  - Armazena os metadados para filtros e exibição

### 4. O sistema automaticamente:
- Detecta a nova página
- Adiciona ao menu pela pasta onde está
- Indexa para busca
- Formata o texto
- Extrai metadados de magias para filtros

## 🔧 Personalização Rápida

### Mudar o nome do site
Edite `src/components/Header/Header.tsx`:
tsx
<h1 className="header-title">Era da Mana RPG</h1>


### Cores do tema
Edite `src/styles/variables.css` (bloco `:root` para claro, `[data-theme="dark"]` para escuro)

### Adicionar nova categoria
1. Crie uma pasta em `src/content/` (ex: `monsters/`)
2. Coloque arquivos `.md` dentro
3. Pronto - aparece automaticamente no menu

## 🔍 Busca e Filtros

### Busca
- Funciona por **título** e **texto completo**
- Case-insensitive (não diferencia maiúsculas/minúsculas)
- Texto encontrado é **destacado em amarelo**

### Filtros de Magias
- Apenas aparecem quando a categoria **"spells"** está selecionada
- **Nível**: Mostra apenas os níveis existentes (0-9)
- **Escola**: Mostra escolas únicas (ex: "Ilusão (Vislumbre)")
- **Tempo de Conjuração**: Mostra tempos únicos (ex: "1 rodada")
- **Duração**: Mostra durações únicas (ex: "1 minuto/nível (D)")
- Combina com busca e filtros de categoria

## 🌐 Deploy (publicar online)

### Opção 1: GitHub Pages (grátis)

npm run build

- Envie a pasta `dist/` para o GitHub Pages
- Configure `vite.config.ts` se necessário (base path)

### Opção 2: Netlify/Vercel
- Conecte o repositório
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite

### Opção 3: Servidor próprio
- Basta servir os arquivos estáticos da pasta `dist/`
- Exemplo com Python: `python -m http.server --directory dist 8000`

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
- Fácil de fazer backup (só copiar a pasta `content/`)

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

### Filtros de magias não aparecem
- Verifique se a categoria "spells" está selecionada
- Certifique-se que as magias seguem o formato correto (ver seção "Como Adicionar/Editar Conteúdo")
- Abra o console do navegador (F12) para ver erros

### Metadados aparecem como "undefined"
- Verifique se o arquivo `.md` da magia está no formato correto
- Os campos devem usar `**Chave**` (com dois asteriscos)
- A primeira linha da magia deve ser `### Nome da Magia`

## 📖 Exemplo de Conteúdo

### Magia (com metadados)
`src/content/spells/abafar-som.md`:

### Abafar Som

**Escola** Ilusão (Vislumbre); **Nível** Arcano 2, Divino 2

**CONJURAÇÃO**
**Tempo de Conjuração** 1 rodada  **Componentes** V, S

**EFEITO**
**Alcance** perto (7,5m + 1,5m/2 níveis)  **Alvos** 1 aliado/nível  **Duração** 1 minuto/nível (D)  **Teste de Resistência** Vontade anula  **Resistência a Magia** sim

**DESCRIÇÃO**
Você suprime os sons feitos pelos alvos, concedendo-lhes um bônus de +4 em testes de Furtividade. Os alvos têm 20% de chance de falha de magia ao conjurar magias com componentes verbais ou usar habilidades que tenham componentes audíveis (como algumas performances de bardo). Esta magia não prejudica a capacidade dos alvos de ouvir outros sons e não fornece proteção contra magias e efeitos dependentes de linguagem ou sônicos.

### Raça (sem metadados)
`src/content/races/human.md`:

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


**Nota**: O sistema extrai automaticamente:
- Título da primeira linha que começa com `#`, `##` ou `###`
- Metadados de magias das linhas com `**Chave** Valor`

## 🛠️ Desenvolvimento

### Scripts disponíveis
- `npm run dev` - Servidor de desenvolvimento (hot reload)
- `npm run build` - Gera versão otimizada para produção
- `npm run preview` - Pré-visualiza a build

### Estrutura de pastas

src/
├── components/     # Componentes React
│   ├── Header/
│   ├── Sidebar/
│   └── ContentView/
├── content/        # Arquivos .md (seu conteúdo)
├── utils/          # Funções utilitárias
│   ├── dataLoader.ts    # Carrega e processa .md
│   ├── SpellParser.ts   # Parser de metadados de magias
│   └── markdownParser.ts # Markdown → HTML
├── types/          # Tipos TypeScript
├── styles/         # CSS global e variáveis
└── App.tsx         # Componente principal


## 🔧 Arquivos Importantes

| Arquivo | O que faz |
|---------|-----------|
| `src/utils/SpellParser.ts` | Extrai metadados de magias do markdown |
| `src/utils/dataLoader.ts` | Carrega arquivos .md e mapeia para ContentItem |
| `src/components/Sidebar/Sidebar.tsx` | Menu lateral com busca e filtros |
| `src/components/ContentView/ContentView.tsx` | Exibe o conteúdo formatado |
| `src/types/content.ts` | Define a interface ContentItem |

## 📄 Licença

Este projeto usa conteúdo do **Era da Mana RPG**.
- O código-fonte deste site: **MIT** (livre para usar/modificar)
- O conteúdo de regras: **Open Game License (OGL)** ou licença específica do sistema.

## 🤝 Contribuindo

1. Adicione conteúdo nos arquivos `.md`
2. Mantenha a estrutura de pastas
3. Teste localmente antes de enviar
4. Siga o estilo dos arquivos existentes
5. Para magias, use o formato com metadados (ver exemplo acima)

---

**Feito com ♥ para a comunidade de RPG**  
Inspirado no trabalho da Paizo Publishing e Arquivos de Nethys

**Versão**: 1.1.0 (2023-08-31)
