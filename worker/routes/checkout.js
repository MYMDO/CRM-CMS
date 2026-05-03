import { Hono } from 'hono'
import Stripe from 'stripe'

const checkoutRouter = new Hono()

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

checkoutRouter.post('/checkout', async (c) => {
  const body = await c.req.json()
  const { items, customerEmail, shippingAddress } = body
  if (!items || !items.length) return c.json({ error: 'Cart is empty' }, 400)

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  const lineItems = []
  let orderTotal = 0

  for (const item of items) {
    const data = await c.env.KV.get(`product:${item.productId}`)
    if (!data) continue
    const product = JSON.parse(data)
    const price = item.variantPrice || product.price
    lineItems.push({
      price_data: {
        currency: product.currency.toLowerCase(),
        product_data: { name: product.title, images: product.images.slice(0, 1) },
        unit_amount: Math.round(price * 100)
      },
      quantity: item.quantity
    })
    orderTotal += price * item.quantity
  }

  const orderId = generateId()
  const viewToken = generateId()
  const order = {
    id: orderId,
    items,
    total: orderTotal,
    status: 'pending',
    customerEmail,
    shippingAddress,
    stripeSessionId: null,
    viewToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await c.env.KV.put(`order:${orderId}`, JSON.stringify(order))

  const baseUrl = c.env.STORE_URL || c.req.header('Origin') || ''
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    customer_email: customerEmail,
    success_url: `${baseUrl}/order.html?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&token=${viewToken}`,
    cancel_url: `${baseUrl}/cart.html`,
    metadata: { orderId }
  })

  order.stripeSessionId = session.id
  await c.env.KV.put(`order:${orderId}`, JSON.stringify(order))
  return c.json({ sessionId: session.id, orderId, url: session.url })
})

checkoutRouter.post('/webhook', async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  const signature = c.req.header('stripe-signature')
  const body = await c.req.text()
  try {
    const event = stripe.webhooks.constructEvent(body, signature, c.env.STRIPE_WEBHOOK_SECRET)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session.metadata.orderId
      const data = await c.env.KV.get(`order:${orderId}`)
      if (data) {
        const order = JSON.parse(data)
        order.status = 'paid'
        order.stripePaymentId = session.payment_intent
        order.updatedAt = new Date().toISOString()
        await c.env.KV.put(`order:${orderId}`, JSON.stringify(order))
      }
    }
    return c.json({ received: true })
  } catch (err) {
    return c.json({ error: err.message }, 400)
  }
})

export { checkoutRouter }
