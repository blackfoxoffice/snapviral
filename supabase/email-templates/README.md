# Production-grade Supabase email setup

Files in this folder are the branded SnapViral email bodies for every Supabase auth event. Paste them into the Supabase Dashboard once. SMTP setup is the other half — Supabase's default sender (`noreply@mail.supabase.io`, ~30 emails/hr) will get rate-limited the first time a real volume of users signs up.

## 1. Custom SMTP — required for production

Without this, signup / forgot-password emails will silently start failing under load.

Pick a provider (any of these work — we recommend **Resend** for a one-click setup, **Postmark** for transactional reliability, or **AWS SES** if cost matters at scale):

### Option A — Resend (fastest)
1. Create a domain at [resend.com](https://resend.com) — add `snapviral.in`.
2. Add the SPF + DKIM DNS records they show you (TXT + CNAMEs) at your DNS provider (Cloudflare / Vercel domains / etc.).
3. Wait for verification (usually <2 minutes).
4. Create an API key at Resend → API Keys → "SnapViral · Production" with full send permissions.
5. In Supabase Dashboard → Authentication → SMTP Settings → toggle **Enable Custom SMTP** ON. Paste:
   ```
   Host:           smtp.resend.com
   Port:           465
   Username:       resend
   Password:       <the API key from step 4>
   Sender email:   hello@snapviral.in
   Sender name:    SnapViral
   ```
6. Hit **Save**.

### Option B — Postmark
1. Add server in Postmark → Sending domains → verify `snapviral.in`.
2. Use credentials:
   ```
   Host:           smtp.postmarkapp.com
   Port:           587
   Username:       <Server API token>
   Password:       <Server API token>     (same value)
   Sender email:   hello@snapviral.in
   Sender name:    SnapViral
   ```

### Option C — AWS SES
1. Verify domain `snapviral.in` in SES → Move out of sandbox.
2. Create SMTP credentials → IAM user with `AmazonSESFullAccess`.
   ```
   Host:           email-smtp.<region>.amazonaws.com
   Port:           587
   Username:       <SMTP username>
   Password:       <SMTP password>
   Sender email:   hello@snapviral.in
   Sender name:    SnapViral
   ```

## 2. Email templates — paste in Supabase Dashboard

Path: **Supabase Dashboard → Authentication → Email Templates**.

For each row below, click the template, swap the **Subject** and **Body**, then save.

| Supabase template | Subject | Body file |
|---|---|---|
| Confirm signup        | `Confirm your SnapViral account`         | [`confirm-signup.html`](confirm-signup.html) |
| Reset password        | `Reset your SnapViral password`          | [`reset-password.html`](reset-password.html) |
| Change email address  | `Confirm your new email on SnapViral`    | [`change-email.html`](change-email.html) |
| Magic Link            | `Your SnapViral sign-in link`            | [`magic-link.html`](magic-link.html) |
| Invite user           | `You're invited to SnapViral`            | [`invite.html`](invite.html) |

The templates use these Supabase template variables:
- `{{ .ConfirmationURL }}` — signed redirect link (most important)
- `{{ .Email }}` — recipient
- `{{ .NewEmail }}` — only on change-email
- `{{ .SiteURL }}` — site URL configured in Auth settings
- `{{ .Token }}` / `{{ .TokenHash }}` — raw OTP if you want to include it

## 3. Auth URL configuration — required for the redirect chain

Path: **Supabase Dashboard → Authentication → URL Configuration**.

Set:
- **Site URL**: `https://app.snapviral.in`
- **Redirect URLs** (one per line, all must be added or Supabase will reject them):
  ```
  https://app.snapviral.in/auth/confirm
  https://app.snapviral.in/auth/reset-password
  https://app.snapviral.in/dashboard
  http://localhost:3000/auth/confirm
  http://localhost:3000/auth/reset-password
  http://localhost:3000/dashboard
  ```

The web app calls `signUp({ ..., emailRedirectTo: "<origin>/auth/confirm" })` and `resetPasswordForEmail(email, { redirectTo: "<origin>/auth/reset-password" })`. Supabase rejects redirects that aren't in the allowlist above — so add them BEFORE you push the new auth flow live or every signup will fail.

## 4. Email rate limits

Path: **Supabase Dashboard → Authentication → Rate Limits**.

Default limits are conservative. For production, raise:
- **Email send rate** → 60 / hour (after custom SMTP is enabled, you can go higher — most providers handle 1000+/min).
- **Token verification rate** → 30 / hour per IP (default fine).
- **Sign-up rate** → 30 / hour per IP (default fine).

## 5. Test the round-trip

1. Open `https://app.snapviral.in/signup` in an incognito window.
2. Sign up with a real email you control. You should see the "Check your inbox" pane.
3. Email arrives with the new branded template, sender = `hello@snapviral.in`.
4. Click the button → land on `/auth/confirm` → see "You're in" → auto-redirect to `/dashboard`.
5. Sign out. Open `/login` → "Forgot password?" → enter email → check inbox.
6. Click reset link → land on `/auth/reset-password` → set new password → land on `/dashboard`.

If any step fails, tail the logs in Supabase Dashboard → Logs → Auth.
