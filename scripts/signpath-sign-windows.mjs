#!/usr/bin/env node
/**
 * Sign Windows .exe files through the SignPath REST API (SubmitWithArtifact).
 *
 * Bypasses signpath/github-action-submit-signing-request (GitHub connector),
 * which has been returning HTTP 503 while app.signpath.io/Api remains reachable.
 *
 * Artifact configuration must accept a ZIP whose members are PE files (*.exe).
 */
import { createReadStream, createWriteStream } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, inflateRawSync } from 'node:zlib';

export const DEFAULT_ORGANIZATION_ID = '05aeab6b-bde4-460b-90e0-808d9f83779b';
export const DEFAULT_PROJECT_SLUG = 'GGquanta';
export const DEFAULT_SIGNING_POLICY_SLUG = 'GGquanta-sign';
export const DEFAULT_API_ORIGIN = 'https://app.signpath.io/Api/v1';

const ZIP_LOCAL_SIG = 0x04034b50;
const ZIP_CENTRAL_SIG = 0x02014b50;
const ZIP_EOCD_SIG = 0x06054b50;

export function isRetryableStatus(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export function parseArgs(argv) {
  const out = {
    inputDir: 'release',
    outputDir: 'release/signed',
    description: '',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--input-dir' && next) {
      out.inputDir = next;
      i += 1;
    } else if (arg === '--output-dir' && next) {
      out.outputDir = next;
      i += 1;
    } else if (arg === '--description' && next) {
      out.description = next;
      i += 1;
    }
  }
  return out;
}

export function loadConfig(env = process.env) {
  const apiToken = env.SIGNPATH_API_TOKEN?.trim();
  if (!apiToken) {
    throw new Error('SIGNPATH_API_TOKEN is required');
  }
  const organizationId = env.SIGNPATH_ORGANIZATION_ID?.trim() || DEFAULT_ORGANIZATION_ID;
  const projectSlug = env.SIGNPATH_PROJECT_SLUG?.trim() || DEFAULT_PROJECT_SLUG;
  const signingPolicySlug = env.SIGNPATH_SIGNING_POLICY_SLUG?.trim() || DEFAULT_SIGNING_POLICY_SLUG;
  const artifactConfigurationSlug = env.SIGNPATH_ARTIFACT_CONFIGURATION_SLUG?.trim() || '';
  const apiOrigin = (env.SIGNPATH_API_BASE?.trim() || DEFAULT_API_ORIGIN).replace(/\/$/, '');
  return {
    apiToken,
    organizationId,
    projectSlug,
    signingPolicySlug,
    artifactConfigurationSlug,
    apiBase: `${apiOrigin}/${organizationId}`,
    waitTimeoutMs: Number(env.SIGNPATH_WAIT_TIMEOUT_MS || 30 * 60 * 1000),
    retryTimeoutMs: Number(env.SIGNPATH_RETRY_TIMEOUT_MS || 10 * 60 * 1000),
  };
}

export async function listExeFiles(inputDir) {
  const names = await readdir(inputDir);
  const files = [];
  for (const name of names) {
    if (!name.toLowerCase().endsWith('.exe')) continue;
    const fullPath = path.join(inputDir, name);
    const info = await stat(fullPath);
    if (info.isFile()) files.push({ name, fullPath, size: info.size });
  }
  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear() - 1980, 0);
  const dosDate = (year << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  return { dosDate, dosTime };
}

async function fileCrc32(filePath) {
  let digest = 0;
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    digest = crc32(chunk, digest);
  }
  return digest >>> 0;
}

