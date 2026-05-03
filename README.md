# CRM-CMS — Pure HTML/CSS/JS E-Commerce Platform

A minimal, high-performance e-commerce CRM/CMS platform built with **pure HTML/CSS/JS** and deployed on **Cloudflare Workers & Pages**. Zero build tools, minimal dependencies, full functionality.

## Live Demo

| Component | URL |
|-----------|-----|
| **Storefront** | https://crm-cms-store.pages.dev |
| **Admin Panel** | https://crm-cms-store.pages.dev/admin/ |
| **API Health** | https://crm-cms-api.p4d-b2q.workers.dev/api/health |

## Features

### Storefront
- ✓ Product listing with responsive grid layout
- ✓ Product detail pages with images and descriptions
- ✓ Shopping cart (localStorage-based persistence)
- ✓ **Direct checkout** (no payment gateway required)
- ✓ Order confirmation with token-based access
- ✓ Clean, minimal CSS (~300 lines)

### Admin Panel
- ✓ Dashboard with order statistics
- ✓ Product CRUD (create, read, update, delete)
- ✓ Order management with status tracking
- ✓ Real-time product management
- ✓ Secure admin API key authentication

### Technical Highlights
- **Pure HTML/CSS/JS** — No frameworks, no build tools required
- **Cloudflare Workers** — Backend API with Hono framework (~10KB)
- **Cloudflare KV** — Key-value storage, zero cold start
- **Cloudflare Pages** — Static frontend hosting
- **~200KB total dependencies** (gzipped: ~60KB)
- **CORS configured** — Hono cors() middleware for cross-origin requests

## Project Structure

```
CRM-CMS/
├── public/              # → Cloudflare Pages (Frontend)
│   ├── index.html      # Homepage - product grid
│   ├── product.html    # Product detail page
│   ├── cart.html       # Shopping cart
│   ├── checkout.html   # Checkout page
│   ├── order.html      # Order confirmation
│   ├── admin/          # Admin panel
│   │   ├── index.html   # Dashboard
│   │   ├── products.html  # Product management
│   │   └── orders.html   # Order management
│   ├── css/styles.css  # Minimal CSS (~300 lines)
│   └── js/             # Vanilla JS modules
│       ├── api.js           # API client with CORS support
│       ├── cart.js          # Cart management
│       ├── store.js         # Product listing logic
│       └── admin-products.js  # Admin products page logic
├── worker/             # → Cloudflare Worker (Backend)
│   ├── index.js        # Entry point with CORS middleware
│   ├── routes/         # API routes
│   │   ├── products.js   # Product CRUD operations
│   │   ├── orders.js     # Order management
│   │   └── checkout.js   # Checkout & order creation
│   ├── package.json    # Minimal dependencies
│   └── wrangler.toml  # Worker configuration
└── .github/workflows/  # CI/CD
    └── deploy.yml      # Automated deployment
```

## Quick Start

### Prerequisites
- Cloudflare account (free tier works)
- GitHub account
- Basic knowledge of command line

### 1. Clone & Install

```bash
git clone https://github.com/MYMDO/CRM-CMS.git
cd CRM-CMS
cd worker && npm install
```

### 2. Configure Cloudflare Worker

Edit `worker/wrangler.toml`:

```toml
name = "crm-cms-api"
main = "index.js"
compatibility_date = "2026-05-03"

kv_namespaces = [
  { binding = "KV", id = "<your-kv-namespace-id>" }
]

[vars]
STRIPE_PUBLISHABLE_KEY = ""
ADMIN_API_KEY = "crm-cms-admin-secret-key-change-me"  # Change this!

[secrets]
STRIPE_SECRET_KEY = ""
STRIPE_WEBHOOK_SECRET = ""
```

### 3. Set Up Cloudflare Secrets

```bash
cd worker
npx wrangler kv namespace create "crm-cms-kv"
# Copy the ID to wrangler.toml

npx wrangler secret put ADMIN_API_KEY  # Optional: change the admin key
```

### 4. Deploy Worker

```bash
cd worker
npx wrangler deploy
# Note the Worker URL: https://crm-cms-api.<your-subdomain>.workers.dev
```

### 5. Update Frontend API URL

Edit `public/js/api.js` and update:

```javascript
const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1' 
  ? 'http://localhost:8787' 
  : 'https://crm-cms-api.<your-subdomain>.workers.dev'
```

### 6. Deploy to Cloudflare Pages

#### Option A: GitHub Actions (Recommended)

1. Push code to GitHub
2. Set these secrets in your GitHub repo (`Settings → Secrets and variables → Actions`):
   - `CLOUDFLARE_API_TOKEN` — Create at: https://dash.cloudflare.com/profile/api-tokens
   - `CLOUDFLARE_ACCOUNT_ID` — Found in Cloudflare dashboard
   - `CLOUDFLARE_PAGES_PROJECT` — Set to `crm-cms-store`

3. GitHub Actions will automatically deploy to Pages

#### Option B: Manual Deploy

```bash
cd worker
npx wrangler pages deploy public --project-name=crm-cms-store
```

