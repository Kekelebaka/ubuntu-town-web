# Ubuntu Town Web

Frontend application for Ubuntu Town Field OS - A Decentralized Digital Twin Platform for South African Towns.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ubuntu-town-web/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and configurations
│   └── styles/       # CSS and Tailwind styles
├── public/           # Static assets
├── package.json      # Dependencies
├── next.config.ts    # Next.js configuration
├── wrangler.toml     # Cloudflare Pages configuration
└── README.md
```

## 🌐 Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ☁️ Cloudflare Pages Deployment

### Connect to Cloudflare

1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your GitHub/GitLab/Bitbucket repository
4. Set the project name to `ubuntu-town-web`

### Configuration

**Build command:** `pnpm install && pnpm build`
**Build output directory:** `.vercel/output/static`

### Environment Variables

Set the following environment variables in Cloudflare Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://ubuntu-town-web.pages.dev)

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Cloudflare Pages

## 📦 Dependencies

- Next.js 16.2.6
- React 19.2.6
- Supabase JS 2.105.4
- Tailwind CSS 4.3.0
- @cloudflare/next-on-pages 1.13.16

## 🎯 Features

- Town and province browsing
- User authentication with Supabase
- AI-powered CV builder
- Opportunity matching
- Coordinator portal
- Real-time updates
- Responsive design

## 📄 License

Proprietary - Abantu Bo Buntu NPC

## 📞 Contact

- **Website:** https://www.ubuntutown.co.za
- **Founder:** Keke Lebaka - https://kekelebaka.com
