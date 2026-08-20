import re
import math
import hashlib
import time
from typing import List, Tuple
from app.models.schemas import SecretInterceptionResult

class SecretScrubber:
    """
    Sub-Millisecond In-Flight Secret Interception Pipeline.
    Evaluates raw diffs against compiled high-precision regex signatures
    and Shannon entropy thresholds to catch and scrub credentials before persistent indexing.
    """
    
    # Pre-compiled high-precision secret regexes
    PATTERNS = [
        (
            "AWS_ACCESS_KEY",
            "AWS Access Key ID",
            re.compile(r'(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}')
        ),
        (
            "AWS_SECRET_KEY",
            "AWS Secret Access Key",
            re.compile(r'(?i)(?:aws_secret_access_key|aws_secret_key|aws_access_secret)\s*[:=]\s*["\']?([a-zA-Z0-9/+=]{40})["\']?')
        ),
        (
            "GITHUB_PAT",
            "GitHub Personal Access Token",
            re.compile(r'(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}')
        ),
        (
            "GITHUB_FINE_GRAINED",
            "GitHub Fine-Grained Token",
            re.compile(r'github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}')
        ),
        (
            "JWT_TOKEN",
            "JSON Web Token (Hardcoded Secret)",
            re.compile(r'eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}')
        ),
        (
            "STRIPE_API_KEY",
            "Stripe Secret Key",
            re.compile(r'(?:sk|rk)_live_[0-9a-zA-Z]{24,99}')
        ),
        (
            "SLACK_TOKEN",
            "Slack API Token",
            re.compile(r'xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*')
        ),
        (
            "DATABASE_URI_WITH_CREDS",
            "Database Connection URI with Embedded Credentials",
            re.compile(r'(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis)://[^:]+:[^@\s]+@[^\s/]+')
        ),
        (
            "PRIVATE_KEY_BLOCK",
            "Unencrypted Private Key Block",
            re.compile(r'-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY-----[\s\S]*?-----END (?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY-----')
        ),
        (
            "GENERIC_HIGH_ENTROPY_API_KEY",
            "Generic High-Entropy API/Secret Key",
            re.compile(r'(?i)(?:api_key|secret_key|app_secret|auth_token|client_secret|private_token)\s*[:=]\s*["\']([a-zA-Z0-9_\-\.]{20,})["\']')
        )
    ]

    @staticmethod
    def calculate_shannon_entropy(data: str) -> float:
        """Calculates Shannon entropy of string to distinguish random secrets from dummy text."""
        if not data:
            return 0.0
        entropy = 0.0
        length = len(data)
        frequency = {}
        for char in data:
            frequency[char] = frequency.get(char, 0) + 1
        for count in frequency.values():
            prob = count / length
            entropy -= prob * math.log2(prob)
        return round(entropy, 3)

    @classmethod
    def scrub(cls, text: str, filename: str = "diff.patch", min_entropy: float = 3.2) -> Tuple[str, List[SecretInterceptionResult], float]:
        """
        Scrubs secrets in-place from input text in sub-millisecond latency.
        Returns: (sanitized_text, list_of_interceptions, execution_time_ms)
        """
        start_time = time.perf_counter()
        findings: List[SecretInterceptionResult] = []
        sanitized = text

        lines = text.split("\n")
        
        for line_idx, line in enumerate(lines, start=1):
            for rule_id, secret_type, pattern in cls.PATTERNS:
                matches = pattern.finditer(line)
                for match in matches:
                    matched_str = match.group(0)
                    # Extract capture group if present, otherwise whole match
                    secret_candidate = match.group(1) if match.lastindex and match.lastindex >= 1 else matched_str
                    
                    entropy = cls.calculate_shannon_entropy(secret_candidate)
                    
                    # Exclude obvious placeholder tokens
                    upper_c = secret_candidate.upper()
                    if upper_c.startswith("YOUR_") or upper_c.startswith("MY_") or "<" in secret_candidate or "DUMMY_KEY" in upper_c:
                        continue
                    
                    # Private keys and DB URIs do not require high single-token entropy
                    if rule_id not in ("PRIVATE_KEY_BLOCK", "DATABASE_URI_WITH_CREDS", "AWS_ACCESS_KEY") and entropy < min_entropy and len(secret_candidate) < 32:
                        continue

                    # Hash the secret for secure audit telemetry
                    secret_hash = hashlib.sha256(secret_candidate.encode()).hexdigest()[:12]
                    redacted_preview = (
                        secret_candidate[:3] + "..." + secret_candidate[-3:] 
                        if len(secret_candidate) > 8 
                        else "***"
                    )
                    
                    findings.append(SecretInterceptionResult(
                        rule_id=rule_id,
                        secret_type=secret_type,
                        file=filename,
                        line=line_idx,
                        raw_matched_hash=f"sha256:{secret_hash}",
                        entropy_score=entropy,
                        is_live_risk=True,
                        redacted_preview=f"[REDACTED_SECRET_{rule_id}_{secret_hash}] ({redacted_preview})"
                    ))
                    
                    # In-place sanitization
                    replacement = f"[SCRUBBED_{rule_id}_HASH_{secret_hash}]"
                    sanitized = sanitized.replace(secret_candidate, replacement)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return sanitized, findings, round(elapsed_ms, 3)
