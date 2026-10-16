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

## 📁 Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components (Profile Cards, Badges, Modals)
- `/components/views` - Main screen views (Discover, Likes, Messages, Connections, ProfileDetail)
- `/lib` - Utilities, Contexts, Types, and Seed Data
  - `/lib/utils/matching.ts` - Vibe match algorithm logic
  - `/lib/data/seed.ts` - Mock data for initial testing

## 📝 License

This project is proprietary and confidential.
