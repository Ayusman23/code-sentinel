import pytest
from app.core.secret_scrubber import SecretScrubber

def test_secret_scrubber_aws_key():
    diff = """
    + const aws_key = "AKIAIOSFODNN7EXAMPL9";
    + const secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
    """
    sanitized, secrets, duration = SecretScrubber.scrub(diff, "src/config/aws.ts")
    assert len(secrets) >= 1
    assert "AKIAIOSFODNN7EXAMPL9" not in sanitized
    assert "[SCRUBBED_" in sanitized

def test_secret_scrubber_github_pat():
    diff = """
    + const token = "ghp_112233445566778899aabbccddeeff001122";
    """
    sanitized, secrets, duration = SecretScrubber.scrub(diff, "src/services/github.ts")
    assert len(secrets) >= 1
    assert "ghp_112233445566778899aabbccddeeff001122" not in sanitized

def test_secret_scrubber_entropy_exclusion():
    diff = """
    + const dummyToken = "YOUR_API_KEY_HERE";
    + const testEmail = "developer@example.com";
    + const className = "btn-primary-active-state";
    """
    sanitized, secrets, duration = SecretScrubber.scrub(diff, "src/components/button.tsx")
    assert len(secrets) == 0
    assert "YOUR_API_KEY_HERE" in sanitized

def test_jwt_token_interception():
    jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    diff = f"""
    + const adminToken = "{jwt}";
    """
    sanitized, secrets, duration = SecretScrubber.scrub(diff, "src/auth.ts")
    assert len(secrets) >= 1
    assert jwt not in sanitized

def test_shannon_entropy_calculation():
    # Random cryptographic key vs repeating text
    random_str = "a8f9c1e7d2b40567e91234bcfa09"
    repeating_str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    
    entropy_random = SecretScrubber.calculate_shannon_entropy(random_str)
    entropy_repeating = SecretScrubber.calculate_shannon_entropy(repeating_str)
    
    assert entropy_random > 3.5
    assert entropy_repeating == 0.0
