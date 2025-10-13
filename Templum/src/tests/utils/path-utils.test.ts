import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { PathUtils } from '../../utils/path-utils';

describe('PathUtils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'templum-path-utils-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('safe join respects sandbox guard and produces high confidence paths', () => {
    const sandbox = tempDir;
    const handle = PathUtils.from(sandbox, { sandbox });
    const joined = handle.join('services', 'service-registry.json');

    expect(joined.path).toEqual(path.join(sandbox, 'services', 'service-registry.json'));
    expect(joined.confidence).toBeGreaterThan(0.8);
  });

  test('safe join blocks directory traversal outside sandbox', () => {
    const sandbox = tempDir;
    const handle = PathUtils.from(sandbox, { sandbox });

    expect(() => handle.join('..', '..', 'etc', 'passwd')).toThrowErrorMatchingInlineSnapshot(`
      "Path resolution blocked: Attempted to escape sandbox root"
    `);
  });

  test('ensureDir creates nested directories with confidence metadata', async () => {
    const servicesHandle = PathUtils.from(tempDir, { sandbox: tempDir }).join('services');
    const result = await servicesHandle.ensureDir();

    expect(result.ok).toBe(true);
    expect(result.value?.path).toEqual(path.join(tempDir, 'services'));
    expect(result.confidence).toBeGreaterThan(0.8);

    const stat = await fs.stat(path.join(tempDir, 'services'));
    expect(stat.isDirectory()).toBe(true);
  });

  test('writeJSON and readJSON round-trip data with fallback handling', async () => {
    const configDirHandle = PathUtils.from(tempDir, { sandbox: tempDir }).join('config');
    await configDirHandle.ensureDir();

    const fileHandle = configDirHandle.join('templum.json');
    const payload = { id: 'templum', services: ['haruspex'], version: 1 };

    const writeResult = await fileHandle.writeJSON(payload);
    expect(writeResult.ok).toBe(true);

    const readResult = await fileHandle.readJSON<typeof payload>();
    expect(readResult.ok).toBe(true);
    expect(readResult.value).toEqual(payload);
    expect(readResult.confidence).toBeGreaterThan(0.8);

    const missingHandle = configDirHandle.join('missing.json');
    const fallback = await missingHandle.readJSON({ fallback: { missing: true } });
    expect(fallback.ok).toBe(true);
    expect(fallback.value).toEqual({ missing: true });
    expect(fallback.confidence).toBe(0.5);
  });

  test('exists exposes boolean state without throwing and returns operation metadata', async () => {
    const handle = PathUtils.from(tempDir, { sandbox: tempDir }).join('services');

    const missing = await handle.exists();
    expect(missing.ok).toBe(true);
    expect(missing.value).toBe(false);

    await handle.ensureDir();
    const existing = await handle.exists();
    expect(existing.ok).toBe(true);
    expect(existing.value).toBe(true);
  });

  test('findUp locates nearest marker and reports null when absent', async () => {
    const nestedPath = path.join(tempDir, 'a', 'b', 'c');
    await fs.mkdir(nestedPath, { recursive: true });
    const markerDir = path.join(tempDir, 'a');
    await fs.writeFile(path.join(markerDir, 'marker.file'), 'marker');

    const found = await PathUtils.findUp(nestedPath, ['marker.file']);
    expect(found.ok).toBe(true);
    expect(found.value).toEqual(markerDir);

    const none = await PathUtils.findUp(tempDir, ['does-not-exist']);
    expect(none.ok).toBe(true);
    expect(none.value).toBeNull();
    expect(none.confidence).toBe(0.4);
  });
});
