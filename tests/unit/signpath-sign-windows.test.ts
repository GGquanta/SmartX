import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { crc32, deflateRawSync } from 'node:zlib';

import {
  DEFAULT_ORGANIZATION_ID,
  extractExeFilesFromZip,
  isRetryableStatus,
  listExeFiles,
  loadConfig,
  parseArgs,
  pollUntilFinal,
  signingRequestStatusUrl,
  submitSigningRequest,
  zipExeFiles,
} from '../../scripts/signpath-sign-windows.mjs';

const tmpDirs: string[] = [];

async function makeTmp() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'signpath-test-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('signpath-sign-windows', () => {
  it('parses CLI args and loads config defaults', () => {
    expect(parseArgs([
      '--input-dir', 'out',
      '--output-dir', 'signed',
      '--description', 'v1',
    ])).toEqual({
      inputDir: 'out',
      outputDir: 'signed',
      description: 'v1',
    });

    const config = loadConfig({ SIGNPATH_API_TOKEN: 'token-value' });
    expect(config.organizationId).toBe(DEFAULT_ORGANIZATION_ID);
    expect(config.projectSlug).toBe('GGquanta');
    expect(config.signingPolicySlug).toBe('GGquanta-sign');
    expect(config.apiToken).toBe('token-value');
    expect(config.apiBase).toContain(DEFAULT_ORGANIZATION_ID);
  });

  it('requires an API token', () => {
    expect(() => loadConfig({})).toThrow(/SIGNPATH_API_TOKEN/);
  });

  it('retries only transient HTTP statuses', () => {
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
  });

  it('zips and extracts PE files by basename', async () => {
    const dir = await makeTmp();
    const input = path.join(dir, 'in');
    const output = path.join(dir, 'out');
    await mkdir(input);
    await writeFile(path.join(input, 'SmartX-1.0.0-win-x64.exe'), Buffer.from('MZ-one'));
    await writeFile(path.join(input, 'nested.exe'), Buffer.from('MZ-two'));

    const files = await listExeFiles(input);
    expect(files.map((file) => file.name).sort()).toEqual([
      'SmartX-1.0.0-win-x64.exe',
      'nested.exe',
    ].sort());

    const zipPath = path.join(dir, 'unsigned.zip');
    await zipExeFiles(files, zipPath);
    const zipBuffer = await readFile(zipPath);
    const extracted = await extractExeFilesFromZip(zipBuffer, output);
    expect(extracted.map((file) => path.basename(file)).sort()).toEqual([
      'SmartX-1.0.0-win-x64.exe',
      'nested.exe',
    ]);
    expect(await readFile(path.join(output, 'SmartX-1.0.0-win-x64.exe'), 'utf8')).toBe('MZ-one');
  });

  it('extracts DEFLATE zip members returned by SignPath', async () => {
    const dir = await makeTmp();
    const name = 'SmartX-signed.exe';
    const payload = Buffer.from('MZ-signed-bytes');
    const nameBytes = Buffer.from(name);
    const compact = deflateRawSync(payload);
    const crc = crc32(payload) >>> 0;
    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compact.length, 18);
    local.writeUInt32LE(payload.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    nameBytes.copy(local, 30);
    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compact.length, 20);
    central.writeUInt32LE(payload.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    nameBytes.copy(central, 46);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(1, 8);
    eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(central.length, 12);
    eocd.writeUInt32LE(local.length + compact.length, 16);
    const zipBuffer = Buffer.concat([local, compact, central, eocd]);
    const extracted = await extractExeFilesFromZip(zipBuffer, dir);
    expect(extracted).toHaveLength(1);
    expect(await readFile(extracted[0], 'utf8')).toBe('MZ-signed-bytes');
  });

  it('submits multipart REST signing requests without using the GitHub connector', async () => {
    const calls: Array<{ url: string; method?: string }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), method: init?.method });
      return new Response(JSON.stringify({
        signingRequestId: 'req-1',
        status: 'InProgress',
        workflowStatus: 'QueuedForProcessing',
      }), { status: 201 });
    };

    const payload = await submitSigningRequest({
      config: loadConfig({ SIGNPATH_API_TOKEN: 'secret-token' }),
      zipBuffer: Buffer.from('PK\u0003\u0004'),
      description: 'test',
      fetchImpl,
      log: { info() {} },
    });
    expect(payload.signingRequestId).toBe('req-1');
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url).toContain('/SigningRequests/SubmitWithArtifact');
    expect(calls[0]?.url).not.toContain('connectors.signpath.io');
  });

  it('polls until SignPath reports a completed request', async () => {
    let n = 0;
    const fetchImpl: typeof fetch = async (url) => {
      n += 1;
      expect(String(url)).toBe(signingRequestStatusUrl(
        `https://app.signpath.io/Api/v1/${DEFAULT_ORGANIZATION_ID}`,
        'req-1',
      ));
      const done = n > 1;
      return new Response(JSON.stringify({
        signingRequestId: 'req-1',
        status: done ? 'Completed' : 'InProgress',
        workflowStatus: done ? 'Completed' : 'Processing',
        isFinalStatus: done,
      }));
    };

    const result = await pollUntilFinal({
      config: loadConfig({ SIGNPATH_API_TOKEN: 'secret-token' }),
      signingRequestId: 'req-1',
      fetchImpl,
      log: { info() {} },
      sleepImpl: async () => {},
    });
    expect(result.status).toBe('Completed');
    expect(n).toBe(2);
  });

  it('fails polling when SignPath finishes in a non-completed state', async () => {
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({
      signingRequestId: 'req-1',
      status: 'Failed',
      workflowStatus: 'ProcessingFailed',
      isFinalStatus: true,
    }));

    await expect(pollUntilFinal({
      config: loadConfig({ SIGNPATH_API_TOKEN: 'secret-token' }),
      signingRequestId: 'req-1',
      fetchImpl,
      log: { info() {} },
      sleepImpl: async () => {},
    })).rejects.toThrow(/did not complete/);
  });
});
