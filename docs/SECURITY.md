# Security & Privacy Policy

> **Security & Privacy Commitment for resend-webui**

`resend-webui` is built with a **Security-First, Privacy-First** architecture designed for developer trust.

---

## 🔒 Key Security Principles

### 1. Zero Third-Party Telemetry
- `resend-webui` does **NOT** collect, transmit, or log your API keys, sender domains, or email contents to any third-party server or analytics tool.
- All requests dispatched from `resend-webui` communicate directly with official Resend API endpoints (`api.resend.com`).

### 2. Environment & Key Isolation
- **Environment Variables**: API keys can be supplied via standard local `.env` files (`RESEND_API_KEY`, `FROM_EMAIL`).
- **HTTP-Only Session Cookies**: User authentication sessions are stored in HTTP-only, SameSite cookies to prevent XSS key extraction.
- **Git Protection**: `.gitignore` strictly excludes `.env*` files, local database files (`data/db.json`), and build artifacts.

### 3. Local Data Persistence
- Runtime state is stored locally on your machine or private server instance (`data/db.json`).
- If deploying to Vercel, environment variables remain encrypted within your own private Vercel account project settings.

---

## 🛡️ Reporting a Vulnerability

If you discover a security vulnerability within `resend-webui`, please report it directly via GitHub Security Advisories or email [contact@aasimshah.com](mailto:contact@aasimshah.com).
