import { Hono } from 'hono'

const productsRouter = new Hono()

function isAdmin(c) {
  const auth = c.req.header('Authorization')
  return auth === `Bearer ${c.env.ADMIN_API_KEY}`
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

async function getCounter(c, name) {
  const val = await c.env.KV.get(`counter:${name}`)
  return val ? parseInt(val) : 0
}

async function incrementCounter(c, name) {
  const current = await getCounter(c, name)
  const next = current + 1
  await c.env.KV.put(`counter:${name}`, next.toString())
  return next
}

productsRouter.get('/products', async (c) => {
  const { category, status } = c.req.query()
  const list = await c.env.KV.list({ prefix: 'product:' })
  const products = []
  for (const key of list.keys) {
    const data = await c.env.KV.get(key.name)
    if (data) {
      const product = JSON.parse(data)
      if (category && product.category !== category) continue
      if (status && product.status !== status) continue
      products.push(product)
    }
  }
  return c.json(products)
})

productsRouter.get('/products/:id', async (c) => {
  const data = await c.env.KV.get(`product:${c.param('id')}`)
  if (!data) return c.json({ error: 'Product not found' }, 404)
  return c.json(JSON.parse(data))
})

productsRouter.post('/products', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const body = await c.req.json()
  const id = generateId()
  const product = {
    id,
    sku: body.sku || `SKU-${id}`,
    title: body.title,
    description: body.description || '',
    price: parseFloat(body.price) || 0,
    currency: body.currency || 'USD',
    images: body.images || [],
    category: body.category || '',
    status: body.status || 'active',
    inventory: parseInt(body.inventory) || 0,
    weight: parseFloat(body.weight) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await c.env.KV.put(`product:${id}`, JSON.stringify(product))
  await incrementCounter(c, 'products')
  return c.json(product, 201)
})

productsRouter.patch('/products/:id', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const data = await c.env.KV.get(`product:${c.param('id')}`)
  if (!data) return c.json({ error: 'Product not found' }, 404)
  const product = JSON.parse(data)
  const body = await c.req.json()
  Object.assign(product, {
    ...body,
    price: body.price !== undefined ? parseFloat(body.price) : product.price,
    inventory: body.inventory !== undefined ? parseInt(body.inventory) : product.inventory,
    updatedAt: new Date().toISOString()
  })
  await c.env.KV.put(`product:${c.param('id')}`, JSON.stringify(product))
  return c.json(product)
})

productsRouter.delete('/products/:id', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  await c.env.KV.delete(`product:${c.param('id')}`)
  return c.json({ success: true })
})

export { productsRouter }
