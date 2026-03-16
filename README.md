# AccessCheck

Free, instant ADA accessibility audit tool for websites. Enter any URL and get a letter grade (A–F) based on six WCAG accessibility checks — in about 30 seconds.

Built by [Open Waves Design](https://openwave.design) to help small business owners understand their accessibility risk before it becomes a legal problem.

---

## What It Does

1. You enter a website URL on the home page.
2. AccessCheck fetches the page and runs six accessibility checks using [Cheerio](https://cheerio.js.org/).
3. You see a letter grade and the first three check results immediately.
4. To unlock the remaining three results, you enter your email address.
5. A 6-digit one-time code is sent to your inbox via **Resend**.
6. Once you verify the code, your email is added to your **Kit** subscriber list and the full report unlocks.

### Accessibility Checks

| Check | What It Tests |
|---|---|
| Alt Text | Images have `alt` attributes |
| Color Contrast | Text meets the 4.5:1 WCAG AA contrast ratio |
| Form Labels | Inputs are associated with `<label>` elements or ARIA labels |
| Heading Hierarchy | Single `<h1>`, no skipped heading levels |
| Language Attribute | `<html lang="...">` is present |
| Link Text Quality | Links don't use vague text like "click here" or "read more" |

---

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cheerio](https://cheerio.js.org/) — server-side HTML parsing
- [Resend](https://resend.com/) — transactional email (OTP codes)
- [Kit](https://kit.com/) — email list / marketing automation

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/openwavesdesign/accesscheck.git
cd accesscheck
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example below into a new `.env.local` file at the project root:

```bash
# Required — generate with: openssl rand -hex 32
OTP_SECRET=your_secret_here

# Required — from https://resend.com
RESEND_API_KEY=re_...
RESEND_FROM=AccessCheck <noreply@yourdomain.com>

# Optional — from https://kit.com
KIT_API_KEY=
KIT_FORM_ID=
KIT_TAG_ID=
```

See the [Environment Variables](#environment-variables) section below for full details.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OTP_SECRET` | **Yes** | Secret used to sign and verify OTP tokens. Generate with `openssl rand -hex 32`. |
| `RESEND_API_KEY` | **Yes** | API key from [resend.com](https://resend.com). Used to send verification code emails. |
| `RESEND_FROM` | **Yes** | The sender shown in OTP emails. Format: `Name <email@yourdomain.com>`. Must be a verified domain in Resend (or use `onboarding@resend.dev` for local testing). |
| `KIT_API_KEY` | Optional | API key from [kit.com](https://kit.com). When set, verified emails are added to your Kit subscriber list. |
| `KIT_FORM_ID` | Optional | Kit form or sequence ID. When set, subscribers are enrolled in that specific form or automation. |
| `KIT_TAG_ID` | Optional | Kit tag ID. When set, the tag is applied to each new subscriber (e.g. an "AccessCheck" tag). |

If `KIT_API_KEY` is not set, email verification still works — subscribers just won't be added to Kit.

---

## Resend Integration

[Resend](https://resend.com) is used to send the 6-digit one-time password (OTP) email when a user enters their email address on the results page.

### How to set it up

1. Create a free account at [resend.com](https://resend.com). The free tier includes 3,000 emails/month.
2. Go to **API Keys** and create a new key.
3. Add it to `.env.local` as `RESEND_API_KEY`.
4. Set `RESEND_FROM` to a sender address on a domain you own. In Resend, go to **Domains** and add your domain to verify it.

> **Local testing tip:** You can use `onboarding@resend.dev` as the `RESEND_FROM` value while developing. This only works when sending to your own Resend account's email address.

### Where it's used

- **`/app/api/subscribe/route.ts`** — generates the OTP and sends the email when a user submits their address.

---

## Kit Integration

[Kit](https://kit.com) (formerly ConvertKit) is used to build and manage the email list. When a user successfully verifies their OTP code, their email is added as an active subscriber.

### How to set it up

1. Create an account at [kit.com](https://kit.com). The free plan supports up to 10,000 subscribers.
2. Go to **Settings → Developer → API** and copy your API key.
3. Add it to `.env.local` as `KIT_API_KEY`.
4. (Optional) To subscribe users to a specific form or sequence, find the form's ID in Kit and set `KIT_FORM_ID`.
5. (Optional) To tag new subscribers (e.g. with "AccessCheck"), find the tag ID under **Subscribers → Tags** and set `KIT_TAG_ID`.

### Where it's used

- **`/app/api/verify/route.ts`** — after OTP verification succeeds, the email is sent to the Kit API (`POST /v4/subscribers`). If `KIT_FORM_ID` is set, the subscriber is also enrolled in that form.

---

## Deploying to Vercel

AccessCheck is a standard Next.js App Router project and deploys to [Vercel](https://vercel.com) with no custom configuration required.

### Steps

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import the repository and leave all build settings at their defaults.
4. Before deploying, add your environment variables under **Project Settings → Environment Variables**:
   - `OTP_SECRET`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `KIT_API_KEY` (if using Kit)
   - `KIT_FORM_ID` (if using Kit)
   - `KIT_TAG_ID` (if using Kit)
5. Click **Deploy**.

### Custom domain

In your Vercel project, go to **Settings → Domains** and add your domain. Make sure the `RESEND_FROM` address matches a domain you've verified in Resend.

---

## Scripts

```bash
npm run dev      # Start local development server
npm run build    # Build for production
npm run start    # Run production build locally
npm run lint     # Run ESLint
```

---

## License

MIT