export async function zipExeFiles(exeFiles, zipPath) {
  if (!exeFiles.length) {
    throw new Error(`No .exe files to zip for SignPath`);
  }
  const { dosDate, dosTime } = dosDateTime();
  const central = [];
  const output = createWriteStream(zipPath);
  let offset = 0;

  const writeBuf = async (buf) => {
    offset += buf.length;
    if (!output.write(buf)) {
      await new Promise((resolve) => output.once('drain', resolve));
    }
  };

  for (const file of exeFiles) {
    const nameBytes = Buffer.from(file.name, 'utf8');
    const crc = await fileCrc32(file.fullPath);
    const localHeader = Buffer.alloc(30 + nameBytes.length);
    localHeader.writeUInt32LE(ZIP_LOCAL_SIG, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(file.size, 18);
    localHeader.writeUInt32LE(file.size, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBytes.copy(localHeader, 30);

    const localOffset = offset;
    await writeBuf(localHeader);
    const src = createReadStream(file.fullPath);
    for await (const chunk of src) {
      await writeBuf(chunk);
    }

    const entry = Buffer.alloc(46 + nameBytes.length);
    entry.writeUInt32LE(ZIP_CENTRAL_SIG, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(0, 10);
    entry.writeUInt16LE(dosTime, 12);
    entry.writeUInt16LE(dosDate, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(file.size, 20);
    entry.writeUInt32LE(file.size, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt16LE(0, 30);
    entry.writeUInt16LE(0, 32);
    entry.writeUInt16LE(0, 34);
    entry.writeUInt16LE(0, 36);
    entry.writeUInt32LE(0, 38);
    entry.writeUInt32LE(localOffset, 42);
    nameBytes.copy(entry, 46);
    central.push(entry);
  }

  const centralOffset = offset;
  for (const entry of central) {
    await writeBuf(entry);
  }
  const centralSize = offset - centralOffset;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(ZIP_EOCD_SIG, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);
  await writeBuf(eocd);

  await new Promise((resolve, reject) => {
    output.end((err) => (err ? reject(err) : resolve()));
  });
  return zipPath;
}

function findEocd(buffer) {
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === ZIP_EOCD_SIG) return i;
  }
  throw new Error('Signed artifact is not a ZIP (EOCD missing)');
}

export async function extractExeFilesFromZip(zipBuffer, outputDir) {
  const eocd = findEocd(zipBuffer);
  const entryCount = zipBuffer.readUInt16LE(eocd + 10);
  let centralOffset = zipBuffer.readUInt32LE(eocd + 16);
  const extracted = [];
  await mkdir(outputDir, { recursive: true });

  for (let i = 0; i < entryCount; i += 1) {
    if (zipBuffer.readUInt32LE(centralOffset) !== ZIP_CENTRAL_SIG) {
      throw new Error('Invalid ZIP central directory');
    }
    const method = zipBuffer.readUInt16LE(centralOffset + 10);
    const compactSize = zipBuffer.readUInt32LE(centralOffset + 20);
    const uncompSize = zipBuffer.readUInt32LE(centralOffset + 24);
    const nameLen = zipBuffer.readUInt16LE(centralOffset + 28);
    const extraLen = zipBuffer.readUInt16LE(centralOffset + 30);
    const commentLen = zipBuffer.readUInt16LE(centralOffset + 32);
    const localOffset = zipBuffer.readUInt32LE(centralOffset + 42);
    const name = zipBuffer.subarray(centralOffset + 46, centralOffset + 46 + nameLen).toString('utf8');
    centralOffset += 46 + nameLen + extraLen + commentLen;

    const base = path.posix.basename(name.replaceAll('\\', '/'));
    if (!base || base.endsWith('/') || !base.toLowerCase().endsWith('.exe')) continue;

    const localNameLen = zipBuffer.readUInt16LE(localOffset + 26);
    const localExtraLen = zipBuffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const compact = zipBuffer.subarray(dataStart, dataStart + compactSize);
    const data = method === 0
      ? compact
      : method === 8
        ? inflateRawSync(compact)
        : (() => { throw new Error(`Unsupported ZIP method ${method} for ${base}`); })();
    if (data.length !== uncompSize) {
      throw new Error(`ZIP size mismatch for ${base}: ${data.length} != ${uncompSize}`);
    }
    const dest = path.join(outputDir, base);
    await writeFile(dest, data);
    extracted.push(dest);
  }
  return extracted.sort();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(url, init, {
  retryTimeoutMs,
  fetchImpl = fetch,
  now = Date.now,
  log = console,
} = {}) {
  const started = now();
  let attempt = 0;
  let delayMs = 1000;
  while (true) {
    attempt += 1;
    let response;
    try {
      response = await fetchImpl(url, init);
    } catch (error) {
      if (now() - started >= retryTimeoutMs) throw error;
      log.info?.(`SignPath request failed (${error.message}); retrying in ${delayMs}ms`);
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 30_000);
      continue;
    }
    if (!isRetryableStatus(response.status)) return response;
    if (now() - started >= retryTimeoutMs) return response;
    log.info?.(`SignPath REST API is temporarily unavailable (HTTP ${response.status}); retrying in ${delayMs}ms`);
    await sleep(delayMs);
    delayMs = Math.min(delayMs * 2, 30_000);
    if (attempt > 20) return response;
  }
}

function encodeMultipart(fields, fileField) {
  const boundary = `----SignPathBoundary${process.hrtime.bigint().toString()}`;
  const chunks = [];
  for (const [name, value] of Object.entries(fields)) {
    if (!value) continue;
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
    ));
  }
  chunks.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`,
  ));
  chunks.push(fileField.body);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(chunks),
  };
}

export function signingRequestStatusUrl(apiBase, signingRequestId) {
  return `${apiBase}/SigningRequests/${signingRequestId}/Status`;
}

export function signedArtifactUrl(apiBase, signingRequestId) {
  return `${apiBase}/SigningRequests/${signingRequestId}/SignedArtifact`;
}

export async function submitSigningRequest({
  config,
  zipBuffer,
  description,
  fetchImpl = fetch,
  log = console,
}) {
  const fields = {
    projectSlug: config.projectSlug,
    signingPolicySlug: config.signingPolicySlug,
    description,
  };
  if (config.artifactConfigurationSlug) {
    fields.artifactConfigurationSlug = config.artifactConfigurationSlug;
  }
  const multipart = encodeMultipart(fields, {
    name: 'artifact',
    filename: 'unsigned-windows.zip',
    contentType: 'application/zip',
    body: zipBuffer,
  });
  log.info?.(`Submitting SignPath REST signing request (${config.projectSlug}/${config.signingPolicySlug})`);
  const response = await fetchWithRetry(
    `${config.apiBase}/SigningRequests/SubmitWithArtifact`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': multipart.contentType,
      },
      body: multipart.body,
    },
    { retryTimeoutMs: config.retryTimeoutMs, fetchImpl, log },
  );
  const text = await response.text();
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`SignPath SubmitWithArtifact failed HTTP ${response.status}: ${text.slice(0, 800)}`);
  }
  const payload = JSON.parse(text);
  if (!payload.signingRequestId) {
    throw new Error(`SignPath SubmitWithArtifact returned no signingRequestId: ${text.slice(0, 800)}`);
  }
  log.info?.(`SignPath signing request ${payload.signingRequestId} (${payload.workflowStatus || payload.status})`);
  if (payload.webLink) log.info?.(`SignPath UI: ${payload.webLink}`);
  return payload;
}

export async function pollUntilFinal({
  config,
  signingRequestId,
  fetchImpl = fetch,
  log = console,
  now = Date.now,
  sleepImpl = sleep,
}) {
  const started = now();
  let delayMs = 5000;
  while (true) {
    const response = await fetchWithRetry(
      signingRequestStatusUrl(config.apiBase, signingRequestId),
      { headers: { Authorization: `Bearer ${config.apiToken}` } },
      { retryTimeoutMs: config.retryTimeoutMs, fetchImpl, log },
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`SignPath status failed HTTP ${response.status}: ${text.slice(0, 800)}`);
    }
    const payload = JSON.parse(text);
    log.info?.(`SignPath status=${payload.status} workflow=${payload.workflowStatus}`);
    if (payload.isFinalStatus) {
      if (payload.status !== 'Completed') {
        throw new Error(`SignPath signing did not complete: status=${payload.status} workflow=${payload.workflowStatus}`);
      }
      return payload;
    }
    if (now() - started >= config.waitTimeoutMs) {
      throw new Error(`SignPath signing timed out after ${config.waitTimeoutMs}ms (status=${payload.status})`);
    }
    await sleepImpl(delayMs);
    delayMs = Math.min(delayMs + 2000, 20_000);
  }
}

export async function downloadSignedArtifact({
  config,
  signingRequestId,
  fetchImpl = fetch,
  log = console,
}) {
  log.info?.('Downloading signed artifact from SignPath REST API');
  const response = await fetchWithRetry(
    signedArtifactUrl(config.apiBase, signingRequestId),
    { headers: { Authorization: `Bearer ${config.apiToken}` } },
    { retryTimeoutMs: config.retryTimeoutMs, fetchImpl, log },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SignPath SignedArtifact failed HTTP ${response.status}: ${text.slice(0, 800)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function signWindowsExecutables({
  inputDir,
  outputDir,
  description,
  env = process.env,
  fetchImpl = fetch,
  log = console,
}) {
  const config = loadConfig(env);
  const exeFiles = await listExeFiles(inputDir);
  if (!exeFiles.length) {
    throw new Error(`No unsigned .exe files found in ${inputDir}`);
  }
  log.info?.(`Found ${exeFiles.length} unsigned .exe file(s):`);
  for (const file of exeFiles) log.info?.(` - ${file.name} (${file.size} bytes)`);

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'signpath-'));
  try {
    const zipPath = path.join(tmpDir, 'unsigned-windows.zip');
    await zipExeFiles(exeFiles, zipPath);
    const zipBuffer = await readFile(zipPath);
    log.info?.(`Uploaded ZIP size: ${zipBuffer.length} bytes`);
    const submitted = await submitSigningRequest({
      config,
      zipBuffer,
      description: description || `SmartX Windows ${exeFiles.map((file) => file.name).join(', ')}`,
      fetchImpl,
      log,
    });
    await pollUntilFinal({
      config,
      signingRequestId: submitted.signingRequestId,
      fetchImpl,
      log,
    });
    const signedZip = await downloadSignedArtifact({
      config,
      signingRequestId: submitted.signingRequestId,
      fetchImpl,
      log,
    });
    const extracted = await extractExeFilesFromZip(signedZip, outputDir);
    if (extracted.length !== exeFiles.length) {
      throw new Error(`Signed .exe count (${extracted.length}) does not match unsigned count (${exeFiles.length})`);
    }
    log.info?.(`Wrote ${extracted.length} signed .exe file(s) to ${outputDir}`);
    return { signingRequestId: submitted.signingRequestId, extracted };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  await signWindowsExecutables(args);
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
