import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const checkScript = join(repoRoot, 'scripts', 'check-doc-links.mjs');
const roots = [];

afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

test('doc link check ignores links inside fenced Markdown examples', () => {
  const root = mkdtempSync(join(tmpdir(), 'iln-doc-links-'));
  roots.push(root);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'real-target.md'), '# Exists\n');
  writeFileSync(
    join(root, 'guide.md'),
    '# Guide\n\n```md\n[example](missing-example.md)\n```\n\n[real](real-target.md)\n'
  );

  const result = spawnSync(process.execPath, [checkScript, 'guide.md'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /missing-example\.md/);
});
