import { Hono } from 'hono'

const ordersRouter = new Hono()

function isAdmin(c) {
  const auth = c.req.header('Authorization')
  return auth === `Bearer ${c.env.ADMIN_API_KEY}`
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

ordersRouter.get('/orders', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const { status } = c.req.query()
  const list = await c.env.KV.list({ prefix: 'order:' })
  const orders = []
  for (const key of list.keys) {
    const data = await c.env.KV.get(key.name)
    if (data) {
      const order = JSON.parse(data)
      if (status && order.status !== status) continue
      orders.push(order)
    }
  }
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return c.json(orders)
})

ordersRouter.get('/orders/:id', async (c) => {
  const data = await c.env.KV.get(`order:${c.param('id')}`)
  if (!data) return c.json({ error: 'Order not found' }, 404)
  const order = JSON.parse(data)
  const auth = c.req.header('Authorization')
  if (auth !== `Bearer ${c.env.ADMIN_API_KEY}`) {
    if (!c.req.query('token') || c.req.query('token') !== order.viewToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
  }
  return c.json(order)
})

ordersRouter.patch('/orders/:id', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const data = await c.env.KV.get(`order:${c.param('id')}`)
  if (!data) return c.json({ error: 'Order not found' }, 404)
  const order = JSON.parse(data)
  const body = await c.req.json()
  Object.assign(order, {
    ...body,
    updatedAt: new Date().toISOString()
  })
  await c.env.KV.put(`order:${c.param('id')}`, JSON.stringify(order))
  return c.json(order)
})

ordersRouter.get('/analytics', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const list = await c.env.KV.list({ prefix: 'order:' })
  let totalRevenue = 0, orderCount = 0
  const statusCounts = {}
  for (const key of list.keys) {
    const data = await c.env.KV.get(key.name)
    if (data) {
      const order = JSON.parse(data)
      orderCount++
      if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
        totalRevenue += order.total || 0
      }
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    }
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
