/** @jest-environment node */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { safeWebExport } = require('../safe-web-export.cjs');
const { registerWebPreview } = require('../web-preview-lease.cjs');

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-export-test-'));
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'dist', 'preview.txt'), 'previous preview');
});
afterEach(() => {
  if (path.dirname(root) === fs.realpathSync(os.tmpdir())) fs.rmSync(root, { recursive: true, force: true });
});

it.each(['export', 'validation'])('keeps the previous preview after a failed %s', async failure => {
  await expect(safeWebExport(root, async stage => {
    fs.writeFileSync(path.join(stage, 'preview.txt'), 'partial export');
    if (failure === 'export') throw new Error('export failed');
  }, async () => {
    if (failure === 'validation') throw new Error('invalid renderer');
  })).rejects.toThrow();
  expect(fs.readFileSync(path.join(root, 'dist', 'preview.txt'), 'utf8')).toBe('previous preview');
  expect(fs.existsSync(path.join(root, '.expo', 'web-export.lock'))).toBe(false);
});

it('publishes only after a complete export validates', async () => {
  await safeWebExport(root, async stage => {
    fs.writeFileSync(path.join(stage, 'preview.txt'), 'new preview');
    expect(fs.readFileSync(path.join(root, 'dist', 'preview.txt'), 'utf8')).toBe('previous preview');
  }, async stage => {
    expect(fs.readFileSync(path.join(stage, 'preview.txt'), 'utf8')).toBe('new preview');
  });
  expect(fs.readFileSync(path.join(root, 'dist', 'preview.txt'), 'utf8')).toBe('new preview');
});

it('rejects an overlapping export without damaging the active build', async () => {
  let resume;
  let notifyStarted;
  const started = new Promise(resolve => { notifyStarted = resolve; });
  const first = safeWebExport(root, async stage => {
    fs.writeFileSync(path.join(stage, 'preview.txt'), 'new preview');
    notifyStarted();
    await new Promise(resolve => { resume = resolve; });
  }, async () => {});
  await started;
  await expect(safeWebExport(root, async () => {}, async () => {})).rejects.toThrow('Another web export');
  expect(() => registerWebPreview(root)).toThrow('A web export is running');
  expect(fs.readFileSync(path.join(root, 'dist', 'preview.txt'), 'utf8')).toBe('previous preview');
  resume();
  await first;
  expect(fs.readFileSync(path.join(root, 'dist', 'preview.txt'), 'utf8')).toBe('new preview');
});

it('protects a running preview from replacement until it stops', async () => {
  const releasePreview = registerWebPreview(root);
  try {
    await expect(safeWebExport(root, async () => {}, async () => {})).rejects.toThrow('A local production preview is running');
    expect(fs.readFileSync(path.join(root, 'dist', 'preview.txt'), 'utf8')).toBe('previous preview');
  } finally {
    releasePreview();
  }
  await safeWebExport(root, async stage => {
    fs.writeFileSync(path.join(stage, 'preview.txt'), 'new preview');
  }, async () => {});
  expect(fs.readFileSync(path.join(root, 'dist', 'preview.txt'), 'utf8')).toBe('new preview');
});
