import { execSync } from 'child_process';
import { Supermemory } from 'supermemory';

const API_KEY = process.env.SUPERMEMORY_API_KEY;
const DEFAULT_TAG = 'opencode_project_9224b422478b1bed';

let client: Supermemory | null = null;

function getClient() {
  if (!client && API_KEY) {
    client = new Supermemory({ apiKey: API_KEY });
  }
  return client;
}

export async function saveMemory(content: string, tag: string = DEFAULT_TAG) {
  const supermemory = getClient();
  if (!supermemory) {
    throw new Error('SUPERMEMORY_API_KEY não configurada no .env');
  }

  await supermemory.documents.add({
    content,
    containerTag: tag,
  });
}

export async function searchMemories(query: string, tag: string = DEFAULT_TAG) {
  const supermemory = getClient();
  if (!supermemory) {
    throw new Error('SUPERMEMORY_API_KEY não configurada no .env');
  }

  const results = await supermemory.search.memories({
    q: query,
    containerTag: tag,
    limit: 5,
  });

  return results;
}

export async function getUserContext(query: string, tag: string = DEFAULT_TAG) {
  const supermemory = getClient();
  if (!supermemory) {
    throw new Error('SUPERMEMORY_API_KEY não configurada no .env');
  }

  const result = await supermemory.profile({
    containerTag: tag,
    query,
  });

  return result;
}

export const DEFAULT_TAG_NAME = DEFAULT_TAG;