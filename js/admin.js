/**
 * admin.js
 * Logic for the Admin Panel pages.
 */

// Check Auth on all admin pages except login
if (!window.location.pathname.includes('admin-login.html')) {
    requireAdmin();
}

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on based on body ID or existing elements
    if (document.getElementById('login-form')) {
        setupLogin();
    }
    if (document.getElementById('dashboard-stats')) {
        loadDashboard();
        loadSalesChart();
    }
    if (document.getElementById('products-table')) {
        loadProductsTable();
    }
    if (document.getElementById('add-product-form')) {
        setupProductForm();
    }
    if (document.getElementById('orders-table')) {
        loadOrdersTable();
    }

    // Logout listener
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

function setupLogin() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const user = authenticateUser(email, password);

        if (user && user.role === 'admin') {
            setCurrentUser(user);
            window.location.href = 'dashboard.html';
        } else {
            showToast('Invalid credentials or not an admin.', 'error');
        }
    });
}

function loadDashboard() {
    const products = getProducts();
    const orders = getOrders();
    const users = getUsers();

    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    document.getElementById('total-products').textContent = products.length;
    document.getElementById('total-orders').textContent = orders.length;
    document.getElementById('total-users').textContent = users.length; // Optional
    document.getElementById('total-revenue').textContent = '$' + revenue.toFixed(2);
}

function loadSalesChart() {
    const orders = getOrders();
    const ctx = document.getElementById('salesChart').getContext('2d');

    // Group orders by Status for a Pie/Doughnut Chart
    const statusCounts = { 'Pending': 0, 'Packed': 0, 'Shipped': 0, 'Delivered': 0, 'Cancelled': 0 };
    orders.forEach(o => {
        if (statusCounts[o.status] !== undefined) {
            statusCounts[o.status]++;
        }
    });

    // Check if we have any data
    const totalOrders = orders.length;
    if (totalOrders === 0) {
        // Display a "No Data" message
        const container = document.getElementById('salesChart').parentElement;
        container.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#999;">No order data available for chart.</div>';
        return;
    }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: '# of Orders',
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#f1c40f', // Pending
                    '#3498db', // Packed
                    '#9b59b6', // Shipped
                    '#2ecc71', // Delivered
                    '#e74c3c'  // Cancelled
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// --- PRODUCTS MANAGEMENT ---

function loadProductsTable() {
    const products = getProducts();
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.image}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price}</td>
            <td>${product.stock}</td>
            <td>
                <a href="add-product.html?id=${product.id}" class="btn btn-secondary action-btn">Edit</a>
                <button onclick="deleteProductHandler(${product.id})" class="btn btn-danger action-btn">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Make globally available for onclick
window.deleteProductHandler = function (id) {
    if (confirm('Are you sure you want to delete this product?')) {
        deleteProduct(id);
        loadProductsTable(); // Refresh
    }
};

function setupProductForm() {
    const form = document.getElementById('add-product-form');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        // Edit Mode
        document.getElementById('form-title').textContent = 'Edit Product';
        document.getElementById('submit-btn').textContent = 'Update Product';
        const product = getProductById(productId);
        if (product) {
            document.getElementById('name').value = product.name;
            document.getElementById('price').value = product.price;
            document.getElementById('category').value = product.category;
            document.getElementById('stock').value = product.stock;
            document.getElementById('image').value = product.image;
            document.getElementById('description').value = product.description;
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newProduct = {
            id: productId ? productId : null, // handle existing ID
            name: document.getElementById('name').value,
            price: parseFloat(document.getElementById('price').value),
            category: document.getElementById('category').value,
            stock: parseInt(document.getElementById('stock').value),
            image: document.getElementById('image').value,
            description: document.getElementById('description').value
        };

        saveProduct(newProduct);
        showToast('Product saved successfully!', 'success');
        setTimeout(() => window.location.href = 'manage-products.html', 1500);
    });
}

// --- ORDERS MANAGEMENT ---

function loadOrdersTable() {
    const orders = getOrders();
    // Sort by date new to old
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const tr = document.createElement('tr');

        // Safely getting user name simply (in real app, join with users)
        // Here we just use what might be in order or just ID
        // Note: implementation of placeOrder should include userName for convenience or we look it up

        // Dropdown for status
        const statusOptions = ['Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled']
            .map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`)
            .join('');

        tr.innerHTML = `
            <td>${order.id}</td>
            <td>User #${order.userId}</td> 
            <td>${order.date}</td>
            <td>$${order.totalAmount}</td>
            <td>
                <select onchange="updateStatusHandler(${order.id}, this.value)" style="padding:5px;">
                    ${statusOptions}
                </select>
            </td>
            <td>
                <button onclick="viewOrderDetails(${order.id})" class="btn btn-secondary action-btn">View Items</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateStatusHandler = function (id, newStatus) {
    updateOrderStatus(id, newStatus);
    showToast(`Order #${id} status updated to ${newStatus}`, 'info');
}

window.viewOrderDetails = function (id) {
    const orders = getOrders();
    const order = orders.find(o => o.id == id);
    if (order) {
        const modal = document.getElementById('order-modal');
        const listContainer = document.getElementById('modal-items-list');

        if (modal && listContainer) {
            listContainer.innerHTML = order.items.map(i => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <a href="../product.html?id=${i.id}&from_admin=true" target="_blank" style="font-weight: 600; color: var(--primary-color); text-decoration: underline;">
                            ${i.name} <i class="fa-solid fa-external-link-alt" style="font-size: 0.8em;"></i>
                        </a>
                        <span style="color: #666; font-size: 0.9em; margin-left: 10px;">(Category: ${i.category || 'N/A'})</span>
                    </div>
                    <span>x${i.quantity}</span>
                </div>
            `).join('');

            modal.style.display = 'block';

            // Close when clicking outside
            window.onclick = function (event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }
        } else {
            // Fallback
            const itemsList = order.items.map(i => `${i.name} (x${i.quantity})`).join('\n');
            alert(`Order Items:\n${itemsList}`);
        }
    }
}
