import { Hono } from 'hono'
import { productsRouter } from './routes/products.js'
import { ordersRouter } from './routes/orders.js'
import { checkoutRouter } from './routes/checkout.js'

const app = new Hono()

// CORS middleware - add headers to every response
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || ''
  const isAllowed = origin.endsWith('.pages.dev') || origin.includes('localhost') || origin.includes('127.0.0.1')
  
  await next()
  
  // Set CORS headers after next() so they're on the response
  if (isAllowed) {
    c.res.headers.set('Access-Control-Allow-Origin', origin)
    c.res.headers.set('Access-Control-Allow-Credentials', 'true')
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    c.res.headers.set('Access-Control-Max-Age', '86400')
  } else {
    c.res.headers.set('Access-Control-Allow-Origin', '*')
  }
})

// Handle OPTIONS preflight
app.options('*', (c) => {
  return new Response(null, { status: 204 })
})

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

app.get('/api/config', (c) => c.json({
  stripePublishableKey: c.env.STRIPE_PUBLISHABLE_KEY || ''
}))

app.route('/api', productsRouter)
app.route('/api', ordersRouter)
app.route('/api', checkoutRouter)

export default app
