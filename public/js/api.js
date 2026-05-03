const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:8787' : 'https://crm-cms-api.p4d-b2q.workers.dev'
const ADMIN_KEY = 'crm-cms-admin-secret-key-change-me'

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  return res.json()
}

// Stripe removed - using direct checkout
const stripePromise = Promise.resolve(null)

window.ProductsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return api(`/api/products${q ? '?' + q : ''}`)
  },
  get: (id) => api(`/api/products/${id}`),
  create: (data) => api('/api/products', { method: 'POST', headers: { Authorization: `Bearer ${ADMIN_KEY}` }, body: JSON.stringify(data) }),
  update: (id, data) => api(`/api/products/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${ADMIN_KEY}` }, body: JSON.stringify(data) }),
  delete: (id) => api(`/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${ADMIN_KEY}` } })
}

window.OrdersAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return api(`/api/orders${q ? '?' + q : ''}`, { headers: { Authorization: `Bearer ${ADMIN_KEY}` } })
  },
  get: (id, token) => api(`/api/orders/${id}${token ? '?token=' + token : ''}`),
  update: (id, data) => api(`/api/orders/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${ADMIN_KEY}` }, body: JSON.stringify(data) }),
  analytics: () => api('/api/analytics', { headers: { Authorization: `Bearer ${ADMIN_KEY}` } })
}

window.CheckoutAPI = {
  create: (data) => api('/api/checkout', { method: 'POST', body: JSON.stringify(data) })
}

window.formatPrice = function(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
}
