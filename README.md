# Nexora

> **"Your intelligent journey to Germany."**  
> *Built for ImpactX'26 — Agentic AI Track (Sponsor: Educaro Deutschland GmbH)*

---

## 🇩🇪 Executive Summary

**Nexora** is an enterprise-grade, agentic AI applicant journey platform engineered for international candidates seeking **Higher Education (Study)**, **Dual Vocational Training (Ausbildung)**, or **Skilled Employment (Fachkraft / EU Blue Card / Chancenkarte)** in Germany.

The product and website name is strictly **Nexora** (never "NexoraAI").

Unlike generic chatbots or disconnected AI demos, Nexora combines:
1. **Deterministic Regulatory Logic:** Evaluates credentials against the German Federal Recognition Act (*Anerkennungsgesetz*), the KMK *Anabin* database equivalence criteria, uni-assist admission regulations, and the Common European Framework of Reference for Languages (CEFR). Zero hallucination in statutory decisions.
2. **Prisma ORM & Neon Cloud PostgreSQL:** All 27 relational entities plus file asset records are persisted in ACID-compliant tables on Neon Cloud PostgreSQL with atomic transactions.
3. **Groq Real-Time Reasoning Engine:** Powered by Groq fast inference (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`) for context-aware journey guidance and Whisper (`whisper-large-v3-turbo`) for real audio transcription.
4. **Cloudinary Asset Storage:** All uploaded Indian degrees, marksheets, certificates, and videos are securely stored in Cloudinary organized into applicant folders with signed delivery and local disk fallback.
5. **Bounded Multi-Agent Orchestration:** A multi-agent loop with a hard bound of 8 iterations operating over PostgreSQL shared state—logging every agent reasoning step, confidence metric, and token footprint.
6. **Official Educaro Routing & Catalog Integration:** Deterministically routes candidates to verified Educaro Deutschland GmbH preparation packages and escalates complex dossiers to licensed human consultants.
7. **DIN 5008 German Document Synthesis:** Generates authentic, downloadable German *Lebenslauf* (CV) and *Anschreiben* (Cover Letter) PDFs adhering to DIN 5008 standards.
8. **Full Provenance & Auditability:** Every credential records its exact provenance (`APPLICANT_PROVIDED`, `DOCUMENT_EXTRACTED`, `VIDEO_EXTRACTED`, `AI_GENERATED`, or `CONSULTANT_VERIFIED`) with confidence scoring.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + Vite + TypeScript)"]
        UI[Nexora 3D Journey Portal]
        Chat[ChatGPT-Style AI Assistant]
        CV[DIN 5008 Lebenslauf & Anschreiben]
        VideoUI[60s Video Intro & STT Approval]
        Guard[Strict RBAC Route Guards]
    end

    subgraph API ["Backend (NestJS 10 + TypeScript)"]
        Auth[JWT & Refresh Cookie + Gmail OTP]
        DocEngine[PDF Extraction & Genuine OCR]
        STT[Whisper STT Transcriber]
        PDFGen[PDFKit DIN 5008 Generator]
        Orchestrator[Master Orchestrator Agent]
        QualEngine[Deterministic Qualification Engine]
        RouteEngine[Deterministic Educaro Routing Engine]
        PrismaService[Global Prisma ORM Service]
        CloudinaryStorage[Cloudinary Secure Cloud Storage]
    end

    subgraph Intelligence ["AI Reasoning & Fast Inference"]
        Groq[Groq API: GPT-OSS 120B / Qwen 27B]
        Whisper[Groq Whisper Large v3 Turbo]
        Prompts[Dossier-Grounded System Prompts]
    end

    subgraph State ["Database (Neon Cloud PostgreSQL)"]
        SharedState[(27 Relational Entities via Prisma)]
        AuditLogs[(Immutable Audit Logs)]
        ExecLogs[(Agent Execution Traces)]
    end

    UI -->|REST + Bearer JWT| Auth
    Chat -->|REST Context Stream| Orchestrator
    Auth --> Orchestrator
    Orchestrator --> QualEngine
    Orchestrator --> RouteEngine
    Orchestrator --> PrismaService
    QualEngine --> Groq
    DocEngine --> CloudinaryStorage
    STT --> Whisper
    PDFGen --> CloudinaryStorage
    Orchestrator --> ExecLogs
    Auth --> AuditLogs
    PrismaService --> SharedState
```

### 1. Multi-Agent Orchestrator Loop
- **Bounded Cycle:** `OBSERVE` → `PLAN` → `ACT` → `VALIDATE` → `UPDATE STATE`.
- **Safety Ceiling:** Hard maximum of **8 iterations** per trigger with concurrency locks to prevent runaway or competing executions.
- **Shared State:** State transitions are committed to PostgreSQL relational tables (`agent_executions`, `applicant_profiles`, `qualification_assessments`, `opportunity_matches`, `next_step_recommendations`), ensuring state is never lost across server restarts.
- **Specialized Child Agents:**
  - `ProfileAgent`: Validates applicant dossier completeness.
  - `DocumentAgent`: Extracts academic credentials, GPA, and graduation dates from transcripts with real OCR.
  - `ConsistencyAgent`: Identifies discrepancies between video transcripts and uploaded diplomas.
  - `QualificationAgent`: Assesses eligibility under German recognition law.
  - `OpportunityAgent`: Computes percentage compatibility against live German programs.
  - `RoutingAgent`: Links gaps to official Educaro services or consultant escalation.

### 2. Deterministic Qualification Engine
- Evaluates 8 core pathway rules with strict deterministic scoring:
  - `ACADEMIC_EQUIVALENCE`: Checks degrees against Anabin H+ university classification.
  - `GERMAN_LANGUAGE_B1_B2`: Required for dual Ausbildung and public universities.
  - `ENGLISH_PROFICIENCY`: Required for English-taught Master's degrees.
  - `APS_CERTIFICATE`: Mandatory requirement for applicants from India, China, and Vietnam.
  - `MINIMUM_GPA_THRESHOLD`: Converts scores to the German 1.0–4.0 scale (*Bayerische Formel*).
  - `FINANCIAL_PROOF`: Verifies German Blocked Account (*Sperrkonto*) readiness (€11,904/year).
  - `CURRICULUM_MATCH`: Assesses credit prerequisites in mathematics and engineering.
  - `CHANCENKARTE_POINTS`: Points-based Opportunity Card calculation for skilled jobseekers.

### 3. Educaro Routing & Human-in-the-Loop Escalation
- Deterministic routing rules evaluate dossier gaps:
  - If German level < B1 → Recommends **Educaro Fast-Track German Language Academy**.
  - If degree requires Anabin evaluation → Recommends **Educaro Academic Credential Recognition Support**.
  - If applicant has Ausbildung target → Recommends **Educaro Dual Ausbildung Placement & Contract Signing**.
  - If dossier completeness exceeds 80% or discrepancies are detected → Escalates to an **Educaro Consultant Review Queue** (`CONSULTANT_REFERRAL`).

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **PostgreSQL:** Neon Cloud PostgreSQL (or local PostgreSQL 14+)

### Default Ports
- **Frontend Application:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:4000`
- **Swagger API Documentation:** `http://localhost:4000/api/docs`

---

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ImpactX26/outforrevenge.git
cd outforrevenge

# Install root dependencies and workspaces
npm install
npm --prefix backend install
npm --prefix frontend install
```

---

### 2. Environment Configuration

#### Backend Configuration (`backend/.env`):
Create `backend/.env` with your credentials:
```env
PORT=4000
NODE_ENV=development

# Neon Cloud PostgreSQL Connection
DATABASE_URL=postgresql://neondb_owner:npg_u3bKq1tjhVcx@ep-aged-grass-a1m76a08-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# JWT & Authentication Secrets
JWT_SECRET=nexora_super_secret_jwt_access_key_2026!
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=nexora_super_secret_jwt_refresh_key_2026!
REFRESH_TOKEN_EXPIRES_IN=7d

# Groq API Fast Inference
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gmail SMTP for OTP Delivery (Login, Register, Forgot Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nexora.hackathon699@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=nexora.hackathon699@gmail.com
```

#### Frontend Configuration (`frontend/.env`):
Create `frontend/.env`:
```env
VITE_API_URL=/api
```

---

### 3. Database Migration & Seeding
Push Prisma schema to Neon PostgreSQL and run the verified database seed:
```bash
# Push schema migrations
cd backend
npx prisma db push

# Run seed script (Creates 13 requirements, 5 services, 4 rules, 7 opportunities, and demo accounts)
npm run seed
```

---

### 4. Running the Full Stack Locally

Run both NestJS backend and Vite frontend concurrently from the root directory:
```bash
npm run dev
```

Or run each service individually:
```bash
# Backend (Port 4000)
cd backend
npm run dev

# Frontend (Port 5173)
cd frontend
npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Applicant** | `applicant@nexora.de` | `DemoPass123!` | Complete applicant journey: Dossier, Documents, Video STT, CV Builder, Next Step, ChatGPT-style AI Advisor |
| **Educaro Consultant** | `consultant@nexora.de` | `DemoPass123!` | Review Queue, Assigned Applicant Dossiers, Clarification Requests, Formal Approvals |
| **System Admin** | `admin@nexora.de` | `DemoPass123!` | System Analytics, Agent Execution Telemetry, Opportunities & Requirements CRUD, Audit Logs |

> **⚠️ DEMO DATA NOTICE:** All initial opportunities, Educaro packages, and sample applicant profiles are seeded with `isDemoData: true` for evaluation and demonstration purposes.

---

## 🧪 Testing & Verification

Run the test suite:
```bash
# Run backend unit tests (Prisma, Qualification Engine, Recommendations, Role Guards)
npm --prefix backend test

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

- **Strict RBAC Route Guards:** Role-Based Access Control enforced at every endpoint (`JwtAuthGuard`, `RolesGuard`, `@Roles(...)`) and on frontend routes (`ProtectedRoute` with `allowedRoles`).
- **Resource Ownership Guards:** Applicants can only query and stream their own documents and PDF exports.
- **Gmail SMTP OTP Delivery:** Real, verified one-time passwords for login, registration, and forgot password.
- **Refresh Token Rotation:** Refresh tokens are hashed and stored in PostgreSQL; revocation occurs instantly upon logout or token refresh.
- **No Secrets in Source:** All credentials and API keys are isolated in environment variables.

---

## 📄 License

Developed for the **ImpactX'26 Agentic AI Hackathon** in collaboration with **Educaro Deutschland GmbH**. All rights reserved.
