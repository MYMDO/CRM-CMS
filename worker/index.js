import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { productsRouter } from './routes/products.js'
import { ordersRouter } from './routes/orders.js'
import { checkoutRouter } from './routes/checkout.js'

const app = new Hono()

// CORS middleware - allow requests from Pages domain
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://crm-cms-store.pages.dev',
      'http://localhost:5173',
      'http://localhost:8787',
      'http://127.0.0.1:8787'
    ]
    if (allowed.includes(origin) || origin?.endsWith('.pages.dev') || origin?.includes('localhost')) {
      return origin
    }
    return ''
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}))

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

app.get('/api/config', (c) => c.json({
  stripePublishableKey: c.env.STRIPE_PUBLISHABLE_KEY || ''
}))

app.route('/api', productsRouter)
app.route('/api', ordersRouter)
app.route('/api', checkoutRouter)

export default app
