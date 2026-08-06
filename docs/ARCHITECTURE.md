# Architecture Overview

`resend-webui` is built with a modern Next.js 16 App Router architecture.

---

## 🏗️ System Components

```
┌────────────────────────────────────────────────────────────────────────┐
│                              resend-webui                              │
├────────────────────────────────────────────────────────────────────────┤
│  Frontend Layer (React 19 / Tailwind CSS v4)                           │
│  - Gmail-inspired Material 3 Inbox Layout                              │
│  - Unboxed HTML Detail Reader View                                      │
│  - Multi-mode Compose Modal (WYSIWYG, Preview, Dry-run)                │
├────────────────────────────────────────────────────────────────────────┤
│  Application Context & State                                           │
│  - AuthContext (User Session & Cookie Management)                      │
│  - AccountContext (Multi-Account Switcher & Search State)              │
├────────────────────────────────────────────────────────────────────────┤
│  API & Database Layer                                                  │
│  - REST API Routes (/api/accounts, /api/emails, /api/auth)             │
│  - Local Store Abstraction (src/lib/db/store.ts)                       │
│  - Multi-Account Resend SDK Wrapper (src/lib/resend/client.ts)         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
resend-webui/
├── docs/                    # Architectural & Deployment Documentation
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
├── data/                    # Local JSON data store (db.json)
├── src/
│   ├── app/
│   │   ├── api/             # Next.js Serverless API routes
│   │   ├── login/           # Authentication page
│   │   ├── settings/        # Account & domain management hub
│   │   └── page.tsx         # Main inbox & email detail reader view
│   ├── components/          # Reusable UI components
│   ├── context/             # Global AuthContext & AccountContext
│   └── lib/                 # Database & Resend client wrappers
├── .env.example
├── LICENSE
└── README.md
```
