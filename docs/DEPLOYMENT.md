# Deployment Guide

This guide covers deployment options for **resend-webui**.

---

## 🌐 Deploying to Vercel (Recommended)

Vercel is the fastest way to host your `resend-webui` webmail dashboard.

### Steps:
1. Fork or push `resend-webui` to your GitHub account.
2. Go to [Vercel Dashboard](https://vercel.com/new) and select **Import Project**.
3. In **Environment Variables**, add:
   - `RESEND_API_KEY`: Your primary Resend API key (`re_...`)
   - `FROM_EMAIL`: Your primary sender email (`contact@yourdomain.com`)
   - `FROM_NAME`: Your display name
4. Click **Deploy**.

---

## 🚂 Deploying to Railway / Docker

### Using Docker
Create a container build using Node 20 / Next.js standalone output:

```bash
docker build -t resend-webui .
docker run -p 3000:3000 -e RESEND_API_KEY="re_..." resend-webui
```

---

## ⚙️ Environment Configuration

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `RESEND_API_KEY` | Primary Resend API Key | Yes | `re_123456789` |
| `FROM_EMAIL` | Default Sender Email | Yes | `contact@aasimshah.com` |
| `FROM_NAME` | Default Sender Name | No | `Aasim Shah` |
