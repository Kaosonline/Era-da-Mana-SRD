# AGENTS.md

**Contexto:** Este é um SRD (System Reference Document) customizado de RPG baseado no **Pathfinder 1e (PF1e)**. Todo conteúdo deve seguir as regras e mecânicas oficiais do PF1e, adaptadas para o sistema **Era da Mana SRD**.

---

## Visão Geral

Este documento contém instruções e diretrizes para desenvolvimento e manutenção do projeto **Era da Mana SRD**. Inclui comandos úteis, estrutura de conteúdo, padrões de formatação e configurações técnicas.
O usuário se comunica em português, e o conteúdo do projeto é em português, portanto as convenções de nomenclatura e formatação seguem esse idioma.

---

## Comandos de Desenvolvimento

| Comando | Descrição |
|---------|-------------|
| `npm run dev` | Inicia o servidor de desenvolvimento (executa `generate-index` antes via hook predev) |
| `npm run build` | Gera a versão de produção (executa `generate-index` antes via hook prebuild, depois `tsc && vite build`) |
| `npm run generate-index` | Regenera manualmente o índice de conteúdo |
| `npx tsc` | Verifica tipos TypeScript isoladamente (sem gerar saída) |

---

## Geração de Índice (Crítico)

O script `generate-index` escaneia todos os arquivos `.md` em `src/content/` e gera:
- `src/utils/contentIndex.ts` — Índice TypeScript usado pela aplicação
- `public/content-index.json` — Índice JSON para produção

**⚠️ Não edite `src/utils/contentIndex.ts` manualmente** — ele é gerado automaticamente.

---

## Estrutura de Conteúdo

- Todo o conteúdo fica em `src/content/` como arquivos Markdown
- **Categoria** = nome da pasta (ex.: `src/content/magias/`, `src/content/talentos/`)
- Adicionar arquivos `.md` em pastas existentes os inclui automaticamente após reiniciar os comandos `dev` ou `build`

---

## Formato de Magias (`magias/`)

Magias **devem** seguir este padrão para que os filtros funcionem corretamente:
```markdown
**Escola** Ilusão  **Nível** Arcano 2, Divino 2
**Tempo de Conjuração** 1 rodada  **Duração** 1 minuto/nível (D)
```

**Campos obrigatórios:**
- **Escola**: Tipo da magia (ex.: Ilusão, Evocação)
- **Nível**: Nível da magia por escola (ex.: Arcano 2, Divino 2)
- **Tempo de Conjuração**: Tempo necessário para lançar
- **Duração**: Duração do efeito

---

## Formato de Talentos (`talentos/`)

Talentos **devem** seguir estes padrões:

### Formato Básico
```markdown
**Tipo do talento** Geral
**Pré-requisitos** (a presença deste campo habilita filtros)
```

### Formato com Pré-requisitos
```markdown
**Tipo do talento** Combate
**Pré-requisitos** Força 13, Destreza 15
```

**Campos obrigatórios:**
- **Tipo do talento**: Categoria do talento (ex.: Geral, Combate, Magia)
- **Pré-requisitos**: Campo opcional que, quando presente, habilita filtros avançados

---

## TypeScript

- Modo estrito ativado (`noUnusedLocals`, `noUnusedParameters`)
- TypeScript é executado como parte do `npm run build` antes do Vite
- Não há script separado para typecheck — use `npx tsc` para verificações isoladas
- **Dica:** Para verificar tipos sem gerar saída, use:
  ```bash
  npx tsc --noEmit
  ```

---

Para buscar informações de regras, use **d20pfsrd.com** ou **aonprd.com** como fontes primárias.

---

## Restrições

- Nunca edite `src/utils/contentIndex.ts` diretamente.
- Sempre rode `npm run generate-index` após modificar arquivos em `src/content/`.
- Nunca adicione ou remova arquivos `.md` sem atualizar o índice.
- Sempre siga os padrões de formatação descritos acima.

---

## Convenções Adicionais

### Nomenclatura de Arquivos
- Use nomes descritivos em **português** (ex.: `curar-ferimentos.md` em vez de `heal.md`)
- Separe palavras com hífen (`-`) para arquivos (ex.: `ataque-preciso.md`)

### Organização de Conteúdo
- Mantenha arquivos de talentos organizados por tipo ou nível quando necessário

---

## Solução de Problemas

### Índice não atualizado
**Sintoma:** Novos arquivos não aparecem na aplicação.
**Solução:** Execute `npm run generate-index` e reinicie o servidor.

### Erros de TypeScript
**Sintoma:** Build falha com erros de tipos.
**Solução:** Verifique se `src/utils/contentIndex.ts` foi gerado corretamente. Se não, execute `npm run generate-index` novamente.

### Conteúdo não aparece na aplicação
**Sintoma:** Arquivos `.md` existem mas não são exibidos.
**Solução:** Verifique:
1. A estrutura de pastas em `src/content/`
2. Se os arquivos seguem o formato correto (especialmente os campos obrigatórios)
3. Se o índice foi gerado após as alterações

---