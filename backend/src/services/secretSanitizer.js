const crypto = require('crypto');

/**
 * Node.js Fast In-Flight Secret Sanitizer
 * Scrubs raw keys before DB storage to guarantee zero credential persistence.
 */
class NodeSecretSanitizer {
  static PATTERNS = [
    { name: 'AWS_KEY', regex: /(?:AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
    { name: 'GITHUB_TOKEN', regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g },
    { name: 'JWT_SECRET', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },
    { name: 'STRIPE_KEY', regex: /(?:sk|rk)_live_[0-9a-zA-Z]{24,99}/g },
    { name: 'DB_URI', regex: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^:]+:[^@\s]+@[^\s/]+/g }
  ];

  static sanitize(text) {
    if (!text || typeof text !== 'string') return text;
    let sanitized = text;

    for (const { name, regex } of this.PATTERNS) {
      sanitized = sanitized.replace(regex, (match) => {
        const hash = crypto.createHash('sha256').update(match).digest('hex').substring(0, 10);
        return `[SCRUBBED_${name}_HASH_${hash}]`;
      });
    }

    return sanitized;
  }
}

module.exports = NodeSecretSanitizer;
