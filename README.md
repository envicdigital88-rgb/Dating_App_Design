# ALLYRA 💖

ALLYRA is a modern, premium dating web application specifically designed for meaningful connections in Sri Lanka. It moves beyond superficial swiping by using **Vibe Matching**, personality traits, and curated Daily 5 recommendations to connect compatible people.

## ✨ Features

- **Vibe Match Engine**: An algorithm that calculates compatibility based on intentions, interests, personality traits, and lifestyle.
- **Daily 5 (For You)**: A curated daily feed of 5 highly compatible matches.
- **Discovery**: Browse profiles with rich UI, showcasing "Why you fit" and engaging "Vibe Check" prompts.
- **Connections & Messaging**: Keep track of mutual matches and chat in real-time.
- **Premium Subscription**: Tiered features (Plus, Premium) for enhanced visibility and advanced matching filters.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **State Management**: React Context API (`StoreContext`)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🛠️ Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Dialog Genie payments

Configure server environment variables using `.env.example`. Production requires
`GENIE_ENV=production`, `GENIE_API_URL=https://api.geniebiz.lk`, and the exact live
App Key from the merchant dashboard's Connect section in `GENIE_APP_KEY` (without
`Bearer`). Sandbox uses `GENIE_ENV=sandbox`, `https://api.uat.geniebiz.lk`, and a
sandbox key. `GENIE_APP_ID` is not required by this integration.

Use a plain API URL, not a Markdown link or `dashboard.geniebiz.lk`. Keep the App
Key in an ignored local env file or Vercel's server environment variables. Set
`NEXT_PUBLIC_APP_URL` to the public HTTPS site registered with Dialog. The payment
return and `/api/webhooks/dialog` must reach the same deployment and database as
the checkout. Localhost cannot receive provider callbacks.

After changing Vercel Production environment variables, redeploy for them to
take effect. A 401/403 means the key/environment or merchant access needs checking;
`PP-C-004` alone does not prove the merchant is unactivated. A redirect or HTML
response means the API did not return its transaction JSON; sanitized server logs
record the API endpoint, HTTP status and content type.

### Payment invoice emails

After a verified payment is committed, Wingits purchases and Secret Wingle
payments send an HTML invoice and a plain-text copy to the paying user's saved
account email. The receipt includes the purchase, amount in LKR, receipt number,
gateway transaction reference, and Sri Lanka date/time. Secret recipient details
and message contents are not included.

Set `RESEND_API_KEY` in Vercel's **Production** server environment. The sender
domain must be verified in that Resend account. The default sender is
`Wingle Mingle <no-reply@winglemingle.com>`; optional `RESEND_FROM_EMAIL` overrides
it, and optional `RESEND_REPLY_TO` sets a monitored reply address.

Only the request that newly settles the payment sends an invoice. Transient
provider/network failures retry up to three times with an identical payload and
a stable Resend idempotency key. Email failure never rolls back the payment or
Wingits credit. Permanent failures are logged with safe provider error codes;
delivery is not retried in the background after those attempts are exhausted.
The confirmation page reports a send failure rather than claiming an invoice
was sent. There is no database migration for this change.

Run the isolated checks without contacting payment or email services:

```bash
node --test scripts/payment-gateway.test.cjs scripts/invoice-email.test.cjs
node --experimental-strip-types scripts/payment-verification.test.ts
```

## 📁 Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components (Profile Cards, Badges, Modals)
- `/components/views` - Main screen views (Discover, Likes, Messages, Connections, ProfileDetail)
- `/lib` - Utilities, Contexts, Types, and Seed Data
  - `/lib/utils/matching.ts` - Vibe match algorithm logic
  - `/lib/data/seed.ts` - Mock data for initial testing

## 📝 License

This project is proprietary and confidential.
