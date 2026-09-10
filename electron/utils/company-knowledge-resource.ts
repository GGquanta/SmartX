import {
  isCompanyKnowledgeUrl,
  resolveCompanyKnowledgeUrl,
} from '../../shared/company-knowledge';

const MAX_RESOURCE_BYTES = 20 * 1024 * 1024;

export type CompanyKnowledgeResourceFetch = (url: string) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export type CompanyKnowledgeResourceResult = {
  contentType: string;
  base64: string;
};

export function resolveMainCompanyKnowledgeUrl(): string {
  const fromVite = typeof import.meta.env?.VITE_COMPANY_KNOWLEDGE_URL === 'string'
    ? import.meta.env.VITE_COMPANY_KNOWLEDGE_URL
    : process.env.VITE_COMPANY_KNOWLEDGE_URL;
  return resolveCompanyKnowledgeUrl(fromVite);
}

export async function fetchCompanyKnowledgeResource(input: {
  url: unknown;
  embedUrl: string;
  fetch: CompanyKnowledgeResourceFetch;
}): Promise<CompanyKnowledgeResourceResult> {
  if (typeof input.url !== 'string' || !isCompanyKnowledgeUrl(input.url, input.embedUrl)) {
    throw new Error('URL is not an allowed company-knowledge resource');
  }

  const response = await input.fetch(input.url);
  if (!response.ok) {
    throw new Error(`Knowledge resource returned ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_RESOURCE_BYTES) {
    throw new Error('Knowledge resource is too large');
  }

  return {
    contentType: response.headers.get('content-type') || 'application/octet-stream',
    base64: buffer.toString('base64'),
  };
}
