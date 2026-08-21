/**
 * Enterprise Diff Parser & Token Limit Guardian
 * Pre-filters non-actionable lockfiles/binaries and chunks massive diffs before AI engine dispatch.
 */

const IGNORED_EXTENSIONS = new Set([
  // Lockfiles
  'lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'cargo.lock', 'gemfile.lock', 'poetry.lock', 'pipfile.lock',
  // Binaries & Archives
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'bmp', 'pdf', 'bin', 'exe', 'dll', 'so', 'dylib', 'zip', 'tar', 'gz', '7z', 'rar',
  // Minified & Sourcemaps
  'min.js', 'min.css', 'map', 'bundle.js', 'bundle.css',
  // Fonts & Documents
  'woff', 'woff2', 'ttf', 'eot', 'otf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // Audio / Video
  'mp4', 'mp3', 'wav', 'mov', 'avi', 'mkv'
]);

const MAX_LINES_PER_FILE = 500;
const MAX_PATCH_CHARS_PER_FILE = 25000;
const MAX_TOTAL_FILES_PER_BATCH = 25;

class DiffParser {
  /**
   * Filters and sanitizes an array of PR file diffs
   * @param {Array} files Array of { filename, patch, status, additions, deletions }
   * @returns {{ actionableFiles: Array, ignoredFiles: Array, totalAdditions: number, totalDeletions: number }}
   */
  static filterAndChunkDiffs(files = []) {
    const actionableFiles = [];
    const ignoredFiles = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const file of files) {
      const filename = file.filename || '';
      const ext = this._extractExtension(filename);
      const isLockfile = this._isLockfileName(filename);

      // 1. Filter out ignored extensions and lockfiles
      if (IGNORED_EXTENSIONS.has(ext) || isLockfile) {
        ignoredFiles.push({
          filename,
          reason: isLockfile ? 'LOCKFILE_SKIPPED' : `EXTENSION_${ext.toUpperCase()}_IGNORED`,
          additions: file.additions || 0,
          deletions: file.deletions || 0
        });
        continue;
      }

      // 2. Ensure patch exists and is a string
      let patch = typeof file.patch === 'string' ? file.patch : '';

      // Skip empty or purely deleted binary files
      if (!patch.trim() && file.status === 'removed') {
        ignoredFiles.push({ filename, reason: 'DELETED_EMPTY_FILE' });
        continue;
      }

      // 3. Chunk / truncate massive file patches to preserve LLM token limits
      const patchLines = patch.split('\n');
      if (patchLines.length > MAX_LINES_PER_FILE || patch.length > MAX_PATCH_CHARS_PER_FILE) {
        const truncatedLines = patchLines.slice(0, MAX_LINES_PER_FILE);
        truncatedLines.push(`\n# [... DIFF TRUNCATED: ${patchLines.length - MAX_LINES_PER_FILE} LINES OMITTED BY CODESENTINEL TOKEN GUARDIAN ...]`);
        patch = truncatedLines.join('\n');
      }

      totalAdditions += file.additions || 0;
      totalDeletions += file.deletions || 0;

      actionableFiles.push({
        filename: file.filename,
        old_path: file.old_path || file.previous_filename || null,
        status: file.status || 'modified',
        patch,
        additions: file.additions || patchLines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length,
        deletions: file.deletions || patchLines.filter(l => l.startsWith('-') && !l.startsWith('---')).length,
        isTruncated: patchLines.length > MAX_LINES_PER_FILE
      });

      // Cap batch size to prevent memory starvation
      if (actionableFiles.length >= MAX_TOTAL_FILES_PER_BATCH) {
        break;
      }
    }

    return {
      actionableFiles,
      ignoredFiles,
      totalAdditions,
      totalDeletions
    };
  }

  /**
   * Helper to extract file extension
   */
  static _extractExtension(filename = '') {
    const parts = filename.toLowerCase().split('.');
    if (parts.length <= 1) return '';
    // Handle double extensions like .min.js
    if (parts.length > 2 && (parts[parts.length - 2] === 'min' || parts[parts.length - 2] === 'bundle')) {
      return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return parts[parts.length - 1];
  }

  /**
   * Helper to detect lockfiles by exact base name
   */
  static _isLockfileName(filename = '') {
    const base = filename.toLowerCase().split('/').pop();
    return [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'composer.lock',
      'cargo.lock',
      'gemfile.lock',
      'poetry.lock',
      'pipfile.lock'
    ].includes(base);
  }
}

module.exports = DiffParser;
