import { Hono } from 'hono'

const checkoutRouter = new Hono()

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

checkoutRouter.post('/checkout', async (c) => {
  const body = await c.req.json()
  const { items, customerEmail, customerName, shippingAddress } = body
  if (!items || !items.length) return c.json({ error: 'Cart is empty' }, 400)

  let orderTotal = 0
  const orderItems = []

  for (const item of items) {
    const data = await c.env.KV.get(`product:${item.productId}`)
    if (!data) continue
    const product = JSON.parse(data)
    const price = item.variantPrice || product.price
    orderItems.push({
      productId: item.productId,
      title: product.title,
      price: price,
      quantity: item.quantity,
      currency: product.currency
    })
    orderTotal += price * item.quantity
  }

  const orderId = generateId()
  const viewToken = generateId()
  const order = {
    id: orderId,
    items: orderItems,
    total: parseFloat(orderTotal.toFixed(2)),
    status: 'pending',
    customerEmail,
    customerName: customerName || '',
    shippingAddress: shippingAddress || {},
    viewToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await c.env.KV.put(`order:${orderId}`, JSON.stringify(order))
  return c.json({ orderId, token: viewToken, message: 'Order placed successfully' })
})

export { checkoutRouter }
