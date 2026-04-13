# StickerGen — AI Sticker Creator

A hardcore-themed AI sticker creator built with React, TypeScript, Supabase, and Vercel.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Backend/Auth**: Supabase (Auth, Postgres, Storage)
- **Hosting**: Vercel
- **AI**: Pollinations.ai (free) + Google Gemini API

---

## Setup (5 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase

1. Go to [supabase.com](https://supabase.com) → your project
2. **SQL Editor** → New Query → paste the contents of `supabase/migrations/001_initial.sql` → Run
3. **Storage** → Create two buckets:
   - `avatars` (Public: ✅)
   - `stickers` (Public: ✅)
4. **Authentication** → Providers → enable **Google**:
   - Add your Google OAuth Client ID + Secret
   - Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`
5. **Project Settings** → API → copy `Project URL` and `anon public` key

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).

**Add env vars in Vercel**: Project Settings → Environment Variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

After deploy, update Supabase:
- **Authentication** → URL Configuration → add your Vercel URL to **Redirect URLs**

---

## Features
- 🎨 AI sticker generation (Pollinations free / Gemini API)
- 🔐 Email + Google OAuth auth
- 👤 User profiles with avatar upload
- 🖼️ Persistent gallery saved to Supabase Storage
- 9 sticker styles × 7 color palettes
- Download stickers as PNG

## Project structure
```
src/
├── context/      AuthContext, ToastContext
├── lib/          supabase.ts, types.ts, api/
├── components/   auth/, creator/, ui/
└── pages/        Landing, Creator, Gallery, Profile
```
