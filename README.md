# 🛡️ CodeSentinel

> **Enterprise-Grade Automated AI DevSecOps Platform & GitHub PR Reviewer**  
> Dual-runtime microservices architecture powered by Node.js, Python FastAPI, and Google Gemini API.

---

## 🌟 The 7 Core Architectural Innovations

CodeSentinel is designed from the ground up to solve critical enterprise DevSecOps challenges in automated pull request review pipelines:

1. **Cross-File Contextual AST Traversal**  
   Parses full PR diffs alongside repository architectural context to catch cross-file schema/state breaking changes (e.g. database schema alterations vs controller signature mismatches and missing caller arguments).

2. **Deterministic RBAC & Logic Verification**  
   Traces execution control flows to detect authorization and middleware bypasses beyond static pattern matching (e.g. missing auth guards on mutating routes, privilege escalation in user payloads, and IDOR vulnerabilities).

3. **Automated, Test-Compliant Remediation**  
   Generates committable GitHub Markdown suggestions (` ```suggestion `) containing copy-pasteable patches and matching unit test verification snippets (Jest, PyTest, Mocha).

4. **Sub-Millisecond In-Flight Secret Interception**  
   High-speed in-memory regex pipeline combined with Shannon entropy token analysis that scrubs raw OAuth secrets, API keys, JWTs, AWS credentials, and DB URIs before persistent indexing or LLM context injection.

5. **High-Signal Noise Suppression**  
   Dynamically filters out stylistic formatting alerts (delegated to ESLint / Prettier) to eliminate PR review fatigue and focus exclusively on critical logic and security flaws.

6. **Sub-Second Event-Driven Webhook Ingestion**  
   Cryptographic HMAC SHA-256 signature verification (`x-hub-signature-256`) with asynchronous background job dispatching, non-blocking 202 Accepted response in <50ms, and live WebSocket telemetry.

7. **Architectural Blast-Radius Scoring**  
   Generates a holistic 0–100 impact metric predicting the failure surface of each pull request based on core dependency depth, touched API surfaces, data mutation risk, RBAC exposure, and cyclomatic complexity deltas.

---

## 🏗️ System Architecture & Tech Stack

```
                          ┌────────────────────────┐
                          │   GitHub Webhook /     │
                          │   PR Event Stream      │
                          └───────────┬────────────┘
                                      │ (HMAC SHA-256)
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       INGESTION GATEWAY (Node.js/Express)        │
             │                                                  │
             │  • HMAC Verification & Fast 202 Ingestion        │
             │  • Octokit GitHub Client & Diff Extractor        │
             │  • Secret Scrubber Pre-Filter                    │
             │  • Circuit Breaker (Opossum/Custom fallback)     │
             │  • In-Memory / Mongo Job Queue Dispatcher        │
             │  • Socket.IO Live Telemetry & Audit Streamer     │
             │  • Mongoose Data Persistence Layer               │
             └──────────┬─────────────────────────────▲─────────┘
                        │ HTTP / JSON Payload         │
                        │ (1.5s timeout + fallback)   │ Scan Results
                        ▼                             │ & Badges
             ┌────────────────────────────────────────┴─────────┐
             │      AI ANALYSIS WORKER (Python / FastAPI)       │
             │                                                  │
             │  • Fast Regex & AST In-Flight Secret Interceptor │
             │  • Cross-File Context & AST Dependency Graph     │
             │  • Deterministic RBAC & Logic Verification       │
             │  • Gemini 1.5 Pro / Flash Prompt Pipeline        │
             │  • High-Signal Noise Suppression (Anti-Linter)   │
             │  • Architectural Blast Radius Metric Engine      │
             │  • Test-Compliant Remediation & Patch Generator  │
             └──────────────────────────────────────────────────┘
                                      ▲
                                      │ Real-Time WS Feed
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │      ENTERPRISE DASHBOARD (React + Vite)         │
             │                                                  │
             │  • Glassmorphism Cyber Theme (#080A10, #22E6B8)  │
             │  • Real-Time PR Triage Feed & WebSocket HUD      │
             │  • Blast-Radius Interactive Topology Graph       │
             │  • Vulnerability & Threat Matrix Explorer        │
             │  • Live Manual Diff Audit & Test Bench           │
             │  • GitHub PR Inline Review Simulator             │
             │  • Committable Markdown Patch One-Click Action   │
             │  • Role-Scoped Access & Security Governance      │
             └──────────────────────────────────────────────────┘
```

---

## 📁 Repository Hierarchy

```
code-sentinel/
├── backend/                       # Node.js Express Gateway (Control Plane)
│   ├── src/
│   │   ├── config/                # Environment & Database with In-Memory fallback
│   │   ├── controllers/           # Webhook, Review, Metrics, Audit Controllers
│   │   ├── middleware/            # HMAC Verification, Auth, Rate Limiter, Error Handler
│   │   ├── models/                # PRReview, AuditLog, RepositoryHealth Mongoose Schemas
│   │   ├── routes/                # Express API Routes
│   │   ├── services/              # Octokit, Circuit Breaker, AI Bridge, Job Queue, Socket.IO
│   │   └── server.js              # Server Entry Point
│   ├── package.json
│   └── Dockerfile
├── ai-engine/                     # Python 3.11 FastAPI Microservice (Worker Plane)
│   ├── app/
│   │   ├── api/                   # FastAPI Endpoints (/analyze-diff, /security-scan, /blast-radius)
│   │   ├── core/                  # Secret Scrubber, AST Traversal, RBAC Verifier, Blast Radius, Gemini
│   │   ├── models/                # Pydantic v2 Schemas
│   │   ├── config.py              # Microservice Settings
│   │   └── main.py                # FastAPI Application Entry
│   ├── tests/                     # Comprehensive Unit Tests (Pytest)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                      # Enterprise React Cyber Dashboard (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/            # Triage Pipeline, Blast Radius Visualizer, Diff Playground, Simulator
│   │   ├── context/               # Socket.IO & Role-Scoped Auth Contexts
│   │   ├── services/              # Axios API Client
│   │   ├── App.jsx                # Multi-Tab Master View
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── .github/
│   └── workflows/
│       ├── ci-cd.yml              # CI/CD Automated Test & Build Pipeline
│       └── pr-review.yml          # GitHub Action Automated PR Reviewer
├── docker-compose.yml             # Full Multi-Container Stack
├── render.yaml                    # Declarative Render Blueprint
└── .env.example                   # Environment Template
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+
- **Python**: 3.10+
- **Docker & Docker Compose** (optional)

### 1. Local Development Setup

#### Step A: Configure Environment
Copy `.env.example` to each service:
```bash
cp .env.example backend/.env
cp ai-engine/.env.example ai-engine/.env
```

#### Step B: Start AI Worker Engine (Python)
```bash
cd ai-engine
pip install -r requirements.txt
python -m pytest tests/              # Verify all 8 core unit tests pass
uvicorn app.main:app --port 8000 --reload
```

#### Step C: Start Ingestion Gateway (Node.js)
```bash
cd backend
npm install
npm run dev
```

#### Step D: Start Cyber Dashboard (React)
```bash
cd frontend
npm install
npm run dev
```

Visit the dashboard in your browser at `http://localhost:5173`.

---

## 🐳 Docker Multi-Container Deployment

Run the entire platform (MongoDB, AI Engine, Backend Gateway, and Frontend Dashboard) with a single command:

```bash
docker-compose up --build
```

---

## 🧪 Testing

Run unit tests on the AI Engine:
```bash
python -m pytest ai-engine/tests -v
```

Test results:
* ✅ `test_secret_scrubber_aws_key`: Sub-millisecond AWS key interception
* ✅ `test_secret_scrubber_github_pat`: GitHub PAT entropy filtration
* ✅ `test_secret_scrubber_entropy_exclusion`: False positive noise suppression
* ✅ `test_cross_file_signature_mutation`: Downstream breaking parameter detection
* ✅ `test_schema_controller_desync`: Model vs controller contract synchronization
* ✅ `test_missing_auth_on_mutating_endpoint`: Deterministic RBAC verification
* ✅ `test_privilege_escalation_detection`: Mass assignment role escalation
* ✅ `test_blast_radius_core_versus_leaf`: Composite failure surface calculation

---

## 🛡️ License
Enterprise Proprietary - CodeSentinel DevSecOps.
