# Era da Mana RPG – Compêndio de Regras e Ferramenta de Revisão

Um sistema completo para gerenciamento e revisão de regras para **Era da Mana RPG**, inspirado no estilo do d20pfsrd e Archives of Nethys. Inclui um site de referência de regras e uma ferramenta de revisão de traduções.

## 🎯 Propósito

Fornecer uma **wiki online** das regras de Era da Mana RPG, organizada por categorias (raças, magias, talentos, condições, etc.), com **busca avançada**, **filtros para magias** e **carregamento otimizado** para milhares de páginas. Além disso, inclui uma ferramenta de revisão para garantir a qualidade das traduções.

## ✨ Funcionalidades

### Site de Regras

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

### Ferramenta de Revisão de Traduções

- **Edição inline**: Edita o texto diretamente na tela e salva no arquivo `.md` original
- **Marcação de status**: Aprova, marca para corrigir ou pula cada item
- **Progresso unificado**: Salvo no servidor (`review-progress.json`)
- **Busca avançada**: Filtra por nome com suporte a frases exatas (`"termo"`) e exclusões (`-termo`)
- **Filtro por status**: Veja apenas pendentes, aprovados, precisando correção ou pulados
- **Barra de progresso**: Acompanha quantos itens já foram revisados
- **Preview em tempo real**: Visualização do markdown formatado com zoom (50%-200%)
- **Scroll sincronizado**: Opcionalmente sincroniza scroll entre editor e preview
- **Links internos**: Cria links markdown automaticamente com busca inteligente
- **Conversor de tabelas**: Transforma texto selecionado em tabelas markdown
- **Tema claro/escuro**: Preview com temas adaptáveis
- **Acessibilidade completa**: Suporte a leitores de tela, navegação por teclado e alto contraste
- **Atalhos de teclado** (todos com uma mão):
  - `Ctrl + S`: Salvar alterações
  - `Ctrl + Enter`: Aprovar tradução
  - `Ctrl + 1`: Marcar como "Precisa corrigir"
  - `Ctrl + 2`: Pular
  - `Ctrl + ←`: Arquivo anterior
  - `Ctrl + →`: Próximo arquivo
  - `Alt + 1`: Criar link interno ✨
  - `Ctrl + T`: Converter seleção em tabela
  - `Ctrl + P`: Alternar preview
  - `Ctrl + H`: Mostrar ajuda de atalhos
  - `↑ / ↓`: Navegar na lista de arquivos
  - `Home / End`: Primeiro/último arquivo
  - `Ctrl + ↑ / ↓`: Zoom no preview
  - `Esc`: Fechar modal/preview

## 🚀 Como Usar

### Requisitos

- Node.js 18+
- Navegador moderno (Chrome, Firefox, Edge)

### Instalação e Execução

#### Site de Regras

```bash
# Instale as dependências (uma vez só)
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:5173/` no navegador.

#### Ferramenta de Revisão

```bash
# Navegue até a pasta da ferramenta
cd review-tool

# Instale as dependências (uma vez só)
npm install

# Inicie o servidor
npm start
```

Abra `http://localhost:3001/` no navegador.

### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot reload (site de regras) |
| `npm run build` | Gera build otimizada para produção (site de regras) |
| `npm run preview` | Pré-visualiza a build de produção (site de regras) |
| `npm run generate-index` | Regenera o índice de conteúdo manualmente (site de regras) |

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React (site de regras)
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

review-tool/
├── server.js           # Servidor Express (lê/escreve arquivos .md)
├── package.json
└── public/
    └── index.html      # Interface web da ferramenta de revisão
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
- **Express** – Servidor da ferramenta de revisão

## 📝 Fluxo de Trabalho de Revisão

1. **Revisar traduções**:
   - Inicie a ferramenta de revisão (`cd review-tool && npm start`)
   - Acesse `http://localhost:3001` no navegador
   - Selecione a categoria (ex: `magias` ou `talentos`)
   - Leia a tradução no editor ou use o preview (`Ctrl+P`)
   - Se estiver boa, clique **✅ Aprovar** (`Ctrl+Enter`)
   - Se precisar de correção, edite o texto e clique **💾 Salvar** (`Ctrl+S`), depois marque como **✅ Aprovar**
   - Para criar links internos, selecione o texto e use **🔗 Link** (`Alt+1`)
   - Para converter texto em tabela, selecione e use **📊 Tabela** (`Ctrl+T`)
   - Se não tiver tempo agora, clique **⏭️ Pular** (`Ctrl+2`)
   - Use o filtro de status para revisar depois apenas os pulados ou marcados como "Precisa corrigir"
   - Use a navegação por teclado (`↑/↓`, `Home/End`) para agilizar

