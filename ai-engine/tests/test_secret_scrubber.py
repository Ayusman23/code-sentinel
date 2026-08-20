import pytest
import time
from app.core.secret_scrubber import SecretScrubber

def test_secret_scrubber_aws_key():
    raw_diff = """
    + const aws_key = "AKIAIOSFODNN7EXAMPL9";
    + const region = "us-east-1";
    """
    sanitized, findings, elapsed_ms = SecretScrubber.scrub(raw_diff, "config/aws.js")
    
    assert elapsed_ms < 15.0  # sub-millisecond execution target
    assert len(findings) == 1
    assert findings[0].rule_id == "AWS_ACCESS_KEY"
    assert "AKIAIOSFODNN7EXAMPL9" not in sanitized
    assert "[SCRUBBED_AWS_ACCESS_KEY_HASH_" in sanitized

def test_secret_scrubber_github_pat():
    raw_diff = """
    + const gh_token = "ghp_1234567890abcdefghijklmnopqrstuvwxyzAB";
    """
    sanitized, findings, _ = SecretScrubber.scrub(raw_diff, "scripts/deploy.js")
    assert len(findings) == 1
    assert findings[0].rule_id == "GITHUB_PAT"
    assert "ghp_" not in sanitized

def test_secret_scrubber_entropy_exclusion():
    # Plain text should not trigger high-entropy secret rules
    plain_diff = """
    + const title = "This is a standard text string with normal entropy";
    + const port = 8080;
    """
    sanitized, findings, _ = SecretScrubber.scrub(plain_diff, "src/index.js")
    assert len(findings) == 0
    assert sanitized == plain_diff
