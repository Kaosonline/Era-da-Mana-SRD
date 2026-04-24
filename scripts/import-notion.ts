import { mkdir, writeFile } from "fs/promises";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually (no dotenv dependency needed)
const envPath = resolve(__dirname, "..", ".env");
try {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch { /* .env not found */ }

const DATABASE_ID = process.argv[2];
const OUTPUT_DIR = process.argv[3] || "src/content/equipamentos";

if (!DATABASE_ID) {
  console.error("Uso: tsx scripts/import-notion.ts <database-id> [output-dir]");
  console.error("Exemplo: tsx scripts/import-notion.ts 2ebb80de1b63805797cfe920d6742af5 src/content/armas");
  process.exit(1);
}

async function notionFetch(path: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API error: ${res.status} - ${err}`);
  }
  return res.json();
}

async function notionGet(path: string) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API error: ${res.status} - ${err}`);
  }
  return res.json();
}

function blockToMarkdown(block: any): string {
  const type = block.type;
  const content = block[type];
  if (!content) return "";

  const text = extractText(content.rich_text || []);
  if (!text) return "";

  switch (type) {
    case "heading_1": return `# ${text}`;
    case "heading_2": return `## ${text}`;
    case "heading_3": return `### ${text}`;
    case "bulleted_list_item": return `- ${text}`;
    case "numbered_list_item": return `1. ${text}`;
    case "to_do": return content.checked ? `- [x] ${text}` : `- [ ] ${text}`;
    case "quote": return `> ${text}`;
    case "callout": return `> ${text}`;
    default: return text;
  }
}

async function fetchPageBlocks(pageId: string): Promise<string> {
  const data = await notionGet(`blocks/${pageId}/children`);
  const lines: string[] = [];
  for (const block of data.results) {
    const md = blockToMarkdown(block);
    if (md) lines.push(md);
  }
  return lines.join("\n\n");
}

function extractText(richText: any[]): string {
  if (!richText || richText.length === 0) return "";
  return richText.map((t: any) => t.plain_text).join("");
}

function formatPropertyValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (typeof value[0] === "string") return value.join(", ");
    if (value[0]?.name) return value.map((v: any) => v.name).join(", ");
    if (value[0]?.plain_text) return extractText(value);
  }
  if (typeof value === "object") {
    if (value.start) return value.start;
    if (value.name) return value.name;
  }
  return String(value);
}

function generateMarkdown(page: any): string {
  const props = page.properties;
  const lines: string[] = [];

  for (const key of Object.keys(props)) {
    const prop = props[key];
    const value = formatPropertyValue(prop[prop.type]);
    if (value && value.trim()) {
      lines.push(`**${key}** ${value}`);
    }
  }

  return lines.join("  ");
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

async function main() {
  if (!process.env.NOTION_API_KEY) {
    console.error("Erro: Defina a variável de ambiente NOTION_API_KEY");
    process.exit(1);
  }

  console.log(`Base: ${DATABASE_ID}`);
  console.log(`Saída: ${OUTPUT_DIR}`);

  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  console.log("Buscando dados do Notion...");
  let results: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, unknown> = {
      sorts: [{ property: "Nome", direction: "ascending" }],
    };
    if (startCursor) body.start_cursor = startCursor;

    const data = await notionFetch(`databases/${DATABASE_ID}/query`, body);
    results = results.concat(data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  console.log(`Encontrados ${results.length} itens.`);

  let count = 0;
  for (const page of results) {
    const title = extractText(page.properties.title?.title || page.properties.Nome?.title || []);
    if (!title) continue;

    const props = generateMarkdown(page);
    const description = await fetchPageBlocks(page.id);
    const markdown = description ? `${props}\n\n${description}` : props;
    const filename = sanitizeFilename(title);

    await writeFile(`${OUTPUT_DIR}/${filename}.md`, markdown, "utf-8");
    count++;
    console.log(`  ✓ ${title}`);
  }

  console.log(`\nConcluído! ${count} arquivos gerados em ${OUTPUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
