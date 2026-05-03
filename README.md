# CRM-CMS — Pure HTML/CSS/JS E-Commerce Platform

A minimal, high-performance e-commerce CRM/CMS platform built with pure HTML/CSS/JS and deployed on Cloudflare Workers & Pages. Zero build tools, minimal dependencies, full functionality.

## Features

### Storefront
- Product grid with responsive design
- Product detail pages
- Shopping cart (localStorage-based)
- Stripe Checkout integration
- Order confirmation pages
- Guest checkout (no login required)

### Admin Panel
- Dashboard with basic analytics
- Product CRUD (create, read, update, delete)
- Order management with status tracking
- Simple, clean interface

### Technical Highlights
- **Pure HTML/CSS/JS** — No frameworks, no build tools
- **Cloudflare KV** — Key-value storage, zero cold start
- **Hono** — Minimal backend framework (~10KB)
- **Stripe Checkout** — Secure payment processing
- **~200KB total dependencies** (gzipped: ~60KB)

## Quick Start

### Prerequisites
- Cloudflare account (free tier)
- Stripe account
- GitHub repository

### 1. Clone & Install
```bash
git clone <your-repo>
cd CRM-CMS
cd worker && npm install
```

### 2. Configure Cloudflare Worker
Edit `worker/wrangler.toml`:
```toml
name = "crm-cms-api"
kv_namespaces = [{ binding = "KV", id = "<your-kv-namespace-id>" }]
```

### 3. Set Secrets
```bash
cd worker
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ADMIN_API_KEY  # optional, default: crm-cms-admin-secret-key-change-me
```

### 4. Configure Stripe
- Get your API keys from https://dashboard.stripe.com
- Add publishable key to `worker/wrangler.toml` as `STRIPE_PUBLISHABLE_KEY`
- Set up webhook endpoint: `https://<your-worker>.workers.dev/api/webhook`
- Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. Deploy
```bash
# Deploy Worker
cd worker && npx wrangler deploy

# Deploy Pages (via GitHub Actions)
# Push to main branch after setting up secrets in GitHub repo:
# - CLOUDFLARE_API_TOKEN
# - CLOUDFLARE_ACCOUNT_ID
# - CLOUDFLARE_PAGES_PROJECT
```

## Project Structure
```
CRM-CMS/
├── public/              # Cloudflare Pages (Frontend)
│   ├── index.html      # Homepage - product grid
│   ├── product.html    # Product detail
│   ├── cart.html       # Shopping cart
│   ├── checkout.html   # Checkout + Stripe
│   ├── order.html      # Order confirmation
│   ├── admin/          # Admin panel
│   ├── css/styles.css  # Minimal CSS (~300 lines)
│   └── js/             # Vanilla JS modules
├── worker/             # Cloudflare Worker (Backend)
│   ├── index.js        # Entry point
│   ├── routes/         # API routes
│   └── wrangler.toml   # Worker config
└── .github/workflows/  # CI/CD
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | public | List products |
| GET | `/api/products/:id` | public | Get product |
| POST | `/api/products` | admin | Create product |
| PATCH | `/api/products/:id` | admin | Update product |
| DELETE | `/api/products/:id` | admin | Delete product |
| POST | `/api/checkout` | public | Create Stripe session |
| POST | `/api/webhook` | stripe | Stripe webhook |
| GET | `/api/orders` | admin | List orders |
| PATCH | `/api/orders/:id` | admin | Update status |
| GET | `/api/analytics` | admin | Basic stats |

## Cloudflare Pages Settings

In Cloudflare Dashboard:
- **Build command:** `exit 0`
- **Build output directory:** `public`
- **No framework preset** needed

## Environment Variables

### Worker (wrangler.toml)
- `STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `ADMIN_API_KEY` — Admin API key (default provided)

### Worker Secrets (wrangler secret put)
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook secret

## License

MIT
