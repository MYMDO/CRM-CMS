/**
 * Admin Products Management
 * Handles CRUD operations for products
 */
let products = []

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Admin Products] Initializing...')
  loadProducts()
  setupEventListeners()
})

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Add product button
  document.getElementById('add-product-btn')?.addEventListener('click', () => showModal())
  // Modal close buttons
  document.getElementById('modal-close')?.addEventListener('click', hideModal)
  document.getElementById('cancel-btn')?.addEventListener('click', hideModal)
  // Form submission
  document.getElementById('product-form')?.addEventListener('submit', saveProduct)
  // Close modal on backdrop click
  document.getElementById('product-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') hideModal()
  })
}

/**
 * Load all products from API
 */
async function loadProducts() {
  const container = document.getElementById('products')
  try {
    products = await window.ProductsAPI.list()
    renderProducts()
  } catch (err) {
    console.error('[Admin Products] Error loading:', err)
    if (container) {
      container.innerHTML = `<p class="alert alert-error">Error loading products: ${err.message}</p>`
    }
  }
}

/**
 * Render products table
 */
function renderProducts() {
  const container = document.getElementById('products')
  if (!container) return
  if (!products.length) {
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-secondary)">No products yet. Click "Add Product" to create one.</p>'
    return
  }
  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>SKU</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>${escHtml(p.title || 'Untitled')}</td>
            <td>${escHtml(p.sku) || '<span style="color:var(--text-secondary)">-</span>'}</td>
            <td>${window.formatPrice(p.price, p.currency)}</td>
            <td>${p.inventory || 0}</td>
            <td><span class="badge badge-${p.status === 'active' ? 'success' : 'warning'}">${p.status}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`
}

/**
 * Show add/edit modal
 */
window.editProduct = function(id) {
  const modal = document.getElementById('product-modal')
  const title = document.getElementById('modal-title')
  const form = document.getElementById('product-form')
  form.reset()
  document.getElementById('product-id').value = ''
  title.textContent = 'Add Product'
  if (id) {
    const p = products.find(x => x.id === id)
    if (!p) return
    title.textContent = 'Edit Product'
    document.getElementById('product-id').value = p.id
    document.getElementById('title').value = p.title || ''
    document.getElementById('description').value = p.description || ''
    document.getElementById('price').value = p.price || 0
    document.getElementById('currency').value = p.currency || 'USD'
    document.getElementById('sku').value = p.sku || ''
    document.getElementById('category').value = p.category || ''
    document.getElementById('inventory').value = p.inventory || 0
    document.getElementById('weight').value = p.weight || 0
    document.getElementById('status').value = p.status || 'active'
  }
  modal?.classList.add('active')
}

function showModal() { window.editProduct() }

/**
 * Hide modal
 */
function hideModal() {
  document.getElementById('product-modal')?.classList.remove('active')
}

/**
 * Save product (create or update)
 */
async function saveProduct(e) {
  e.preventDefault()
  const id = document.getElementById('product-id').value
  const btn = e.target.querySelector('button[type="submit"]')
  const originalText = btn?.textContent
  try {
    if (btn) { btn.textContent = 'Saving...'; btn.disabled = true }
    const data = {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      price: parseFloat(document.getElementById('price').value),
      currency: document.getElementById('currency').value.trim() || 'USD',
      sku: document.getElementById('sku').value.trim(),
      category: document.getElementById('category').value.trim(),
      inventory: parseInt(document.getElementById('inventory').value) || 0,
      weight: parseFloat(document.getElementById('weight').value) || 0,
      status: document.getElementById('status').value,
      images: document.getElementById('image-url')?.value 
        ? [document.getElementById('image-url').value.trim()] 
        : []
    }
    if (!data.title) {
      alert('Please enter a product title')
      return
    }
    if (isNaN(data.price) || data.price <= 0) {
      alert('Please enter a valid price')
      return
    }
    if (id) {
      await window.ProductsAPI.update(id, data)
      showNotification('Product updated successfully!', 'success')
    } else {
      await window.ProductsAPI.create(data)
      showNotification('Product created successfully!', 'success')
    }
    hideModal()
    await loadProducts()
  } catch (err) {
    console.error('[Admin Products] Save error:', err)
    showNotification(`Error: ${err.message}`, 'error')
  } finally {
    if (btn) { btn.textContent = originalText; btn.disabled = false }
  }
}

/**
 * Delete product
 */
window.deleteProduct = async function(id) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
  try {
    await window.ProductsAPI.delete(id)
    showNotification('Product deleted successfully!', 'success')
    await loadProducts()
  } catch (err) {
    console.error('[Admin Products] Delete error:', err)
    showNotification(`Error: ${err.message}`, 'error')
  }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification')
  if (existing) existing.remove()
  const div = document.createElement('div')
  div.className = `notification alert alert-${type}`
  div.textContent = message
  div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1000;min-width:300px;animation:slideIn 0.3s ease;'
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 3000)
}

/**
 * Escape HTML to prevent XSS
 */
function escHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Add CSS animation for notifications
const style = document.createElement('style')
style.textContent = `
@keyframes slideIn {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`
document.head.appendChild(style)
