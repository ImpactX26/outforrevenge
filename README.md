# Nexora

> **"Your intelligent journey to Germany"**  
> *Built for ImpactX'26 — Agentic AI Track (Sponsor: Educaro Deutschland GmbH)*

---

## 🇩🇪 Executive Summary

**Nexora** is an enterprise-grade, agentic AI applicant journey platform engineered for international candidates seeking **Higher Education (Study)**, **Dual Vocational Training (Ausbildung)**, or **Skilled Employment (Fachkraft / EU Blue Card / Chancenkarte)** in Germany.

Unlike generic chatbots or disconnected AI demos, Nexora combines:
1. **Deterministic Regulatory Logic:** Evaluates credentials against the German Federal Recognition Act (*Anerkennungsgesetz*), the KMK *Anabin* database equivalence criteria, uni-assist admission regulations, and the Common European Framework of Reference for Languages (CEFR).
2. **Bounded Multi-Agent Orchestration:** A multi-agent loop with a hard bound of 8 iterations that operates over PostgreSQL ACID shared state—preventing runaway loops while logging every agent reasoning step, confidence metric, and token footprint.
3. **Official Educaro Routing & Catalog Integration:** Deterministically routes candidates to verified Educaro Deutschland GmbH preparation packages and escalates complex dossiers to licensed human consultants.
4. **DIN 5008 German Document Synthesis:** Generates authentic, downloadable German *Lebenslauf* (CV) and *Anschreiben* (Cover Letter) PDFs adhering to DIN 5008 standards.
5. **Full Provenance & Auditability:** Every credential records its exact provenance (`APPLICANT_PROVIDED`, `DOCUMENT_EXTRACTED`, `VIDEO_EXTRACTED`, `AI_GENERATED`, or `CONSULTANT_VERIFIED`) with confidence scoring.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + Vite + TypeScript)"]
        UI[Nexora Dark Slate Web Portal]
        CV[DIN 5008 Lebenslauf & Anschreiben]
        VideoUI[60s Video Intro & Approval]
        Advisor[Contextual Journey Advisor]
    end

    subgraph API ["Backend (NestJS 10 + TypeScript)"]
        Auth[JWT & Token Rotation + RBAC]
        DocEngine[PDF Extraction & OCR]
        STT[Speech-to-Text Transcriber]
        PDFGen[PDFKit DIN 5008 Generator]
        Orchestrator[Master Orchestrator Agent]
        QualEngine[Deterministic Qualification Engine]
        RouteEngine[Deterministic Educaro Routing Engine]
        StorageCtrl[Secure Local Storage Controller]
    end

    subgraph Intelligence ["AI Reasoning & Models"]
        Gemini[Google Gemini 2.5 Flash / Rule Fallback]
        Prompts[Path-Specific System Prompts]
    end

    subgraph State ["Database (PostgreSQL 15+)"]
        SharedState[(27 Relational Entities)]
        AuditLogs[(Immutable Audit Logs)]
        ExecLogs[(Agent Execution Traces)]
    end

    UI -->|REST + Bearer JWT| Auth
    Auth --> Orchestrator
    Orchestrator --> QualEngine
    Orchestrator --> RouteEngine
    Orchestrator --> SharedState
    QualEngine --> Gemini
    DocEngine --> StorageCtrl
    STT --> StorageCtrl
    PDFGen --> StorageCtrl
    Orchestrator --> ExecLogs
    Auth --> AuditLogs
```

### 1. Multi-Agent Orchestrator Loop
- **Bounded Cycle:** `OBSERVE` → `PLAN` → `ACT` → `VALIDATE` → `UPDATE STATE`.
- **Safety Ceiling:** Hard maximum of **8 iterations** per trigger with concurrency locks to prevent runaway or competing executions.
- **Shared State:** State transitions are saved in PostgreSQL relational tables (`agent_executions`, `applicant_profiles`, `qualification_assessments`, `opportunity_matches`, `next_step_recommendations`), ensuring state is never lost across server restarts.
- **Specialized Child Agents:**
  - `ProfileAgent`: Validates applicant dossier completeness.
  - `DocumentAgent`: Extracts academic credentials, GPA, and graduation dates from transcripts.
  - `ConsistencyAgent`: Identifies discrepancies between video transcripts and uploaded diplomas.
  - `QualificationAgent`: Assesses eligibility under German recognition law.
  - `OpportunityAgent`: Computes percentage compatibility against live German programs.
  - `RoutingAgent`: Links gaps to official Educaro services or consultant escalation.

### 2. Deterministic Qualification Engine
- Evaluates 8 core pathway rules:
  - `ACADEMIC_EQUIVALENCE`: Checks degrees against Anabin H+ university classification.
  - `GERMAN_LANGUAGE_B1_B2`: Required for dual Ausbildung and public universities.
  - `ENGLISH_PROFICIENCY`: Required for English-taught Master's degrees.
  - `APS_CERTIFICATE`: Mandatory requirement for applicants from India, China, and Vietnam.
  - `MINIMUM_GPA_THRESHOLD`: Converts scores to the German 1.0–4.0 scale (*Bayerische Formel*).
  - `FINANCIAL_PROOF`: Verifies German Blocked Account (*Sperrkonto*) readiness (€11,904/year).
  - `CURRICULUM_MATCH`: Assesses ECTS credit prerequisites in mathematics and engineering.
  - `CHANCENKARTE_POINTS`: Points-based Opportunity Card calculation for skilled jobseekers.

### 3. Educaro Routing & Human-in-the-Loop Escalation
- Deterministic routing rules evaluate dossier gaps:
  - If German level < B1 → Recommends **Educaro Intensive German Language Fast-Track**.
  - If degree requires Anabin evaluation → Recommends **Educaro Academic Credential Recognition Support**.
  - If applicant has Ausbildung target → Recommends **Educaro Dual Ausbildung Placement & Contract Signing**.
  - If dossier completeness exceeds 80% or discrepancies are detected → Escalates to an **Educaro Consultant Review Queue** (`CONSULTANT_REFERRAL`).

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **PostgreSQL:** v14 or higher (or use PostgreSQL Cloud URI / Supabase / Neon)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ImpactX26/outforrevenge.git
cd outforrevenge

# Install root dependencies and workspaces
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Environment Configuration

#### Backend Configuration (`backend/.env`):
Create `backend/.env` with:
```env
PORT=3001
NODE_ENV=development