2. **Visualizar no site**:
   - Após aprovar as traduções, inicie o site de regras (`npm run dev`)
   - Verifique como as traduções aparecem no contexto completo
   - Teste os filtros e busca

3. **Iterar**:
   - Volte para a ferramenta de revisão para ajustes finais
   - Use o site para testar a experiência do usuário

4. **Exportar/Importar progresso**:
   - Use os botões **📤 Exportar** e **📥 Importar** para backup ou transferência entre máquinas
   - O progresso também é salvo automaticamente em `review-tool/review-progress.json`

## 🐛 Problemas Comuns

### Site de Regras

| Problema | Solução |
|----------|---------|
| Site sem conteúdo | Verifique se `src/content/` tem arquivos `.md` e reinicie o servidor |
| Busca não encontra | A busca só funciona após `npm run dev` (o índice é gerado no start) |
| Categoria não aparece | A categoria é definida pela **pasta** onde o arquivo está |
| Filtros de magia não aparecem | Selecione a categoria "magias" e verifique o formato dos metadados |
| Links não funcionam | Use caminhos relativos `.md` (ex: `capacidade-de-carga.md`) |

### Ferramenta de Revisão

| Problema | Solução |
|----------|---------|
| "Nenhuma categoria encontrada" ou tela em branco | Verifique se o servidor está rodando (porta 3001) e se `src/content/` existe |
| "Erro ao carregar arquivos" | Verifique se os arquivos `.md` existem em `src/content/magias/` e `src/content/talentos/` |
| A ferramenta não salva as alterações | Verifique permissões de escrita na pasta `src/content/` |
| A lista de arquivos não aparece | Tente selecionar manualmente uma categoria no dropdown superior |
| Preview não abre | Pressione `Ctrl+P` ou clique em "👁️ Preview" |
| Zoom não funciona | Verifique se o preview está aberto; use slider ou `Ctrl+↑/↓` |
| Scroll não sincroniza | Clique no botão "🔗 Scroll" para ativar/desativar |
| `Alt+1` não funciona | Verifique se o foco está no editor; alguns browsers capturam o atalho |
| Progresso não persiste | Verifique se `review-tool/review-progress.json` está sendo atualizado |

## 📄 Licença

- Código-fonte: **MIT**
- Conteúdo de regras: **Open Game License (OGL)** ou licença específica do sistema
- Ferramenta de revisão: **MIT** (pode ser removida sem afetar o projeto principal)

## 🤝 Contribuindo

1. **Adicionar conteúdo**:
   - Adicione arquivos `.md` em `src/content/`
   - Mantenha a estrutura de pastas
   - Para magias, use o formato com metadados

2. **Revisar traduções**:
   - Use a ferramenta de revisão para garantir qualidade
   - Siga o fluxo de trabalho sugerido
   - Teste no site antes de finalizar

3. **Reportar problemas**:
   - Descreva o problema com detalhes
   - Inclua screenshots se possível
   - Especifique se é no site de regras ou ferramenta de revisão

4. **Enviar melhorias**:
   - Para o site: modifique os arquivos em `src/`
   - Para a ferramenta: modifique os arquivos em `review-tool/`
   - Teste localmente antes de enviar

## 📌 Notas Importantes

1. **Arquivos `.md`**: São editados **diretamente** em `src/content/` do projeto principal
2. **Progresso da revisão**: Salvo em `review-tool/review-progress.json` no servidor. O progresso persiste entre sessões e pode ser exportado/importado
3. **Ferramenta de revisão**: Pasta `review-tool/` está no `.gitignore` e pode ser excluída sem afetar o projeto principal
4. **Conteúdo**: Organizado por pastas que definem as categorias no menu
5. **Links internos**: Usam caminhos relativos `.md` que são resolvidos automaticamente
6. **Acessibilidade**: A ferramenta de revisão suporta leitores de tela, navegação por teclado completa e alto contraste

## 🎯 Roadmap Futuro

- [ ] Integração da ferramenta de revisão no site principal
- [ ] Suporte a múltiplos revisores com sincronização
- [ ] Estatísticas avançadas de cobertura de tradução
- [ ] Sistema de comentários e anotações nas traduções
- [ ] Validação automática de formato de magias e talentos
- [ ] Diff de alterações antes de salvar

---

**Feito com ♥ para a comunidade de RPG**

*Projeto mantido por [Kaosonline](https://github.com/Kaosonline) e colaboradores*
