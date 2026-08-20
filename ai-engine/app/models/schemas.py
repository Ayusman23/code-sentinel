from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class SeverityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class ScanStatusEnum(str, Enum):
    QUEUED = "QUEUED"
    ANALYZING = "ANALYZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class FileDiff(BaseModel):
    filename: str = Field(..., description="Path to modified or added file")
    old_path: Optional[str] = None
    status: str = Field("modified", description="added, modified, deleted, renamed")
    patch: str = Field(..., description="Git unified diff patch content")
    raw_content: Optional[str] = Field(None, description="Full file content if available for contextual AST parsing")
    additions: int = 0
    deletions: int = 0

class RepoContext(BaseModel):
    repo_name: str = Field("unknown/repo", description="Repository slug (owner/repo)")
    branch: str = Field("main", description="Target branch")
    frameworks: List[str] = Field(default_factory=list, description="Detected frameworks: Express, FastAPI, Django, React, etc.")
    test_framework: Optional[str] = Field("jest", description="Detected test framework: jest, pytest, mocha, vitest")
    existing_models: List[str] = Field(default_factory=list, description="Known database models in the codebase")
    protected_routes: List[str] = Field(default_factory=list, description="Known RBAC/admin protected routes")

class DiffAnalysisRequest(BaseModel):
    pr_id: Optional[str] = Field(None, description="PR identifier or review ID")
    title: str = Field("Pull Request Changes", description="PR Title")
    author: str = Field("developer", description="PR Author")
    files: List[FileDiff] = Field(..., description="List of file diffs in the PR")
    context: Optional[RepoContext] = Field(default_factory=RepoContext, description="Repository architectural context")
    raw_diff: Optional[str] = Field(None, description="Raw combined git diff string")

class SecretInterceptionResult(BaseModel):
    rule_id: str
    secret_type: str
    file: str
    line: int
    raw_matched_hash: str
    entropy_score: float
    is_live_risk: bool = True
    redacted_preview: str

class Vulnerability(BaseModel):
    id: str
    rule_id: str
    title: str
    severity: SeverityEnum
    cwe_id: Optional[str] = "CWE-693"
    owasp_category: Optional[str] = "A01:2021-Broken Access Control"
    file: str
    line_start: int
    line_end: int
    description: str
    impact: str
    confidence: float = 0.95

class RBACIssue(BaseModel):
    route: str
    method: str
    file: str
    line: int
    issue_type: str  # "MISSING_AUTH_MIDDLEWARE", "PRIVILEGE_ESCALATION", "IDOR", "UNCHECKED_ROLE_MUTATION"
    description: str
    severity: SeverityEnum = SeverityEnum.HIGH
    remediation_advice: str

class CrossFileImpact(BaseModel):
    source_file: str
    target_file: str
    impact_type: str  # "SCHEMA_BREAK", "INTERFACE_CONTRACT_MUTATION", "MISSING_CONTROLLER_UPDATE", "UNHANDLED_EXCEPTION_FLOW"
    symbol: str
    description: str
    severity: SeverityEnum = SeverityEnum.HIGH

class BlastRadiusBreakdown(BaseModel):
    dependency_depth_score: float = Field(..., description="Score 0-100 based on core vs leaf node")
    api_surface_score: float = Field(..., description="Score 0-100 based on public endpoint mutation")
    data_mutation_score: float = Field(..., description="Score 0-100 based on DB models/schemas touched")
    rbac_exposure_score: float = Field(..., description="Score 0-100 based on security-critical paths")
    cyclomatic_delta: float = Field(..., description="Calculated code complexity delta")

class BlastRadiusScore(BaseModel):
    overall_score: int = Field(..., description="Holistic failure surface score from 0 to 100")
    risk_level: SeverityEnum
    affected_components: List[str]
    breakdown: BlastRadiusBreakdown
    summary: str

class RemediationSuggestion(BaseModel):
    id: str
    vulnerability_id: Optional[str] = None
    file: str
    line_start: int
    line_end: int
    original_code: str
    suggested_code: str
    github_markdown_suggestion: str
    explanation: str
    test_verification_snippet: str

class DiffAnalysisResponse(BaseModel):
    status: ScanStatusEnum = ScanStatusEnum.COMPLETED
    overall_risk: SeverityEnum
    blast_radius: BlastRadiusScore
    secrets_intercepted: List[SecretInterceptionResult] = Field(default_factory=list)
    vulnerabilities: List[Vulnerability] = Field(default_factory=list)
    rbac_issues: List[RBACIssue] = Field(default_factory=list)
    cross_file_impacts: List[CrossFileImpact] = Field(default_factory=list)
    remediations: List[RemediationSuggestion] = Field(default_factory=list)
    noise_suppression_stats: Dict[str, Any] = Field(default_factory=dict)
    executive_summary: str
    execution_time_ms: float
    ai_engine_used: str

class SecurityScanRequest(BaseModel):
    code_or_diff: str
    filename: Optional[str] = "sample.ts"
    context: Optional[RepoContext] = Field(default_factory=RepoContext)
