# n8n for EduMind AI

The Compose stack runs n8n at [http://localhost:5678](http://localhost:5678) and keeps its workflows and credentials in the `edumind-n8n` volume.

## One-time setup

1. Start the project with `docker compose up --build` from the repository root.
2. Open n8n and create its owner account on first launch.
3. The current project instance already contains the workflow **EduMind - Send password reset email**. On a fresh n8n data volume, import `n8n/workflows/password-reset-email.json` from the Workflows screen.
4. Create an **SMTP** credential in n8n and attach it to **Send recovery email**. For the project's Gmail sender, use `smtp.gmail.com`, port `465`, SSL, and `edumind1905@gmail.com` as the username. Enter a Google App Password directly in n8n; never put it in source files or chat. Google requires 2-Step Verification for App Passwords and recommends revoking any App Password that has been shared. See [Google's App Password help](https://support.google.com/accounts/answer/185833) and [Gmail SMTP settings](https://support.google.com/mail/answer/7104828).
5. Create a **Header Auth** credential with header name `X-EduMind-Webhook-Secret` and the value stored in the root `.env` as `N8N_WEBHOOK_SECRET`. Attach it to **Password reset webhook**.
6. Save and activate the workflow. Its production webhook path is `edumind-password-reset`.

After setup, a student submits a request from the login form. The active Admin accounts receive an in-app notification and can review the request in **Quản lý tài khoản**. When an Admin selects **Gửi link qua n8n**, EduMind creates a single-use reset link valid for 30 minutes and asks this workflow to email it.

The destination is the active user's registered email supplied by the backend. The workflow does not accept an arbitrary recipient address from the browser. An address must belong to an EduMind account before that account can receive a reset link.

The application does not email or expose a generated password. SMTP credentials remain stored encrypted by n8n. Keep the root `.env` private; it holds the webhook shared secret and n8n encryption key. If you change the webhook secret, update the n8n Header Auth credential to the same value and recreate the backend container.

`N8N_SECURE_COOKIE=false` is set for local HTTP development on `localhost`. Use HTTPS and secure cookies before exposing n8n on a public network.