# PostgreSQL Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nexora_db
# Or specify full connection string:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nexora_db

# Security & JWT Secrets
JWT_SECRET=nexora_super_secret_jwt_access_key_2026!
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=nexora_super_secret_jwt_refresh_key_2026!
REFRESH_TOKEN_EXPIRES_IN=7d

# Google Gemini API Key (optional - falling back to deterministic synthesis if omitted)
GEMINI_API_KEY=your_gemini_api_key_here

# File Upload Storage
STORAGE_LOCAL_DIR=./storage
```

#### Frontend Configuration (`frontend/.env`):
Create `frontend/.env` with:
```env
VITE_API_URL=/api
```

### 3. Database Seeding
Seed verified German opportunities, Educaro services, pathway rules, and demo accounts:
```bash
npm run seed
```

### 4. Running the Full Stack Locally
Run both NestJS backend and Vite frontend concurrently:
```bash
npm run dev
```

- **Frontend Application:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:3001`
- **Swagger API Documentation:** `http://localhost:3001/api/docs`

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Applicant** | `applicant@nexora.de` | `DemoPass123!` | Complete applicant journey: Dossier, Documents, Video STT, CV Builder, Next Step, AI Advisor |
| **Educaro Consultant** | `consultant@nexora.de` | `DemoPass123!` | Review Queue, Assigned Applicant Dossiers, Clarification Requests, Formal Approvals |
| **System Admin** | `admin@nexora.de` | `DemoPass123!` | System Analytics, Agent Execution Telemetry, Opportunities & Requirements CRUD, Audit Logs |

> **⚠️ DEMO DATA NOTICE:** All initial opportunities, Educaro packages, and sample applicant profiles are seeded with `isDemoData: true` for evaluation and demonstration purposes.

---

## 🧪 Testing & Verification

Run the test suite:
```bash
# Run backend unit and integration tests (NestJS + Jest)
npm test

# Run frontend build verification
npm --prefix frontend run build

# Run backend build verification
npm --prefix backend run build
```

---

## ❓ Questions for the Educaro Consultant

As part of deploying Nexora to serve thousands of candidates migrating to Germany, we have compiled the following domain, regulatory, and operational questions for the **Educaro Deutschland GmbH** consulting team:

1. **APS India Certificate Processing Integration:**  
   *What is Educaro's current standard turnaround time for obtaining the Academic Evaluation Centre (APS) certificate from New Delhi? Can Nexora pre-validate Indian university semester marks transcripts against APS guidelines before submission to prevent the 6-to-8 week rejection delay?*

2. **Anabin Institution Status Edge Cases (H+/-):**  
   *When a candidate holds an undergraduate degree from an Indian autonomous college affiliated with an H+ university (where the college itself is listed as H+/- on Anabin), what supplementary documentation does the German ZAB (Zentralstelle für ausländisches Bildungswesen) require from Educaro to guarantee direct recognition?*

3. **Dual Ausbildung Employer Language Thresholds:**  
   *While German immigration law allows vocational visas with B1 German certification, in practice, what percentage of Educaro's partner hospitals (Pflege) and IT companies require B2 before interview scheduling versus permitting B2 acquisition during the initial training semester?*

4. **Sperrkonto & Financial Warranty Workflows:**  
   *Does Educaro partner with specific German blocked account providers (such as Fintiba, Expatrio, or Coracle)? Can Nexora integrate automated proof-of-funds verification to automatically transition the "Financial Proof" milestone in the candidate's journey?*

5. **Chancenkarte (Opportunity Card) Scoring Weighting:**  
   *Under the newly updated skilled immigration regulations (Fachkräfteeinwanderungsgesetz), how does Educaro advise candidates who meet the 6-point requirement but lack an A2 German certificate? Is it advisable to file immediately under English proficiency or delay until German A2 is achieved?*

6. **Human-in-the-Loop Escalation Triggers:**  
   *In Nexora's routing rules, dossiers trigger consultant review at 80% completeness or when document extraction identifies non-standard grading schemes. What additional qualitative markers (e.g. study gaps over 2 years, non-linear career switches) does Educaro consider mandatory triggers for 1-on-1 human consultation?*

---

## 🔒 Security & Privacy Architecture

- **Strict RBAC Guards:** Role-Based Access Control enforced at every endpoint (`JwtAuthGuard`, `RolesGuard`, `@Roles(...)`).
- **Resource Ownership Guards:** Applicants can only query and stream their own documents and PDF exports.
- **Refresh Token Rotation:** Refresh tokens are hashed and stored in PostgreSQL; revocation occurs instantly upon logout or token refresh.
- **No Secrets in Source:** All credentials and API keys are isolated in environment variables.

---

## 📄 License

Developed for the **ImpactX'26 Agentic AI Hackathon** in collaboration with **Educaro Deutschland GmbH**. All rights reserved.