### 7. Configure Cloudflare Pages (Manual Setup)

In Cloudflare Dashboard:
1. Go to **Workers & Pages** → **crm-cms-store**
2. **Settings** → **Build**:
   - Build command: `exit 0`
   - Build output directory: `public`
3. **Settings** → **Environment variables**:
   - Add `API_BASE` if needed

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | public | Health check |
| GET | `/api/config` | public | Get public config |
| GET | `/api/products` | public | List products (with filter) |
| GET | `/api/products/:id` | public | Get single product |
| POST | `/api/products` | admin | Create product |
| PATCH | `/api/products/:id` | admin | Update product |
| DELETE | `/api/products/:id` | admin | Delete product |
| POST | `/api/checkout` | public | Create order (direct) |
| GET | `/api/orders` | admin | List orders |
| GET | `/api/orders/:id` | admin/token | Get order by ID |
| PATCH | `/api/orders/:id` | admin | Update order status |
| GET | `/api/analytics` | admin | Dashboard statistics |

### Query Parameters

**GET /api/products:**
- `?category=Electronics` — Filter by category
- `?status=active` — Filter by status (`active` or `inactive`)

**GET /api/orders:**
- `?status=pending` — Filter by status

## Order Status Flow

Orders follow this lifecycle:

```
pending → processing → shipped → delivered
                ↓
            canceled / refunded
```

### Status Descriptions
- **pending** — Order placed, awaiting processing
- **processing** — Order is being prepared
- **shipped** — Order has been shipped
- **delivered** — Order received by customer
- **canceled** — Order was canceled
- **refunded** — Order was refunded

## Admin API Key

The admin API key is used for all administrative operations. Default: `crm-cms-admin-secret-key-change-me`

### Setting Custom API Key

```bash
cd worker
npx wrangler secret put ADMIN_API_KEY
# Enter your secure key
```

### Using in Frontend

The key is automatically included in `window.ADMIN_KEY` (public/js/api.js).

## CORS Configuration

Cross-Origin Resource Sharing is configured in `worker/index.js` using Hono's built-in `cors()` middleware:

```javascript
app.use('*', cors({
  origin: (origin) => {
    // Allow Pages domain and localhost
    const allowed = [
      'https://crm-cms-store.pages.dev',
      'http://localhost:5173',
      'http://localhost:8787'
    ]
    if (allowed.includes(origin) || origin?.endsWith('.pages.dev')) {
      return origin
    }
    return ''
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
```

## Sample Data

The platform comes with 2 sample products:

1. **Wireless Headphones** (WH-001)
   - Price: $99.99
   - Category: Electronics
   - Stock: 50 units

2. **Laptop Stand** (LS-002)
   - Price: $49.99
   - Category: Accessories
   - Stock: 30 units

## Development

### Local Development

```bash
# Terminal 1: Start Worker
cd worker
npx wrangler dev  # Worker runs at http://localhost:8787

# Terminal 2: Open frontend
cd public
python3 -m http.server 8080
# Visit: http://localhost:8080
```

### Adding Products via API

```bash
curl -X POST https://crm-cms-api.p4d-b2q.workers.dev/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer crm-cms-admin-secret-key-change-me" \
  -d '{
    "title": "New Product",
    "price": 29.99,
    "currency": "USD",
    "sku": "NP-001",
    "category": "Gadgets",
    "inventory": 25,
    "weight": 500,
    "images": ["https://example.com/image.jpg"]
  }'
```

## Security Considerations

1. **Change default admin API key** — Set via `wrangler secret put ADMIN_API_KEY`
2. **Use HTTPS** — Cloudflare provides free SSL certificates
3. **Validate input** — Worker validates all incoming data
4. **CORS restrictions** — Only allow trusted origins
5. **API key protection** — Keep admin key confidential

## Troubleshooting

### "NetworkError when attempting to fetch resource"

**Cause:** CORS issue or incorrect API URL.

**Solution:**
1. Check `public/js/api.js` has correct Worker URL:
   ```javascript
   const API_BASE = '...' : 'https://crm-cms-api.<your>.workers.dev'
   ```
2. Verify Worker CORS config in `worker/index.js`
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for detailed errors

### "ProductsAPI is not defined"

**Cause:** Script loading order issue.

**Solution:**
- Ensure `api.js` is loaded before `admin-products.js`
- Check browser console for loading errors

### Worker deployment fails

**Solution:**
```bash
cd worker
npx wrangler login  # Re-authenticate
npx wrangler deploy
```

## Performance

- **Worker cold start:** ~5ms (Cloudflare Workers)
- **KV read latency:** <10ms (edge locations)
- **Frontend load:** <1s (Cloudflare CDN)
- **Total dependencies:** ~200KB (gzipped: ~60KB)

## License

MIT License — Feel free to use, modify, and distribute.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- GitHub Issues: https://github.com/MYMDO/CRM-CMS/issues
- Cloudflare Docs: https://developers.cloudflare.com
- Hono Docs: https://hono.dev

---

**Built with ❤️ using pure web technologies and Cloudflare's edge network.**
