# Ferramenta de Revisão de Traduções

Ferramenta auxiliar para revisar e corrigir as traduções de magias, talentos e outros conteúdos do projeto **Era da Mana SRD**.

## O que faz

Permite revisar cada arquivo `.md` de tradução um por um, com edição inline, marcação de status e salvamento de progresso.

## Como usar

### 1. Instalar dependências (apenas na primeira vez)

```bash
cd review-tool
npm install
```

### 2. Iniciar o servidor

```bash
npm start
```

Você verá a mensagem:
```
========================================
  Ferramenta de Revisão de Traduções
  Acesse: http://localhost:3001
  Pressione Ctrl+C para parar
========================================
```

### 3. Abrir no navegador

Acesse **http://localhost:3001**

## Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Edição inline** | Edita o texto diretamente na tela e salva no arquivo `.md` original |
| **Marcação de status** | Aprova, marca para corrigir ou pula cada item |
| **Progresso salvo** | Continua automaticamente de onde parou (localStorage) |
| **Busca** | Filtra arquivos por nome |
| **Filtro por status** | Veja apenas pendentes, aprovados, precisando correção ou pulados |
| **Barra de progresso** | Acompanha quantos itens já foram revisados |

## Atalhos de teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + S` | Salvar alterações |
| `Ctrl + Enter` | Aprovar tradução |
| `Ctrl + 1` | Marcar como "Precisa corrigir" |
| `Ctrl + 2` | Pular |
| `Ctrl + ←` | Arquivo anterior |
| `Ctrl + →` | Próximo arquivo |

## Fluxo de trabalho sugerido

1. Selecione a categoria (ex: `magias` ou `talentos`)
2. Leia a tradução no editor
3. Se estiver boa, clique **✅ Aprovar** (`Ctrl+Enter`)
4. Se precisar de correção, edite o texto e clique **💾 Salvar** (`Ctrl+S`), depois marque como **✅ Aprovar**
5. Se não tiver tempo agora, clique **⏭️ Pular** (`Ctrl+2`)
6. Use o filtro de status para revisar depois apenas os pulados ou marcados como "Precisa corrigir"

## Troubleshooting

### "Nenhuma categoria encontrada" ou tela em branco
- Verifique se o servidor está rodando (deve mostrar a mensagem de inicialização)
- Verifique se a pasta `src/content/` existe no projeto principal e contém subpastas como `magias/` e `talentos/`
- Tente recarregar a página (F5)

### "Erro ao carregar arquivos"
- Verifique se o servidor está rodando na porta 3001
- Verifique se os arquivos `.md` existem em `src/content/magias/` e `src/content/talentos/`
- Abra o console do navegador (F12) para ver detalhes do erro

### A ferramenta não salva as alterações
- Verifique se você tem permissão de escrita na pasta `src/content/`
- Verifique se o arquivo não está aberto em outro programa

### A lista de arquivos não aparece
- A ferramenta carrega automaticamente a categoria "magias" ao iniciar
- Se não aparecer, verifique no console (F12) se há erros de JavaScript
- Tente selecionar manualmente uma categoria no dropdown superior

## Estrutura

```
review-tool/
├── server.js           # Servidor Express (lê/escreve arquivos .md)
├── package.json
└── public/
    └── index.html      # Interface web
```

## Notas

- Os arquivos `.md` são editados **diretamente** em `src/content/` do projeto principal
- Esta pasta está no `.gitignore` e não será commitada
- Quando terminar a revisão, pode deletar a pasta `review-tool/` inteira sem afetar o projeto
- O progresso é salvo no navegador (localStorage). Se limpar o cache, perde o progresso

