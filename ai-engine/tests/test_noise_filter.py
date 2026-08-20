import pytest
from app.core.noise_filter import NoiseFilter
from app.models.schemas import Vulnerability, SeverityEnum

def test_filters_whitespace_and_formatting_noise():
    raw_vulns = [
        Vulnerability(
            id="V-001",
            rule_id="LINT_SEMICOLON",
            title="Missing semicolon",
            severity=SeverityEnum.LOW,
            file="src/index.ts",
            line_start=10,
            line_end=10,
            description="Missing semicolon at end of statement",
            impact="None"
        ),
        Vulnerability(
            id="V-002",
            rule_id="CWE-306",
            title="Unauthenticated Endpoint",
            severity=SeverityEnum.CRITICAL,
            file="src/auth.ts",
            line_start=15,
            line_end=15,
            description="Mutation route exposed without authentication",
            impact="High"
        )
    ]
    high_signal, stats = NoiseFilter.filter_vulnerabilities(raw_vulns)
    assert len(high_signal) == 1
    assert high_signal[0].rule_id == "CWE-306"
    assert stats["suppressed_stylistic_alerts"] == 1
    assert stats["retained_high_signal_findings"] == 1
