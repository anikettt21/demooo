/**
 * data.js
 * Handles all interactions with localStorage.
 * Acts as a simulated database layer.
 */

const PRODUCTS_KEY = 'products';
const USERS_KEY = 'users';
const ORDERS_KEY = 'orders';
const WISHLIST_KEY = 'wishlist'; // Store as { userId: [productId, productId...] } or plain list if single user demo
const REVIEWS_KEY = 'reviews'; // [ {productId, userId, userName, rating, comment, date} ]
const CURRENT_USER_KEY = 'currentUser';

// --- INITIALIZATION ---

function initData() {
    // Check if we need to seed data (less than 20 items means mostly empty or just default)
    const existing = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];

    if (existing.length < 20) {
        console.log("Seeding large inventory...");
        const newProducts = generateInventory(150);

        // Merge with existing avoiding duplicates if any, or just overwrite since user asked for "more" (refill)
        // Let's keep existing and append.
        const allProducts = [...existing, ...newProducts];

        // Deduplicate by ID just in case
        const seen = new Set();
        const unique = allProducts.filter(p => {
            const duplicate = seen.has(p.id);
            seen.add(p.id);
            return !duplicate;
        });

        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(unique));
        showToast(`Stocked ${unique.length} products!`, 'success');
    }

    // Seed Admin User if empty
    if (!localStorage.getItem(USERS_KEY)) {
        const defaultUsers = [
            {
                id: 1,
                name: "Admin User",
                email: "admin@shop.com",
                password: "admin123", // Plain text as requested for demo
                role: "admin"
            },
            {
                id: 2,
                name: "John Doe",
                email: "user@shop.com",
                password: "user123",
                role: "user"
            }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem(ORDERS_KEY)) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
    }
}

// --- PRODUCT GENERATOR ---
function generateInventory(count) {
    const categories = ['Laptops', 'Monitors', 'Accessories', 'Components'];
    const brands = ['Nexus', 'Hyperion', 'Vertex', 'Titan', 'Omen', 'Zenith', 'Nova', 'Flux', 'Cyber', 'Quantum', 'Aero', 'Swift'];
    const adjectives = ['Pro', 'Ultra', 'Elite', 'Stealth', 'Max', 'Prime', 'Core', 'Extreme', 'Lite', 'X', 'GT', 'RS'];

    // Curated Unsplash Images by Category
    const images = {
        'Laptops': [
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=60',
            'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&q=60',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=60',
            'https://images.unsplash.com/photo-1588872657578-a83a040b6dc0?w=500&q=60',
            'https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=500&q=60',
            'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&q=60',
            'https://images.unsplash.com/photo-1531297425163-4d00e12932a3?w=500&q=60'
        ],
        'Monitors': [
            'https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=500&q=60',
            'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=60',
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=60',
            'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&q=60' // Shared laptop/desk shot
        ],
        'Accessories': [
            'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=500&q=60', // Keyboard
            'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=60', // Mouse
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=60', // Headphones
            'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=60', // Headphones
            'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=60', // Keyboard
            'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=500&q=60'  // Mouse
        ],
        'Components': [
            'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&q=60', // GPU
            'https://images.unsplash.com/photo-1555616635-640960031050?w=500&q=60', // CPU
            'https://images.unsplash.com/photo-1587202372634-943afa940bd0?w=500&q=60', // Case
            'https://images.unsplash.com/photo-1628557672230-ff444cca68c4?w=500&q=60', // SSD
            'https://images.unsplash.com/photo-1542393545-facac42e6793?w=500&q=60'  // Motherboard
        ]
    };

    const products = [];
    const baseId = Date.now();

    for (let i = 0; i < count; i++) {
        // Pick Random Category
        const cat = categories[Math.floor(Math.random() * categories.length)];

        // Pick Random Brand & Adjective
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];

        // Determine product name logic based on category
        let noun = '';
        let priceBase = 0;

        if (cat === 'Laptops') {
            noun = ['Book', 'Blade', '15', '17', 'Air', 'Note'].sort(() => Math.random() - 0.5)[0];
            priceBase = 800 + Math.random() * 2000;
        } else if (cat === 'Monitors') {
            noun = ['View', 'Vision', 'Display', 'X', 'OLED', 'Ultrawide'].sort(() => Math.random() - 0.5)[0];
            priceBase = 200 + Math.random() * 800;
        } else if (cat === 'Accessories') {
            noun = ['Mouse', 'Keypad', 'Headset', 'Audio', 'Click', 'Pad'].sort(() => Math.random() - 0.5)[0];
            priceBase = 20 + Math.random() * 150;
        } else { // Components
            noun = ['Card', 'Core', 'Ryzen', 'GeForce', 'Case', 'Drive'].sort(() => Math.random() - 0.5)[0];
            priceBase = 50 + Math.random() * 1000;
        }

        const name = `${brand} ${noun} ${adj}`;

        // Pick Image (Cyclic/Random)
        const catImages = images[cat];
        const image = catImages[Math.floor(Math.random() * catImages.length)];

        products.push({
            id: baseId + i,
            name: name,
            category: cat,
            price: parseFloat(priceBase.toFixed(2)),
            stock: Math.floor(Math.random() * 50) + 1, // Random stock 1-50
            image: image,
            description: `Experience the power of the ${name}. Features premium build quality and top-tier performance for ${cat.toLowerCase()}.`
        });
    }

    return products;
}

