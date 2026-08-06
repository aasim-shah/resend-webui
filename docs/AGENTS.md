# 🤖 AI Agent Setup & Execution Guidelines (Cursor AI / VS Code Copilot)

This repository is optimized for autonomous AI Agents (Cursor AI, Antigravity, Windsurf, Copilot Workspace).

---

## ⚡ 1-Line AI Agent Bootstrap Command

When instructed to clone and run `resend-webui`, execute this single command:

```bash
git clone https://github.com/aasim-shah/resend-webui.git && cd resend-webui && npm install && cp .env.example .env && npm run dev
```

---

## 📋 Step-by-Step AI Agent Operational Rules

### 1. Repository Setup & Dependencies
- **Repository URL**: `https://github.com/aasim-shah/resend-webui.git`
- **Node Version**: Requires Node.js >= 18.0.0
- **Package Manager**: Use `npm` (runs Next.js 16 App Router with Turbopack)

### 2. Environment Configuration (`.env`)
- Copy `.env.example` to `.env`:
  ```bash
  cp .env.example .env
  ```
- **Default Test Values**: `.env.example` comes with pre-configured mock credentials.
- **Production API Keys**: Replace `RESEND_API_KEY=re_...` with an actual Resend API key when testing live sending.

### 3. Execution & Verification Commands
- **Development Server**:
  ```bash
  npm run dev
  ```
  - App runs on `http://localhost:3000`
  - Demo Auth Login: `admin@resend-webui.com / password123`
- **Production Build Verification**:
  ```bash
  npm run build
  ```
  - Must compile with **0 TypeScript & 0 bundle errors**.

---

## 🏗️ Codebase Architecture for AI Agents

1. **State Provider (`src/context/AccountContext.tsx`)**:
   - Manages selected account ID (`selectedAccountId`), active folder (`inbox`, `sent`, `spam`, `drafts`, `all`), search query (`searchQuery`), and re-fetch trigger (`refreshTrigger`).
2. **Multi-Account Resend Wrapper (`src/lib/resend/client.ts`)**:
   - Handles multi-profile SDK instances, outbound dispatches, dry-run simulation mode, and domain verifications.
3. **Database Layer (`src/lib/db/store.ts`)**:
   - Reads and writes per-user workspace state in local `data/db.json`.
4. **Auth & Routes (`src/app/login/page.tsx` & `/api/auth/*`)**:
   - Handles user registration, login, logout, and HTTP-only cookie validation.
