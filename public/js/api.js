const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:8787' : ''

async function api(path, options = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value)
    }
  }
  const fetchOptions = { ...options, headers }
  delete fetchOptions.headers
  Object.assign(fetchOptions, { headers })
  try {
    const res = await fetch(`${API_BASE}${path}`, fetchOptions)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    return res.json()
  } catch (err) {
    console.error('API Error:', err, 'URL:', `${API_BASE}${path}`, 'Options:', fetchOptions)
    throw err
  }
}
  }
  const fetchOptions = { ...options, headers }
  delete fetchOptions.headers
  Object.assign(fetchOptions, { headers })
  try {
    const res = await fetch(`${API_BASE}${path}`, fetchOptions)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    return res.json()
  } catch (err) {
    console.error('API Error:', err, 'URL:', `${API_BASE}${path}`, 'Options:', fetchOptions)
    throw err
  }
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
