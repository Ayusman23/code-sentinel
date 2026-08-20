import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import FileDiff, RBACIssue, Vulnerability, SeverityEnum

class RBACVerifier:
    """
    Deterministic RBAC & Logic Verification Engine.
    Traces execution control flows, route definitions, and middleware chains to detect:
    - Missing Authentication / Authorization middleware on mutating endpoints.
    - Privilege Escalation (e.g. unbounded role mutation via request body).
    - Insecure Direct Object Reference (IDOR) & missing tenant boundary isolation.
    """

    AUTH_MIDDLEWARES = {
        "auth", "authenticate", "requireAuth", "verifyToken", "isAuthenticated",
        "checkAuth", "authMiddleware", "protect", "authorize", "adminOnly",
        "hasRole", "requireRole", "requirePermission", "jwtRequired",
        "Depends(get_current_user)", "Depends(get_current_active_user)",
        "Security", "SecurityScoped"
    }

    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    @classmethod
    def verify(cls, files: List[FileDiff]) -> Tuple[List[RBACIssue], List[Vulnerability]]:
        """
        Executes deterministic control-flow verification across all diffed files.
        """
        rbac_issues: List[RBACIssue] = []
        vulnerabilities: List[Vulnerability] = []

        for file in files:
            # Check route handlers
            cls._verify_express_routes(file, rbac_issues, vulnerabilities)
            cls._verify_fastapi_routes(file, rbac_issues, vulnerabilities)
            cls._verify_privilege_escalation(file, rbac_issues, vulnerabilities)
            cls._verify_idor_and_tenant_isolation(file, rbac_issues, vulnerabilities)

        return rbac_issues, vulnerabilities

    @classmethod
    def _verify_express_routes(cls, file: FileDiff, issues: List[RBACIssue], vulns: List[Vulnerability]):
        """Inspects Express / Node route registrations."""
        lines = [l.strip() for l in file.patch.split("\n")]
        
        # Matches: router.post('/api/users', handler) or app.delete('/admin/flush', handler)
        # or router.post('/path', authMiddleware, handler)
        route_pattern = re.compile(
            r'^\+\s*(?:router|app)\.(post|put|patch|delete|get)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]\s*,\s*(.*)\)',
            re.IGNORECASE
        )

        for idx, line in enumerate(lines, start=1):
            if not line.startswith("+"):
                continue
            match = route_pattern.search(line)
            if match:
                method = match.group(1).upper()
                route_path = match.group(2)
                handlers_str = match.group(3)

                # Skip read-only public routes unless sensitive
                is_sensitive_path = any(kw in route_path.lower() for kw in ["admin", "user", "payment", "billing", "account", "secret", "config", "manage"])
                
                if method in cls.MUTATING_METHODS or is_sensitive_path:
                    # Check if any auth middleware is in handlers chain
                    has_auth = any(auth_kw.lower() in handlers_str.lower() for auth_kw in cls.AUTH_MIDDLEWARES)
                    
                    if not has_auth:
                        issue = RBACIssue(
                            route=route_path,
                            method=method,
                            file=file.filename,
                            line=idx,
                            issue_type="MISSING_AUTH_MIDDLEWARE",
                            description=(
                                f"Mutating/Sensitive route '{method} {route_path}' registered without authorization middleware. "
                                f"Allows unauthenticated public invocation."
                            ),
                            severity=SeverityEnum.CRITICAL if ("admin" in route_path or method in ["DELETE", "PUT"]) else SeverityEnum.HIGH,
                            remediation_advice=f"Wrap route handler with 'requireAuth' or 'authorizeRoles([\"admin\"])'."
                        )
                        issues.append(issue)

                        vulns.append(Vulnerability(
                            id=f"RBAC-AUTH-BYPASS-{file.filename}-{idx}",
                            rule_id="RBAC_MISSING_AUTH_MIDDLEWARE",
                            title=f"Unauthenticated Endpoint: {method} {route_path}",
                            severity=issue.severity,
                            cwe_id="CWE-306",
                            owasp_category="A01:2021-Broken Access Control",
                            file=file.filename,
                            line_start=idx,
                            line_end=idx,
                            description=issue.description,
                            impact="Unauthorized attackers can invoke critical mutating endpoints to alter state or compromise system integrity.",
                            confidence=0.98
                        ))

    @classmethod
    def _verify_fastapi_routes(cls, file: FileDiff, issues: List[RBACIssue], vulns: List[Vulnerability]):
        """Inspects FastAPI / Python route decorators."""
        lines = [l.strip() for l in file.patch.split("\n")]
        
        # Matches: @app.post("/admin/purge") or @router.delete("/users/{id}")
        py_route_pattern = re.compile(r'^\+\s*@(?:router|app)\.(post|put|patch|delete)\s*\(\s*[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
        
        for idx, line in enumerate(lines, start=1):
            if not line.startswith("+"):
                continue
            match = py_route_pattern.search(line)
            if match:
                method = match.group(1).upper()
                route_path = match.group(2)
                
                # Scan subsequent 10 lines for function signature and Depends(auth)
                subsequent_block = "\n".join(lines[idx:idx+15])
                has_auth = any(auth_kw in subsequent_block for auth_kw in ["Depends(", "Security(", "current_user", "get_current_user", "require_role"])
                
                if not has_auth and ("admin" in route_path or "user" in route_path or method in cls.MUTATING_METHODS):
                    issue = RBACIssue(
                        route=route_path,
                        method=method,
                        file=file.filename,
                        line=idx,
                        issue_type="MISSING_AUTH_DEPENDENCY",
                        description=f"FastAPI endpoint '{method} {route_path}' lacks authentication dependency injection.",
                        severity=SeverityEnum.HIGH,
                        remediation_advice="Inject 'current_user: User = Depends(get_current_user)' into route signature."
                    )
                    issues.append(issue)

    @classmethod
    def _verify_privilege_escalation(cls, file: FileDiff, issues: List[RBACIssue], vulns: List[Vulnerability]):
        """Detects mass-assignment and role tampering in request body handling."""
        lines = [l.strip() for l in file.patch.split("\n")]
        
        for idx, line in enumerate(lines, start=1):
            if not line.startswith("+"):
                continue
            
            # Pattern: user.role = req.body.role OR User.update(req.body)
            if re.search(r'(?:role|isAdmin|isSuperUser|permissions)\s*=\s*(?:req\.body|body|request\.json)\b', line, re.IGNORECASE):
                issue = RBACIssue(
                    route="*internal-mutation*",
                    method="MUTATION",
                    file=file.filename,
                    line=idx,
                    issue_type="PRIVILEGE_ESCALATION",
                    description=(
                        f"Direct assignment of privileged attributes (role/isAdmin) from user-controlled request payload. "
                        f"Enables unauthorized privilege escalation."
                    ),
                    severity=SeverityEnum.CRITICAL,
                    remediation_advice="Explicitly whitelist modifiable fields or enforce strict role verification before updating authorization attributes."
                )
                issues.append(issue)

                vulns.append(Vulnerability(
                    id=f"RBAC-PRIV-ESC-{file.filename}-{idx}",
                    rule_id="RBAC_PRIVILEGE_ESCALATION",
                    title="Direct User Role/Permission Assignment from Request Body",
                    severity=SeverityEnum.CRITICAL,
                    cwe_id="CWE-915",
                    owasp_category="A01:2021-Broken Access Control",
                    file=file.filename,
                    line_start=idx,
                    line_end=idx,
                    description=issue.description,
                    impact="Standard authenticated users can promote their accounts to admin or alter tenant permissions.",
                    confidence=0.96
                ))

    @classmethod
    def _verify_idor_and_tenant_isolation(cls, file: FileDiff, issues: List[RBACIssue], vulns: List[Vulnerability]):
        """Detects IDOR patterns where resource lookup uses param id without user/tenant filter."""
        lines = [l.strip() for l in file.patch.split("\n")]
        
        # Pattern: Model.findById(req.params.id) or Model.findOne({ _id: req.params.id }) without req.user
        for idx, line in enumerate(lines, start=1):
            if not line.startswith("+"):
                continue
            
            if re.search(r'(?:findByIdAndUpdate|findByIdAndDelete|findOneAndDelete|updateOne)\s*\(\s*(?:req\.params\.id|id)\s*,', line):
                # Check surrounding context for tenant or user verification
                surrounding = "\n".join(lines[max(0, idx-5):min(len(lines), idx+5)])
                if "userId" not in surrounding and "req.user" not in surrounding and "tenantId" not in surrounding and "orgId" not in surrounding:
                    issue = RBACIssue(
                        route="*data-access*",
                        method="QUERY",
                        file=file.filename,
                        line=idx,
                        issue_type="IDOR",
                        description=(
                            "Resource mutation query targets ID from request parameters without verifying tenant or owner ownership. "
                            "Exposes application to Insecure Direct Object References (IDOR)."
                        ),
                        severity=SeverityEnum.HIGH,
                        remediation_advice="Scope mutation queries with tenant/owner filter: `Model.findOneAndUpdate({ _id: req.params.id, orgId: req.user.orgId }, ...)`"
                    )
                    issues.append(issue)

                    vulns.append(Vulnerability(
                        id=f"RBAC-IDOR-{file.filename}-{idx}",
                        rule_id="RBAC_IDOR_TENANT_LEAK",
                        title="IDOR: Unscoped Resource Query by Object ID",
                        severity=SeverityEnum.HIGH,
                        cwe_id="CWE-639",
                        owasp_category="A01:2021-Broken Access Control",
                        file=file.filename,
                        line_start=idx,
                        line_end=idx,
                        description=issue.description,
                        impact="Attackers can view, modify, or delete entities belonging to other tenants or users by guessing IDs.",
                        confidence=0.92
                    ))
