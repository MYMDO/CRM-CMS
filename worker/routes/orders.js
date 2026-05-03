import { Hono } from 'hono'

const ordersRouter = new Hono()

// Helper: Check admin authorization
function isAdmin(c) {
  return c.req.header('Authorization') === `Bearer ${c.env.ADMIN_API_KEY}`
}

// Helper: Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11)
}

// GET /api/orders - List orders (admin only)
ordersRouter.get('/orders', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const { status } = c.req.query()
  const list = await c.env.KV.list({ prefix: 'order:' })
  const orders = []
  for (const key of list.keys) {
    const data = await c.env.KV.get(key.name)
    if (!data) continue
    const order = JSON.parse(data)
    if (status && order.status !== status) continue
    orders.push(order)
  }
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return c.json(orders)
})

// GET /api/orders/:id - Get single order (admin or token)
ordersRouter.get('/orders/:id', async (c) => {
  const data = await c.env.KV.get(`order:${c.req.param('id')}`)
  if (!data) return c.json({ error: 'Order not found' }, 404)
  const order = JSON.parse(data)
  const auth = c.req.header('Authorization')
  // Admin access
  if (auth === `Bearer ${c.env.ADMIN_API_KEY}`) {
    return c.json(order)
  }
  // Token-based access for customers
  const token = c.req.query('token')
  if (!token || token !== order.viewToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return c.json(order)
})

// PATCH /api/orders/:id - Update order status (admin only)
ordersRouter.patch('/orders/:id', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const data = await c.env.KV.get(`order:${c.req.param('id')}`)
  if (!data) return c.json({ error: 'Order not found' }, 404)
  const order = JSON.parse(data)
  const body = await c.req.json()
  Object.assign(order, {
    status: body.status || order.status,
    updatedAt: new Date().toISOString()
  })
  await c.env.KV.put(`order:${c.req.param('id')}`, JSON.stringify(order))
  return c.json(order)
})

// GET /api/analytics - Dashboard stats (admin only)
ordersRouter.get('/analytics', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const orderList = await c.env.KV.list({ prefix: 'order:' })
  let totalRevenue = 0, orderCount = 0
  const statusCounts = {}
  for (const key of orderList.keys) {
    const data = await c.env.KV.get(key.name)
    if (!data) continue
    const order = JSON.parse(data)
    orderCount++
    if (['paid', 'shipped', 'delivered'].includes(order.status)) {
      totalRevenue += order.total || 0
    }
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
  }
  const productList = await c.env.KV.list({ prefix: 'product:' })
  return c.json({
    totalRevenue: totalRevenue.toFixed(2),
    orderCount,
    productCount: productList.keys.length,
    statusCounts
  })
})

export { ordersRouter }
