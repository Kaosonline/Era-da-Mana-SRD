import { readdir, readFile, writeFile } from "fs/promises";
import { join, extname } from "path";

const EQUIP_DIR = "src/content/equipamentos";

async function walkDir(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDir(fullPath));
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      files.push(fullPath);
    }
  }
  return files;
}

function parseFields(content: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const parts = content.split("**");
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].trim();
    if (!key) continue;
    const rawValue = parts[i + 1] || "";
    let value = rawValue;
    if (i + 2 < parts.length) {
      const nextKeyIdx = rawValue.lastIndexOf("**");
      if (nextKeyIdx !== -1) {
        value = rawValue.substring(0, nextKeyIdx);
      }
    }
    fields[key] = value.trim();
  }
  return fields;
}

function extractDescription(content: string, fields: Record<string, string>): string {
  let desc = content;
  // Remove heading
  desc = desc.replace(/^#\s+.+$/gm, "");
  // Remove field patterns
  for (const [key, value] of Object.entries(fields)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\s*\\*\\*${escapedKey}\\*\\*\\s*${escapedValue}`, "g");
    desc = desc.replace(pattern, "");
  }
  return desc.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\n{3,}/g, "\n\n");
}

function formatMarkdown(fields: Record<string, string>, description: string): string {
  const nome = fields["Nome"] || "Sem nome";
  const lines: string[] = [`# ${nome}`, ""];

  const row1 = [`**Custo** ${fields["Custo"] || "-"}`, `**Peso** ${fields["Peso"] || "-"}`];
  lines.push(row1.join("  "));

  const row2 = [`**Dano** ${fields["Dano"] || "-"}`, `**Crítico** ${fields["Crítico"] || "-"}`, `**Tipo** ${fields["Tipo"] || "-"}`];
  lines.push(row2.join("  "));

  const row3 = [`**Categoria** ${fields["Categoria"] || "-"}`, `**Grupo** ${fields["Grupo"] || "-"}`];
  lines.push(row3.join("  "));

  lines.push(`**Alcance** ${fields["Alcance"] || "-"}`);
  lines.push(`**Especial** ${fields["Especial"] || "-"}`);

  if (description) {
    lines.push("", description);
  }

  return lines.join("\n");
}

async function main() {
  console.log("Buscando arquivos em", EQUIP_DIR);
  const files = await walkDir(EQUIP_DIR);
  console.log(`Encontrados ${files.length} arquivos.`);

  let count = 0;
  for (const filePath of files) {
    const content = await readFile(filePath, "utf-8");
    const fields = parseFields(content);
    const headingMatch = content.match(/^#\s+(.+)$/m);
    const nome = fields["Nome"] || (headingMatch ? headingMatch[1].trim() : null);
    if (!nome) {
      console.log(`  ⚠ Sem nome: ${filePath}`);
      continue;
    }
    fields["Nome"] = nome;

    const description = extractDescription(content, fields);
    const formatted = formatMarkdown(fields, description);

    await writeFile(filePath, formatted, "utf-8");
    count++;
    console.log(`  ✓ ${fields["Nome"]}`);
  }

  console.log(`\nConcluído! ${count} arquivos reformatados.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
