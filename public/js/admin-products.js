let products = []

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, ProductsAPI:', typeof window.ProductsAPI, window.ProductsAPI)
  loadProducts()
  setupEventListeners()
})

function setupEventListeners() {
  document.getElementById('add-product-btn').addEventListener('click', () => showModal())
  document.getElementById('modal-close').addEventListener('click', hideModal)
  document.getElementById('cancel-btn').addEventListener('click', hideModal)
  document.getElementById('product-form').addEventListener('submit', saveProduct)
  document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') hideModal()
  })
}

async function loadProducts() {
  try {
    products = await ProductsAPI.list()
    renderProducts()
  } catch (err) {
    console.error('Error loading products:', err)
    document.getElementById('products').innerHTML = '<p class="alert alert-error">Error loading products</p>'
  }
}

function renderProducts() {
  if (!products.length) {
    document.getElementById('products').innerHTML = '<p>No products yet.</p>'
    return
  }
  document.getElementById('products').innerHTML = `
    <table class="table">
      <thead><tr><th>Title</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${products.map(p => `<tr>
        <td>${escHtml(p.title)}</td>
        <td>${escHtml(p.sku) || '-'}</td>
        <td>${formatPrice(p.price, p.currency)}</td>
        <td>${p.inventory}</td>
        <td><span class="badge badge-${p.status === 'active' ? 'success' : 'warning'}">${p.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>`).join('')}</tbody>
    </table>`
}

function showModal(id = null) {
  document.getElementById('product-form').reset()
  document.getElementById('product-id').value = ''
  document.getElementById('modal-title').textContent = 'Add Product'
  if (id) {
    const p = products.find(x => x.id === id)
    if (!p) return
    document.getElementById('modal-title').textContent = 'Edit Product'
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
  document.getElementById('product-modal').classList.add('active')
}

function hideModal() {
  document.getElementById('product-modal').classList.remove('active')
}

window.editProduct = function(id) { showModal(id) }

window.deleteProduct = async function(id) {
  if (!confirm('Delete this product?')) return
  try {
    await ProductsAPI.delete(id)
    await loadProducts()
  } catch (err) {
    console.error('Error deleting product:', err)
    alert('Error deleting product: ' + err.message)
  }
}

async function saveProduct(e) {
  e.preventDefault()
  const id = document.getElementById('product-id').value
  const data = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    price: parseFloat(document.getElementById('price').value),
    currency: document.getElementById('currency').value,
    sku: document.getElementById('sku').value,
    category: document.getElementById('category').value,
    inventory: parseInt(document.getElementById('inventory').value),
    weight: parseFloat(document.getElementById('weight').value),
    status: document.getElementById('status').value,
    images: document.getElementById('image-url').value ? [document.getElementById('image-url').value] : []
  }
  try {
    if (id) {
      await ProductsAPI.update(id, data)
    } else {
      await ProductsAPI.create(data)
    }
    hideModal()
    await loadProducts()
  } catch (err) {
    console.error('Error saving product:', err)
    alert('Error saving product: ' + err.message)
  }
}

function escHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
