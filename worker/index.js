import { Hono } from 'hono'
import { productsRouter } from './routes/products.js'
import { ordersRouter } from './routes/orders.js'
import { checkoutRouter } from './routes/checkout.js'

const app = new Hono()

app.all('*', async (c, next) => {
  const origin = c.req.header('Origin') || ''
  if (origin) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Credentials', 'true')
  } else {
    c.header('Access-Control-Allow-Origin', '*')
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Max-Age', '86400')
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }
  await next()
})

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

app.get('/api/config', (c) => c.json({
  stripePublishableKey: c.env.STRIPE_PUBLISHABLE_KEY || ''
}))

app.route('/api', productsRouter)
app.route('/api', ordersRouter)
app.route('/api', checkoutRouter)

export default app
