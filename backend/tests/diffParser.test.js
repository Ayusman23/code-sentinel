const { describe, it } = require('node:test');
const assert = require('node:assert');
const DiffParser = require('../src/utils/diffParser');

describe('DiffParser Token Guardian & Extension Filtering', () => {
  it('filters out package-lock.json and yarn.lock files from diff payload', () => {
    const files = [
      { filename: 'src/services/auth.ts', patch: '+ export function login() {}', additions: 1, deletions: 0 },
      { filename: 'package-lock.json', patch: '+ "version": "1.0.0"', additions: 1, deletions: 0 },
      { filename: 'yarn.lock', patch: '+ some-package@1.0.0', additions: 1, deletions: 0 }
    ];

    const result = DiffParser.filterAndChunkDiffs(files);
    assert.strictEqual(result.actionableFiles.length, 1);
    assert.strictEqual(result.actionableFiles[0].filename, 'src/services/auth.ts');
    assert.strictEqual(result.ignoredFiles.length, 2);
  });

  it('filters out binary image and asset files (.png, .pdf, .bin)', () => {
    const files = [
      { filename: 'assets/logo.png', patch: 'binary content', additions: 0, deletions: 0 },
      { filename: 'docs/arch.pdf', patch: 'binary content', additions: 0, deletions: 0 },
      { filename: 'src/routes/api.js', patch: '+ router.get("/status", handler);', additions: 1, deletions: 0 }
    ];

    const result = DiffParser.filterAndChunkDiffs(files);
    assert.strictEqual(result.actionableFiles.length, 1);
    assert.strictEqual(result.actionableFiles[0].filename, 'src/routes/api.js');
    assert.strictEqual(result.ignoredFiles.length, 2);
  });

  it('chunks and truncates massive diff patches exceeding line safety threshold', () => {
    const massiveLines = Array.from({ length: 650 }, (_, i) => `+ const line${i} = ${i};`).join('\n');
    const files = [
      { filename: 'src/generated/types.ts', patch: massiveLines, additions: 650, deletions: 0 }
    ];

    const result = DiffParser.filterAndChunkDiffs(files);
    assert.strictEqual(result.actionableFiles.length, 1);
    assert.strictEqual(result.actionableFiles[0].isTruncated, true);
    assert.ok(result.actionableFiles[0].patch.includes('DIFF TRUNCATED'));
  });
});
