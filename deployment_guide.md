# Deployment Configuration Guide

This guide details the environment variables required to deploy the Project Management System to production environments like Vercel (Frontend) and Render (Backend).

## Deployment Overview
- **Frontend**: [Vercel](https://vercel.com)
- **Backend/API**: [Render](https://render.com)
- **Database**: [Render PostgreSQL](https://render.com/docs/databases)

---

## Backend Configuration (Render)

Add these variables to your Render Web Service configuration:

| Variable | Description | Example Production Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:password@host:port/dbname` |
| `JWT_SECRET` | Secret key for JWT signing | `your-long-secure-random-secret` |
| `FRONTEND_URL` | The production URL of your Vercel app | `https://your-app.vercel.app` |
| `BACKEND_URL` | The production URL of your Render API | `https://your-api.onrender.com` |
| `PORT` | Port for the backend service | `4000` (Render handles this automatically) |
| `SMTP_SERVER` | SMTP host | `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `your-brevo-user` |
| `SMTP_PASS` | SMTP password/API key | `xsmtpsib-xxxxxxxxxxx` |
| `SENDER_EMAIL` | Email address to send from | `notifications@yourdomain.com` |
| `SENDER_NAME` | Name shown in email "From" | `Project Management System` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID (if enabled) | `xxxxx-xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| OAuth Client Secret | `xxxxxxxxxxxxxx` |

> [!IMPORTANT]
> Ensure `FRONTEND_URL` matches exactly what is deployed on Vercel to avoid CORS issues.

---

## Frontend Configuration (Vercel)

Add this variable to your Vercel Project Settings:

| Variable | Description | Example Production Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | The production URL of your Render API | `https://your-api.onrender.com` |

### Static Configuration
The frontend uses `frontend/app/config/api.config.ts` to read this environment variable.

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
```

---

## Post-Deployment Checklist

1. **CORS Validation**: Test a login request from your production frontend URL. If it fails with a CORS error, verify the `FRONTEND_URL` in your Backend settings.
2. **Google OAuth**: Update the **Authorized redirect URIs** in your Google Cloud Console to include your production backend URL: `${BACKEND_URL}/auth/google/callback`.
3. **Database Migrations**: Ensure you run the Prisma migrations on your production database:
   ```bash
   npx prisma migrate deploy
   ```
