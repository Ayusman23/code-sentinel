import re
from typing import List, Tuple, Dict, Any
from app.models.schemas import Vulnerability

class NoiseFilter:
    """
    High-Signal Noise Suppression Engine.
    Filters out stylistic, whitespace, quote, and formatting alerts (delegated to ESLint/Prettier)
    to eliminate PR review fatigue and focus exclusively on critical logic and security flaws.
    """

    # Patterns matching trivial linter noise
    NOISE_PATTERNS = [
        re.compile(r'(?i)missing\s+semicolon'),
        re.compile(r'(?i)trailing\s+(?:comma|whitespace|space)'),
        re.compile(r'(?i)use\s+(?:single|double)\s+quotes'),
        re.compile(r'(?i)line\s+length\s+exceeds'),
        re.compile(r'(?i)variable\s+name\s+should\s+be\s+camelCase'),
        re.compile(r'(?i)prefer\s+const\s+over\s+let'),
        re.compile(r'(?i)unused\s+import'),
        re.compile(r'(?i)missing\s+jsdoc\s+comment'),
        re.compile(r'(?i)indentation\s+expected'),
        re.compile(r'(?i)file\s+should\s+end\s+with\s+newline'),
        re.compile(r'(?i)formatting\s+inconsistency'),
        re.compile(r'(?i)redundant\s+parentheses')
    ]

    @classmethod
    def filter_vulnerabilities(cls, raw_vulns: List[Vulnerability]) -> Tuple[List[Vulnerability], Dict[str, Any]]:
        """
        Suppresses low-signal noise and returns actionable high-signal vulnerabilities.
        """
        high_signal_vulns: List[Vulnerability] = []
        suppressed_count = 0
        suppressed_reasons: Dict[str, int] = {}

        for vuln in raw_vulns:
            is_noise = False
            
            # Check title and description against noise patterns
            text_to_check = f"{vuln.title} {vuln.description} {vuln.rule_id}"
            for pattern in cls.NOISE_PATTERNS:
                if pattern.search(text_to_check):
                    is_noise = True
                    matched_kw = pattern.pattern
                    suppressed_reasons[matched_kw] = suppressed_reasons.get(matched_kw, 0) + 1
                    break

            if is_noise:
                suppressed_count += 1
            else:
                high_signal_vulns.append(vuln)

        total_analyzed = len(raw_vulns)
        signal_to_noise_ratio = (
            round((len(high_signal_vulns) / max(1, total_analyzed)) * 100, 1)
            if total_analyzed > 0 else 100.0
        )

        stats = {
            "total_rules_evaluated": total_analyzed,
            "suppressed_stylistic_alerts": suppressed_count,
            "retained_high_signal_findings": len(high_signal_vulns),
            "signal_ratio_percentage": signal_to_noise_ratio,
            "suppression_categories": suppressed_reasons
        }

        return high_signal_vulns, stats
