/**
 * auth.js
 * Handles user sessions (login/logout) and route protection.
 */

// --- SESSION MANAGEMENT ---

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart'); // Optional: clear cart on logout

    // Determine path based on current location
    const isInsideAdmin = window.location.pathname.includes('/admin/');
    window.location.href = isInsideAdmin ? '../index.html' : 'index.html';
}

// --- ROUTE PROTECTION ---

/**
 * Ensures a user is logged in.
 * Use for Order History, Checkout etc.
 */
function requireLogin() {
    const user = getCurrentUser();
    if (!user) {
        // We can't really toast here effectively if we redirect immediately, 
        // but for a SPA feel we might. 
        // Logic: just redirect. The destination page logic might handle it.
        // Or alert -> toast. 
        // Since we are replacing alerts, let's use a non-blocking approach if possible,
        // but for protection, immediate redirect is safer. 
        // We will just redirect. User context is clear.
        window.location.href = 'login.html';
    }
}

/**
 * Ensures the user is an Admin.
 * Use for Admin pages.
 */
function requireAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        // Can't stay on this page.
        window.location.href = '../admin/admin-login.html';
    }
}

// UI Helpers to show/hide login/logout buttons
function updateAuthUI() {
    const user = getCurrentUser();
    const specificLinks = document.getElementById('auth-links');
    const userDisplay = document.getElementById('user-display');

    if (!specificLinks) return;

    const cartLink = document.getElementById('cart-link');

    if (user) {
        // User is logged in
        if (user.role === 'admin') {
            // ADMIN VIEW
            if (cartLink) cartLink.style.display = 'none'; // Hide Cart for Admin

            specificLinks.innerHTML = `
                <a href="admin/dashboard.html" style="color: var(--danger-color); font-weight: bold;"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
                <a href="#" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
            `;
            if (userDisplay) userDisplay.innerHTML = `<i class="fa-solid fa-user-shield"></i> Admin`;

        } else {
            // CUSTOMER VIEW
            if (cartLink) cartLink.style.display = 'inline'; // Show Cart for User

            specificLinks.innerHTML = `
                <a href="profile.html"><i class="fa-solid fa-user"></i> Profile</a>
                <a href="wishlist.html"><i class="fa-solid fa-heart"></i> Wishlist</a>
                <a href="orders.html"><i class="fa-solid fa-box-open"></i> Orders</a>
                <a href="#" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
            `;
            if (userDisplay) userDisplay.innerHTML = `<i class="fa-solid fa-user-circle"></i> ${user.name}`;
        }
    } else {
        // GUEST VIEW
        if (cartLink) cartLink.style.display = 'inline'; // Show Cart for Guest

        specificLinks.innerHTML = `
            <a href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Login</a>
        `;
        if (userDisplay) userDisplay.textContent = '';
    }
}
