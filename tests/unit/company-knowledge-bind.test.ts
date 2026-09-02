import { describe, it, expect } from 'vitest';
import { parseCompanyKnowledgeWebBindPayload } from '../../electron/utils/skill-config';

describe('parseCompanyKnowledgeWebBindPayload', () => {
  const valid = {
    token: 'cka_testtoken',
    apiBaseUrl: 'https://knowledge.example.com',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    nickname: 'Ada',
    maxClearance: 'S1',
  };

  it('accepts a valid payload', () => {
    const r = parseCompanyKnowledgeWebBindPayload(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.token).toBe('cka_testtoken');
      expect(r.value.maxClearance).toBe('S1');
    }
  });

  it('normalizes maxClearance case', () => {
    const r = parseCompanyKnowledgeWebBindPayload({ ...valid, maxClearance: 's2' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.maxClearance).toBe('S2');
  });

  it('rejects token without cka_ prefix', () => {
    const r = parseCompanyKnowledgeWebBindPayload({ ...valid, token: 'wrong' });
    expect(r.ok).toBe(false);
  });

  it('rejects non-http(s) apiBaseUrl', () => {
    const r = parseCompanyKnowledgeWebBindPayload({ ...valid, apiBaseUrl: 'ftp://x' });
    expect(r.ok).toBe(false);
  });

  it('rejects invalid clearance', () => {
    const r = parseCompanyKnowledgeWebBindPayload({ ...valid, maxClearance: 'S3' });
    expect(r.ok).toBe(false);
  });
});
