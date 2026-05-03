import { Hono } from 'hono'
import { productsRouter } from '../worker/routes/products.js'
import { ordersRouter } from '../worker/routes/orders.js'
import { checkoutRouter } from '../worker/routes/checkout.js'

const app = new Hono()

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

app.get('/api/config', (c) => c.json({
  stripePublishableKey: c.env.STRIPE_PUBLISHABLE_KEY || ''
}))

app.route('/api', productsRouter)
app.route('/api', ordersRouter)
app.route('/api', checkoutRouter)

export default app
