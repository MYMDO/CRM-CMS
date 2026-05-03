document.addEventListener('DOMContentLoaded', async () => {
  const productsEl = document.getElementById('products')
  const categoryFilter = document.getElementById('category-filter')
  let allProducts = []

  async function loadProducts() {
    productsEl.innerHTML = '<p>Loading...</p>'
    allProducts = await ProductsAPI.list({ status: 'active' })
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
    categoryFilter.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('')
    renderProducts(allProducts)
  }

  function renderProducts(products) {
    if (!products.length) { productsEl.innerHTML = '<p>No products found.</p>'; return }
    productsEl.innerHTML = products.map(p => `
      <div class="product-card" onclick="location.href='/product.html?id=${p.id}'">
        <img src="${p.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${p.title}">
        <div class="product-card-body">
          <h3>${p.title}</h3>
          <p class="price">${formatPrice(p.price, p.currency)}</p>
          <p style="font-size:0.8rem;color:var(--text-secondary)">${p.inventory > 0 ? p.inventory + ' in stock' : 'Out of stock'}</p>
        </div>
      </div>`).join('')
  }

  categoryFilter.addEventListener('change', (e) => {
    const cat = e.target.value
    renderProducts(cat ? allProducts.filter(p => p.category === cat) : allProducts)
  })

  loadProducts()
})
