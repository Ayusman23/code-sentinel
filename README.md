# CodeSentinel

> **Automated AI DevSecOps Platform & GitHub Pull Request Reviewer**  
> A dual-runtime microservice system combining deterministic AST analysis, RBAC control-flow verification, and Google Gemini LLM orchestration to triage PRs and generate test-compliant code patches.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![CI/CD Pipeline](https://github.com/Ayusman23/code-sentinel/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Ayusman23/code-sentinel/actions)
[![Live Dashboard](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://code-sentinel-ten.vercel.app)
[![Render Backend](https://img.shields.io/badge/Backend_Gateway-Render-46E3B7?style=flat&logo=render)](https://codesentinel-backend-uc5g.onrender.com/health)
[![Render AI Engine](https://img.shields.io/badge/AI_Worker_Plane-Render-00C7B7?style=flat&logo=fastapi)](https://codesentinel-ai-engine.onrender.com/health)

---

## 👨‍💻 Author & Contact

**Ayusman Samantaray**  
* **GitHub**: [@Ayusman23](https://github.com/Ayusman23)  
* **LinkedIn**: [Ayusman Samantaray](https://www.linkedin.com/in/ayusman-samantaray-438902263/)  
* **Email**: [adixx2384@gmail.com](mailto:adixx2384@gmail.com)  

---

## 💡 Why I Built This

Standard CI linters (like ESLint and Flake8) are effective at formatting and syntax checks, but they cannot detect semantic authorization bypasses (such as an unauthenticated mutating route or mass assignment privilege escalation) or cross-file interface breaking changes. On the other hand, sending entire repositories to large language models on every commit is slow, costly, and risks leaking API secrets in prompt context.

I built **CodeSentinel** to solve this tradeoff:
1. An **in-flight secret scrubber** and **deterministic AST/RBAC engine** pre-filter and scrub diffs before any external API calls.
2. An **orchestration worker** sends only sanitized, structured diff context to Google Gemini to produce copy-pasteable, test-backed GitHub suggestions.
3. An **asynchronous gateway** acknowledges webhooks immediately with HTTP 202 Accepted, preventing GitHub timeout errors during deep analysis.

---

## 🌐 Live Production Deployments

| Component | Stack | Cloud Host | Live Link | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Dashboard** | React (Vite), Tailwind CSS, Socket.IO | Vercel | [code-sentinel-ten.vercel.app](https://code-sentinel-ten.vercel.app) | Live SPA |
| **Ingestion Gateway** | Node.js, Express, Mongoose, Octokit | Render | [codesentinel-backend-uc5g.onrender.com](https://codesentinel-backend-uc5g.onrender.com/health) | 200 OK |
| **AI Worker Engine** | Python 3.11, FastAPI, Pydantic v2 | Render | [codesentinel-ai-engine.onrender.com](https://codesentinel-ai-engine.onrender.com/health) | 200 OK |
| **Persistence** | MongoDB Atlas Cloud Cluster | Atlas | *Hosted MongoDB Cluster* | Connected |

---

## 🛠️ Architecture & Core Components

```
                     ┌────────────────────────┐
                     │   GitHub Webhook POST  │
                     └───────────┬────────────┘
                                 │ (HMAC SHA-256)
                                 ▼
        ┌──────────────────────────────────────────────────┐
        │       INGESTION GATEWAY (Node.js / Express)      │
        │                                                  │
        │  • HMAC SHA-256 signature verification           │
        │  • Instant HTTP 202 response to avoid timeouts   │
        │  • Asynchronous Background Job Queue             │
        │  • Circuit Breaker with local fallback heuristic │
        │  • Socket.IO Live Telemetry Feed                 │
        │  • Octokit GitHub Comment / Review Dispatcher    │
        └──────────┬─────────────────────────────▲─────────┘
                   │ Forward Diff Payload        │
                   │ (Circuit-breaker guarded)   │ Scan Results & Patches
                   ▼                             │
        ┌────────────────────────────────────────┴─────────┐
        │        AI WORKER ENGINE (Python / FastAPI)       │
        │                                                  │
        │  • In-Flight Secret Scrubber (Shannon Entropy)   │
        │  • Cross-File AST Traversal & Contract Desync    │
        │  • Deterministic RBAC & Logic Verification       │
        │  • Gemini API Prompt Orchestrator & Key Pool     │
        │  • Anti-Linter Noise Filter                      │
        │  • 5-Axis Blast Radius Calculation Engine        │
        └──────────────────────────────────────────────────┘
```

### 1. In-Flight Secret Interception
Evaluates raw diffs against compiled regex signatures (AWS keys, GitHub PATs, JWTs, Stripe keys, DB URIs) and validates token randomness using **Shannon Entropy calculation** ($H(X) = -\sum P(x)\log_2 P(x)$). High-entropy secrets are masked with deterministic hashes (`[SCRUBBED_AWS_KEY_...]`) before database storage or LLM context injection.

### 2. Deterministic RBAC & Logic Verification
Traces execution control flows across Express and FastAPI route registrations to detect:
* Mutating HTTP routes (`POST`, `PUT`, `DELETE`) declared without authentication middleware (CWE-306).
* Privilege escalation via unvalidated body role assignments (`user.role = req.body.role`) (CWE-915).
* Missing tenant boundary filters in database queries (IDOR / CWE-639).

### 3. Cross-File AST Dependency Traversal
Parses modified function signatures and compares them across all caller files in the PR to identify breaking parameter contracts (e.g. required arguments added to a service function without updating caller modules).

### 4. 5-Axis Blast Radius Calculation (0–100)
Computes a composite risk score based on:
* **Dependency Depth**: Modifying core kernel/auth modules vs leaf UI components.
* **API Surface**: Number of public routes altered.
* **Data Mutation**: Database schemas or persistence models touched.
* **RBAC Exposure**: Auth middleware and authorization paths altered.
* **Cyclomatic Delta**: Increase in branching logic (`if`, `for`, `while`, `catch`).

### 5. Automated, Test-Compliant Remediation
Produces structured GitHub Markdown suggestions (` ```suggestion `) alongside automated unit test verification snippets (Jest / PyTest) to validate the fix.

---

## 👥 User Roles & Dashboard Features

The dashboard provides role-scoped views accessible via the top-right role selector:

* **Admin (DevSecOps Lead)**: Full visibility into all PR scans, access to the Webhook Simulator for testing synthetic PR events, manual diff sandbox, and audit log exports.
* **Developer (Software Engineer)**: Focused view of PR risk breakdowns, line-by-line code suggestions, and unit test verification snippets.
* **Auditor (Security Reviewer)**: Read-only access to chronological audit logs with timestamped event histories, actor metadata, and severity tags.

### Dashboard Modules
1. **PR Triage Pipeline**: Visualizes real-time progress through analysis stages (`Ingested` ➔ `Scrubbing` ➔ `AST Analysis` ➔ `RBAC Verification` ➔ `Blast Radius` ➔ `Completed`).
2. **Blast Radius Visualizer**: 5-axis failure surface breakdown for inspected pull requests.
3. **Manual Diff Sandbox**: Live test bench with 4 vulnerability presets (Auth bypass, IDOR, AST desync, and clean refactor).
4. **GitHub PR Webhook Simulator**: Dispatches synthetic PR payloads to preview end-to-end webhook processing.
5. **Audit Log Explorer**: Searchable and filterable table of system security events with JSON export.

---

## 🧪 Test Suite

The project includes **19 automated unit tests** covering both Python and Node.js runtimes:

### Python AI Worker Tests (`ai-engine/tests`)
Run with:
```bash
python -m pytest ai-engine/tests -v
```
```
ai-engine/tests/test_ast_engine.py::test_cross_file_signature_mutation PASSED
ai-engine/tests/test_ast_engine.py::test_schema_controller_desync PASSED
ai-engine/tests/test_ast_engine.py::test_unchanged_signatures_produce_no_impacts PASSED
ai-engine/tests/test_blast_radius.py::test_blast_radius_core_versus_leaf PASSED
ai-engine/tests/test_blast_radius.py::test_blast_radius_zero_diff_returns_clean PASSED
ai-engine/tests/test_blast_radius.py::test_blast_radius_multi_axis_factors PASSED
ai-engine/tests/test_gemini_orchestrator.py::test_fallback_heuristic_generator_with_secret PASSED
ai-engine/tests/test_noise_filter.py::test_filters_whitespace_and_formatting_noise PASSED
ai-engine/tests/test_rbac_verifier.py::test_missing_auth_on_mutating_endpoint PASSED
ai-engine/tests/test_rbac_verifier.py::test_privilege_escalation_detection PASSED
ai-engine/tests/test_rbac_verifier.py::test_protected_route_with_proper_guards_passes PASSED
ai-engine/tests/test_secret_scrubber.py::test_secret_scrubber_aws_key PASSED
ai-engine/tests/test_secret_scrubber.py::test_secret_scrubber_github_pat PASSED
ai-engine/tests/test_secret_scrubber.py::test_secret_scrubber_entropy_exclusion PASSED
ai-engine/tests/test_secret_scrubber.py::test_jwt_token_interception PASSED
ai-engine/tests/test_secret_scrubber.py::test_shannon_entropy_calculation PASSED
```

### Node.js Gateway Tests (`backend/tests`)
Run with:
```bash
npm test --prefix backend
```
```
# Subtest: Webhook Ingestion & HMAC Verification
  # Subtest: allows simulation requests through with simulation flag (PASSED)
  # Subtest: rejects requests with missing signature headers (PASSED)
  # Subtest: validates authentic HMAC SHA-256 signatures with constant-time equality (PASSED)
```

---

## ⚙️ Environment Variables Reference

| Variable | Service | Purpose | Example / Note |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend / AI Engine | Server port binding | `5000` (Node) / `8000` (Python) |
| `NODE_ENV` | Backend | Runtime mode | `production` or `development` |
| `CLIENT_URL` | Backend | Allowed CORS origin for frontend | `https://code-sentinel-ten.vercel.app` |
| `MONGODB_URI` | Backend | Database connection string | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/codesentinel` |
| `AI_ENGINE_URL` | Backend | AI Worker microservice endpoint | `https://codesentinel-ai-engine.onrender.com` |
| `AI_ENGINE_TIMEOUT_MS`| Backend | Circuit breaker timeout before fallback | `4000` |
| `GITHUB_WEBHOOK_SECRET`| Backend | HMAC verification secret for webhooks | Configured in GitHub repo webhook settings |
| `GITHUB_TOKEN` | Backend | GitHub Personal Access Token (`repo` scope)| For posting inline comments & review checks |
| `JWT_SECRET` | Backend | Secret key for signing session tokens | 32+ character random string |
| `GEMINI_API_KEY` | AI Engine | Google AI Studio key (supports key pools) | `key1,key2` for automatic rate-limit failover |
| `GEMINI_MODEL` | AI Engine | Target Gemini model | `gemini-1.5-pro` or `gemini-1.5-flash` |
| `VITE_BACKEND_URL` | Frontend | Backend API base URL | `https://codesentinel-backend-uc5g.onrender.com` |

---

## 🚀 Local Setup & Installation

### Prerequisites
* Node.js v18+
* Python 3.10+
* MongoDB (local or Atlas cluster)

### Step 1: Clone Repository
```bash
git clone https://github.com/Ayusman23/code-sentinel.git
cd code-sentinel
```

### Step 2: Configure Environment Files
```bash
cp backend/.env.example backend/.env
cp ai-engine/.env.example ai-engine/.env
cp frontend/.env.example frontend/.env
```

### Step 3: Start Services
```bash
# Terminal 1 - AI Worker Engine
cd ai-engine
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload

# Terminal 2 - Ingestion Gateway
cd backend
npm install
npm run dev

# Terminal 3 - Frontend Dashboard
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).  
Copyright (c) 2026 Ayusman Samantaray.
