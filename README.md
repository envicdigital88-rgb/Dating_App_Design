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

## 📁 Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components (Profile Cards, Badges, Modals)
- `/components/views` - Main screen views (Discover, Likes, Messages, Connections, ProfileDetail)
- `/lib` - Utilities, Contexts, Types, and Seed Data
  - `/lib/utils/matching.ts` - Vibe match algorithm logic
  - `/lib/data/seed.ts` - Mock data for initial testing

## 📝 License

This project is proprietary and confidential.