// Call init on load
initData();

// --- PRODUCT OPERATIONS ---

function getProducts() {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}

function getProductById(id) {
    const products = getProducts();
    // Use == to match string/number id differences
    return products.find(p => p.id == id);
}

function saveProduct(product) {
    let products = getProducts();
    if (product.id) {
        // Edit existing
        const index = products.findIndex(p => p.id == product.id);
        if (index !== -1) {
            products[index] = product;
        }
    } else {
        // Add new
        product.id = Date.now(); // Simple ID generation
        products.push(product);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function deleteProduct(id) {
    let products = getProducts();
    products = products.filter(p => p.id != id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// --- USER OPERATIONS ---

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function registerUser(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return { success: false, message: "Email already exists." };
    }
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: "user"
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, user: newUser };
}

function authenticateUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    return user || null;
}

function updateUserProfile(updatedUser) {
    let users = getUsers();
    const index = users.findIndex(u => u.email === updatedUser.email); // Assume email matches
    if (index !== -1) {
        users[index] = { ...users[index], ...updatedUser }; // Merge
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        // Also update session
        setCurrentUser(users[index]);
        return true;
    }
    return false;
}

// --- ORDER OPERATIONS ---

function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
}

function placeOrder(order) {
    const orders = getOrders();
    const products = getProducts(); // Need to update stock

    // 1. Validate Stock
    for (const item of order.items) {
        const product = products.find(p => p.id == item.id);
        if (!product || product.stock < item.quantity) {
            // In a real app we would error here, but for now we assume validation happened in UI
            // or partial fulfillment. We'll just skip decrementing if invalid to be safe.
            continue;
        }
        product.stock -= item.quantity;
    }

    // 2. Save updated products
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

    // 3. Save Order
    order.id = Date.now();
    order.date = new Date().toLocaleString();
    order.status = "Pending";
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return order;
}

function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const order = orders.find(o => o.id == orderId);
    if (order) {
        order.status = status;
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
}

function cancelOrder(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id == orderId);
    if (order && order.status === 'Pending') {
        order.status = 'Cancelled';
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        return true;
    }
    return false;
}

// --- WISHLIST OPERATIONS ---

function getWishlist() {
    // In a multi-user app, this should be keyed by User ID.
    // For this demo, we'll store a simple object: { "user_email": [id1, id2] }
    const store = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || {};
    const user = getCurrentUser();
    if (!user) return []; // No wishlist for guests
    return store[user.email] || [];
}

function toggleWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast("Please login to use Wishlist", "info");
        return false;
    }

    const store = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || {};
    let list = store[user.email] || [];

    const index = list.indexOf(productId);
    let added = false;
    if (index === -1) {
        list.push(productId);
        added = true;
    } else {
        list.splice(index, 1);
        added = false;
    }

    store[user.email] = list;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(store));
    return added; // Return status for UI update
}

function isInWishlist(productId) {
    const list = getWishlist();
    return list.includes(productId);
}

// --- REVIEWS OPERATIONS ---

function getReviews(productId) {
    const allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];
    return allReviews.filter(r => r.productId == productId);
}

function addReview(review) {
    const allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];
    review.id = Date.now();
    review.date = new Date().toLocaleDateString();
    allReviews.push(review);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
    return review;
}

// --- UI UTILITIES (TOAST) ---

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        toast.addEventListener('animationend', () => {
            if (toast.parentElement) toast.remove();
        });
    }, 3000);
}
