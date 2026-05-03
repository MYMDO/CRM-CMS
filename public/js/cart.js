function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart))
  updateCartCount()
}

function addToCart(productId, variantPrice = null) {
  const cart = getCart()
  const existing = cart.find(item => item.productId === productId && item.variantPrice === variantPrice)
  if (existing) { existing.quantity++ } else { cart.push({ productId, variantPrice, quantity: 1 }) }
  saveCart(cart)
}

function removeFromCart(productId, variantPrice = null) {
  saveCart(getCart().filter(i => !(i.productId === productId && i.variantPrice === variantPrice)))
}

function updateQuantity(productId, variantPrice, qty) {
  const cart = getCart()
  const item = cart.find(i => i.productId === productId && i.variantPrice === variantPrice)
  if (item) { item.quantity = Math.max(1, qty); saveCart(cart) }
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0)
}

function updateCartCount() {
  const el = document.getElementById('cart-count')
  if (el) { const count = getCartCount(); el.textContent = count; el.style.display = count ? 'inline-flex' : 'none' }
}

document.addEventListener('DOMContentLoaded', updateCartCount)
