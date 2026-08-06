# ✉️ resend-webui

> **Sleek, self-hostable Gmail-style Webmail client for managing multiple Resend API accounts.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Resend SDK](https://img.shields.io/badge/Resend-API-black?style=flat-square&logo=resend)](https://resend.com)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**resend-webui** provides a modern, fast, and familiar Webmail interface (inspired by Gmail Material Design 3) to view, send, test, and manage email dispatches across multiple Resend profiles from a single unified workspace.

---

## ✨ Features

- **🌐 Multi-Account Profile Hub**: Seamlessly switch between multiple Resend accounts (e.g., Personal, Studio, SaaS) or view an aggregated feed across all profiles.
- **📥 Inbox & Sent Separation**: Smart folder categorization separating inbound customer inquiries (`Inbox`) from outbound dispatches (`Sent`).
- **✍️ Advanced Compose Drawer**: Multi-format composer supporting **WYSIWYG Writing**, **Live Visual HTML Preview**, and **Raw HTML Code Inspection**.
- **🛡️ Dry-Run Simulation Mode**: Test outbound emails with zero risk of sending actual network requests to real email inboxes.
- **📄 Unboxed HTML Reader View**: Clean, unboxed detail view with sender metadata banner, subject headers, raw JSON payload inspection, and 1-click Resend Message ID copying.
- **⚡ Status Filter Chips**: Filter emails instantly by status (`DELIVERED`, `OPENED`, `CLICKED`, `BOUNCED`, `FAILED`).
- **🔒 Privacy & Local Storage**: API keys are securely resolved from local `.env` configuration or client-side storage with zero external database dependencies.

---

## 📚 Documentation

Detailed documentation for `resend-webui` is available in the [`docs/`](./docs) directory:

- 🏗️ [**Architecture Overview**](./docs/ARCHITECTURE.md): System components, data flow, and state management.
- 🌐 [**Deployment Guide**](./docs/DEPLOYMENT.md): 1-Click Vercel, Docker, and Railway hosting guides.
- 🔒 [**Security & Privacy Policy**](./docs/SECURITY.md): Key isolation, cookie sessions, and zero-telemetry policy.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository
```bash
git clone https://github.com/aasim-shah/resend-webui.git
cd resend-webui
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Open `.env` and add your Resend API key and sender details:
```env
RESEND_API_KEY=re_123456789_your_primary_api_key
FROM_EMAIL=contact@yourdomain.com
FROM_NAME="Primary Account"
```

To configure multiple Resend accounts, simply create additional `.env.*` files (e.g., `.env.secondary`, `.env.feedwink`):
```env
RESEND_API_KEY=re_987654321_your_secondary_api_key
FROM_EMAIL=sales@secondarydomain.com
FROM_NAME="Secondary Account"
```

### 4. Start the Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## ☁️ 1-Click Deployment

### Deploying to Vercel
Deploy your own instance of `resend-webui` to Vercel in 1 click:

1. Push your cloned repo to GitHub.
2. Click **New Project** in Vercel.
3. Add your `RESEND_API_KEY` under **Environment Variables**.
4. Click **Deploy**!

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
- **Email Delivery**: [Resend Node.js SDK](https://resend.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Vanilla CSS Utility Tokens]
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API (`AccountContext`)

---

## 📂 Project Structure

```
resend-webui/
├── docs/                    # Architectural, Security & Deployment Guides
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
├── data/                    # Local JSON store (db.json)
├── src/
│   ├── app/
│   │   ├── api/             # Resend API Routes (emails, accounts, domains, webhooks)
│   │   ├── globals.css      # Custom design tokens & scrollbar utilities
│   │   ├── layout.tsx       # Root layout shell with Header & Sidebar
│   │   └── page.tsx         # Main Webmail inbox & unboxed detail reading view
│   ├── components/
│   │   ├── Header.tsx       # 80px Top bar with search & profile switcher
│   │   ├── Sidebar.tsx      # Collapsible drawer navigation
│   │   └── ComposeModal.tsx # Multi-mode compose modal
│   ├── context/
│   │   └── AccountContext.tsx # Global multi-account context provider
│   └── lib/
│       ├── db/              # Persistent store helpers
│       ├── resend/          # Multi-account Resend client wrappers
│       └── types.ts         # TypeScript interfaces
├── .env.example             # Environment template
├── LICENSE                  # MIT License
└── README.md                # Documentation
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/aasim-shah/resend-webui/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. Created by [Syed Aasim Shah](https://github.com/aasim-shah). See `LICENSE` for more information.

---

<p center>Crafted for the modern web developer community using <b>Resend</b> & <b>Next.js</b>.</p>
