# Beauty Pro V1 🎨

All-in-one platform for beauty professionals to manage appointments, clients, and services.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Supabase Auth
- **Backend**: Node.js, Express, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Vercel (Frontend), Railway (Backend)

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your keys
3. Install dependencies: `npm install` in both frontend and backend
4. Run frontend: `cd frontend && npm run dev`
5. Run backend: `cd backend && npm run dev`

## Features

- 🔐 Authentication with role-based access
- 📅 Smart appointment scheduling
- 👥 Client management
- 💅 Service catalog
- 📊 Analytics dashboard
- 💳 Payment processing
- 📱 Mobile responsive

## Deployment

- Frontend auto-deploys to Vercel on push
- Backend deploys to Railway
- Database hosted on Supabase
