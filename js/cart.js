/**
 * cart.js
 * Manages the shopping cart using localStorage.
 */

const CART_KEY = 'cart';

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartIcon();
}

function addToCart(product) {
    let cart = getCart();

    // Check if user is Admin
    // We assume 'getCurrentUser' is available globally from auth.js
    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user && user.role === 'admin') {
            showToast('Admins cannot make purchases.', 'error');
            return;
        }
    }

    const existingItem = cart.find(item => item.id == product.id);

    // Get fresh product data to check up-to-date stock
    // (In case product was just updated or we are adding from a stale view)
    // Note: In this simple app, we rely on the passed 'product' or fetch it again.
    // Ideally we should look up the master record.
    // But since 'product' might come from the grid usage, let's look up fresh for safety:

    // We need access to helper but this file is cart.js might not have direct access if moduling.
    // But we are using global scripts. So getProducts() is available.

    const masterProduct = (typeof getProductById === 'function') ? getProductById(product.id) : product;

    const currentQty = existingItem ? existingItem.quantity : 0;

    if (masterProduct.stock <= currentQty) {
        showToast(`Sorry, only ${masterProduct.stock} items in stock.`, 'error');
        return;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }


    saveCart(cart);
    showToast(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id != productId);
    saveCart(cart);
    renderCartPage(); // Re-render if on cart page
}

function updateQuantity(productId, newQty) {
    let cart = getCart();
    const item = cart.find(item => item.id == productId);
    if (item) {
        const qty = parseInt(newQty);

        // Stock Check
        const masterProduct = (typeof getProductById === 'function') ? getProductById(productId) : null;
        if (masterProduct && masterProduct.stock < qty) {
            showToast(`Only ${masterProduct.stock} items available.`, 'error');
            renderCartPage(); // Reset input to previous valid value (implicitly by re-rendering)
            return;
        }

        item.quantity = qty;
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
    }
    saveCart(cart);
    renderCartPage();
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartIcon();
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Update the Cart (0) indicator in header
function updateCartIcon() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartLink = document.getElementById('cart-link');
    if (cartLink) {
        cartLink.innerHTML = `Cart (${count})`;
    }
}

// Rendering Logic for Cart Page
function renderCartPage() {
    const cartTableBody = document.querySelector('#cart-table tbody');
    const totalEl = document.getElementById('cart-total');

    if (!cartTableBody) return; // Not on cart page

    const cart = getCart();
    cartTableBody.innerHTML = '';

    if (cart.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Your cart is empty.</td></tr>';
        totalEl.textContent = '$0.00';
        return;
    }

    cart.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover;">
                    ${item.name}
                </div>
            </td>
            <td>$${item.price}</td>
            <td>
                <input type="number" value="${item.quantity}" min="1" 
                       onchange="updateQuantity(${item.id}, this.value)" style="width: 60px;">
            </td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
            <td>
                <button onclick="removeFromCart(${item.id})" class="btn btn-danger" style="padding:5px 10px;">X</button>
            </td>
        `;
        cartTableBody.appendChild(tr);
    });

    const total = getCartTotal();
    document.getElementById('cart-total').textContent = total.toFixed(2);
}

// Checkout Logic
function checkout() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    // Redirect to new Checkout Page
    window.location.href = 'checkout.html';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon();
    if (document.getElementById('cart-table')) {
        renderCartPage();
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', checkout);
        }
    }
});
