/**
 * user.js
 * Handles product listing and interaction on user pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI(); // from auth.js

    if (document.getElementById('products-grid')) {
        renderProducts();
        setupFilters();
    }

    if (document.getElementById('product-detail-container')) {
        renderProductDetails();
    }

    if (document.getElementById('orders-list')) {
        renderUserOrders();
    }
});

// --- SHOP PAGE ---

function renderProducts(filterCategory = 'All', searchQuery = '') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let products = getProducts();

    // Filter by Category
    if (filterCategory !== 'All') {
        products = products.filter(p => p.category === filterCategory);
    }

    // Filter by Search Query
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(lowerQ) ||
            p.description.toLowerCase().includes(lowerQ)
        );
    }

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        const isOutOfStock = product.stock <= 0;
        const stockBadge = isOutOfStock
            ? '<span style="background:var(--danger-color); color:white; padding:2px 8px; border-radius:4px; font-size:0.7em;">Out of Stock</span>'
            : `<span style="color:var(--text-muted); font-size:0.8em;">${product.stock} in stock</span>`;

        const btnDisabled = isOutOfStock ? 'disabled style="background-color:#ccc; cursor:not-allowed;"' : '';
        const btnText = isOutOfStock ? 'Sold Out' : 'Add to Cart';

        // Wishlist State (Check if liked)
        const isLiked = isInWishlist(product.id);
        const heartClass = isLiked ? 'text-danger' : 'text-muted'; // We will add CSS for this, or use inline color
        const heartColor = isLiked ? '#e74c3c' : '#bdc3c7';

        const card = document.createElement('div');
        card.className = 'product-card';
        // Make image and title clickable
        const viewLink = `onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer;"`;

        card.innerHTML = `
            <div style="position:relative;">
                <img src="${product.image}" alt="${product.name}" ${viewLink}>
                <button onclick="toggleWishlistHandler(event, ${product.id})" 
                        style="position:absolute; top:10px; right:10px; background:white; border:none; border-radius:50%; width:35px; height:35px; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2); font-size:1.2rem; color:${heartColor};">
                    &hearts;
                </button>
            </div>
            <div class="product-info">
                <h3 ${viewLink}>${product.name}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <p class="category" style="margin-bottom:0;">${product.category}</p>
                    ${stockBadge}
                </div>
                <div class="price">$${product.price}</div>
                <div class="actions">
                    <button onclick="window.location.href='product.html?id=${product.id}'" class="btn btn-secondary">View</button>
                    <button onclick="addToCartHandler(${product.id})" class="btn" ${btnDisabled}>${btnText}</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Wrapper to find product before adding
window.addToCartHandler = function (id) {
    const product = getProductById(id);
    if (!product || product.stock <= 0) {
        showToast('Item is out of stock', 'error');
        return;
    }
    addToCart(product);
}

function setupFilters() {
    const filterSelect = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            // Retrieve current search value when category changes
            const currentSearch = searchInput ? searchInput.value : '';
            renderProducts(filterSelect.value, currentSearch);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Retrieve current category value when search changes
            const currentCat = filterSelect ? filterSelect.value : 'All';
            renderProducts(currentCat, e.target.value);
        });
    }
}

// --- PRODUCT DETAIL PAGE ---

function renderProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const container = document.getElementById('product-detail-container');

    if (!id) {
        container.innerHTML = '<p>Product not found.</p>';
        return;
    }

    const product = getProductById(id);
    if (!product) {
        container.innerHTML = '<p>Product not found.</p>';
        return;
    }

    // Populate data
    document.getElementById('detail-image').src = product.image;
    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-category').textContent = product.category;
    document.getElementById('detail-price').textContent = '$' + product.price;
    document.getElementById('detail-desc').textContent = product.description;

    // Add to cart button
    const btn = document.getElementById('add-to-cart-btn');
    if (product.stock <= 0) {
        btn.disabled = true;
        btn.textContent = 'Out of Stock';
        btn.style.backgroundColor = '#ccc';
    } else {
        btn.onclick = () => addToCart(product);
    }

    // Render Reviews
    renderReviews(id);
    setupReviewForm(id);

    // Related Products
    // Related Products
    renderRelatedProducts(product.category, product.id);

    // Apply Admin Restrictions if applicable
    restrictAdminProductView();
}

function restrictAdminProductView() {
    // Only apply on detailed product page
    if (!document.getElementById('product-detail-container')) return;

    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user && user.role === 'admin') {
            console.log('Restricting view for Admin...');

            // 1. Hide Add to Cart Button
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            if (addToCartBtn) addToCartBtn.style.display = 'none';

            // 2. Hide Reviews Section
            const reviewsSection = document.getElementById('reviews-section');
            if (reviewsSection) reviewsSection.style.display = 'none';

            // 3. Customize Navbar: Only show "Back" or "Close" option
            // We target the nav ul populated by auth.js
            const navUl = document.querySelector('header nav ul');
            if (navUl) {
                const urlParams = new URLSearchParams(window.location.search);
                const fromAdmin = urlParams.get('from_admin');

                let backLabel = 'Back';
                let backIcon = 'fa-arrow-left';
                let backAction = 'window.history.back()';

                // If this is the landing page from admin (has param), 'Back' implies closing the tab.
                // Or if we can't go back.
                if (fromAdmin) {
                    backLabel = 'Close';
                    backIcon = 'fa-times';
                    backAction = 'window.close()';
                }

                navUl.innerHTML = `
                    <li>
                        <a href="#" onclick="${backAction}; return false;" style="font-weight:bold;">
                            <i class="fa-solid ${backIcon}"></i> ${backLabel}
                        </a>
                    </li>
                `;
            }

            // Hide the "Back to Shop" link in content if it's redundant or confusing
            // The one at the top of container
            const contentBackLink = document.querySelector('.container > a[href="index.html"]');
            if (contentBackLink) contentBackLink.style.display = 'none';
        }
    }
}

function renderRelatedProducts(category, currentId) {
    const container = document.getElementById('related-products');
    if (!container) return; // In case we forget to add div in html

    const all = getProducts();
    // Filter same category, exclude current, shuffle, take 3
    const related = all.filter(p => p.category === category && p.id !== currentId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    container.innerHTML = '';
    if (related.length === 0) {
        container.innerHTML = '<p>No related products found.</p>';
        return;
    }

    related.forEach(p => {
        // Simple card
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <img src="${p.image}" style="height:150px; cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">
            <h4 style="cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">${p.name}</h4>
            <div class="price">$${p.price}</div>
            <button onclick="window.location.href='product.html?id=${p.id}'" class="btn btn-secondary btn-sm">View</button>
         `;
        container.appendChild(div);
    });
}

function renderReviews(productId) {
    const list = document.getElementById('reviews-list');
    const reviews = getReviews(productId);

    if (reviews.length === 0) {
        list.innerHTML = '<p class="text-muted">No reviews yet.</p>';
        return;
    }

    list.innerHTML = '';
    reviews.forEach(r => {
        const div = document.createElement('div');
        div.style.marginBottom = '20px';
        div.style.paddingBottom = '20px';
        div.style.borderBottom = '1px solid var(--border-color)';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <strong>${r.userName}</strong>
                <span class="text-muted" style="font-size:0.9em;">${r.date}</span>
            </div>
            <div style="color:#f1c40f; margin-bottom:8px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            <p>${r.comment}</p>
        `;
        list.appendChild(div);
    });
}

function setupReviewForm(productId) {
    const form = document.getElementById('review-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = getCurrentUser();

        if (!user) {
            showToast('Please login to leave a review.', 'info');
            return;
        }

        const review = {
            productId: productId,
            userId: user.id || user.email,
            userName: user.name,
            rating: parseInt(document.getElementById('review-rating').value),
            comment: document.getElementById('review-comment').value
        };

        addReview(review);
        showToast('Review submitted!', 'success');
        form.reset();
        renderReviews(productId);
    });
}

// --- ORDERS PAGE ---

function renderUserOrders() {
    requireLogin(); // Protect page

    const user = getCurrentUser();
    const allOrders = getOrders();
    // Filter orders by user ID or email (simple demo matching)
    // We used user.id in checkout, but let's support robust checking

    const myOrders = allOrders.filter(o => o.userId == user.id || o.userId === user.email);
    myOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('orders-list');
    container.innerHTML = '';

    if (myOrders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }

    myOrders.forEach(order => {
        const itemNames = order.items.map(i => `${i.name} (x${i.quantity})`).join(', ');

        let actionsHtml = '';
        if (order.status === 'Pending') {
            actionsHtml = `<button onclick="cancelOrderHandler(${order.id})" class="btn btn-danger" style="font-size:0.8rem; padding: 6px 12px; margin-top:5px;">Cancel Order</button>`;
        }

        const card = document.createElement('div');
        card.className = 'admin-card'; // Reuse style
        card.style.background = 'white';
        card.style.padding = '20px';
        card.style.marginBottom = '20px';
        card.style.borderRadius = '8px';
        card.style.boxShadow = 'var(--shadow-sm)';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                <span style="font-weight:bold;">Order #${order.id}</span>
                <span class="badge ${order.status}" style="padding: 5px 10px; border-radius: 4px; background: #eee;">${order.status}</span>
            </div>
            <p><strong>Date:</strong> ${order.date}</p>
            <p><strong>Items:</strong> ${itemNames}</p>
            <p><strong>Total:</strong> <span style="color:var(--primary-color); font-weight:bold;">$${order.totalAmount.toFixed(2)}</span></p>
            <p><strong>Payment:</strong> ${order.paymentMethod}</p>
            ${actionsHtml}
        `;
        container.appendChild(card);
    });
}

window.cancelOrderHandler = function (id) {
    if (confirm("Are you sure you want to cancel this order?")) {
        const success = cancelOrder(id);
        if (success) {
            showToast("Order cancelled successfully.", "success");
            renderUserOrders(); // Refresh status
        } else {
            showToast("Could not cancel order.", "error");
        }
    }
}

window.toggleWishlistHandler = function (event, id) {
    event.stopPropagation(); // Prevent ensuring card click triggers something else if we had card clicks
    const added = toggleWishlist(id);
    // User needs to be logged in logic handled in data.js, but visual update here:
    // This is cheap re-render or valid DOM manipulation.
    // For simplicity, let's just re-render or toggle the color of the button clicked.

    if (getCurrentUser()) {
        const btn = event.currentTarget;
        btn.style.color = added ? '#e74c3c' : '#bdc3c7';
        showToast(added ? 'Added to Wishlist' : 'Removed from Wishlist', 'success');
    }
}

// --- DARK MODE ---
function initDarkMode() {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(e) {
        if (e.matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    // Apply initially
    applyTheme(prefersDark);

    // Listen for changes
    prefersDark.addEventListener('change', applyTheme);
}

// Ensure init runs
document.addEventListener('DOMContentLoaded', initDarkMode);
