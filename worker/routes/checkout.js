import { Hono } from 'hono'

const checkoutRouter = new Hono()

// Helper: Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11)
}

// POST /api/checkout - Create order (public)
checkoutRouter.post('/checkout', async (c) => {
  const body = await c.req.json()
  const { items, customerEmail, customerName, shippingAddress } = body
  if (!items || !Array.isArray(items) || !items.length) {
    return c.json({ error: 'Cart is empty' }, 400)
  }

  let orderTotal = 0
  const orderItems = []

  for (const item of items) {
    if (!item.productId) continue
    const data = await c.env.KV.get(`product:${item.productId}`)
    if (!data) continue
    const product = JSON.parse(data)
    const price = item.variantPrice || product.price || 0
    orderItems.push({
      productId: item.productId,
      title: product.title || 'Product',
      price: price,
      quantity: parseInt(item.quantity) || 1,
      currency: product.currency || 'USD'
    })
    orderTotal += price * (parseInt(item.quantity) || 1)
  }

  if (!orderItems.length) {
    return c.json({ error: 'No valid items in cart' }, 400)
  }

  const orderId = generateId()
  const viewToken = generateId()
  const order = {
    id: orderId,
    items: orderItems,
    total: parseFloat(orderTotal.toFixed(2)),
    status: 'pending',
    customerEmail: customerEmail || '',
    customerName: customerName || '',
    shippingAddress: shippingAddress || {},
    viewToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await c.env.KV.put(`order:${orderId}`, JSON.stringify(order))
  return c.json({
    orderId,
    token: viewToken,
    message: 'Order placed successfully'
  })
})

export { checkoutRouter }
