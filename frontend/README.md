# EduMind AI Desktop Frontend

Desktop frontend for EduMind AI, built with Next.js App Router, TypeScript, and Tailwind CSS. The dedicated phone UI is in `../frontend-mobile`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend connection

The frontend sends `/api/*` through the Next.js rewrite to the existing NestJS backend. It shares the same API and PostgreSQL database as the mobile frontend.
