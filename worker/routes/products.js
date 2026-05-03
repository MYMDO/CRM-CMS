import { Hono } from 'hono'

const productsRouter = new Hono()

// Helper: Check admin authorization
function isAdmin(c) {
  return c.req.header('Authorization') === `Bearer ${c.env.ADMIN_API_KEY}`
}

// Helper: Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11)
}

// GET /api/products - List products (public)
productsRouter.get('/products', async (c) => {
  const { category, status } = c.req.query()
  const list = await c.env.KV.list({ prefix: 'product:' })
  const products = []
  for (const key of list.keys) {
    const data = await c.env.KV.get(key.name)
    if (!data) continue
    const product = JSON.parse(data)
    if (category && product.category !== category) continue
    if (status && product.status !== status) continue
    products.push(product)
  }
  return c.json(products)
})

// GET /api/products/:id - Get single product (public)
productsRouter.get('/products/:id', async (c) => {
  const data = await c.env.KV.get(`product:${c.req.param('id')}`)
  if (!data) return c.json({ error: 'Product not found' }, 404)
  return c.json(JSON.parse(data))
})

// POST /api/products - Create product (admin only)
productsRouter.post('/products', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const body = await c.req.json()
  const id = generateId()
  const product = {
    id,
    sku: body.sku || `SKU-${id}`,
    title: body.title || 'Untitled',
    description: body.description || '',
    price: parseFloat(body.price) || 0,
    currency: body.currency || 'USD',
    images: Array.isArray(body.images) ? body.images : [],
    category: body.category || '',
    status: body.status || 'active',
    inventory: parseInt(body.inventory) || 0,
    weight: parseFloat(body.weight) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await c.env.KV.put(`product:${id}`, JSON.stringify(product))
  return c.json(product, 201)
})

// PATCH /api/products/:id - Update product (admin only)
productsRouter.patch('/products/:id', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const data = await c.env.KV.get(`product:${c.req.param('id')}`)
  if (!data) return c.json({ error: 'Product not found' }, 404)
  const product = JSON.parse(data)
  const body = await c.req.json()
  Object.assign(product, {
    title: body.title || product.title,
    description: body.description ?? product.description,
    price: body.price !== undefined ? parseFloat(body.price) : product.price,
    currency: body.currency || product.currency,
    images: Array.isArray(body.images) ? body.images : product.images,
    category: body.category ?? product.category,
    status: body.status || product.status,
    inventory: body.inventory !== undefined ? parseInt(body.inventory) : product.inventory,
    weight: body.weight !== undefined ? parseFloat(body.weight) : product.weight,
    updatedAt: new Date().toISOString()
  })
  await c.env.KV.put(`product:${c.req.param('id')}`, JSON.stringify(product))
  return c.json(product)
})

// DELETE /api/products/:id - Delete product (admin only)
productsRouter.delete('/products/:id', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  await c.env.KV.delete(`product:${c.req.param('id')}`)
  return c.json({ success: true })
})

export { productsRouter }
