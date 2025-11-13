class Cart {
    constructor() {
        this.items = this.loadCart();
    }

    loadCart() {
        const cart = localStorage.getItem('beliversCart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem('beliversCart', JSON.stringify(this.items));
    }

    addItem(product, size, quantity = 1) {
        const existingItem = this.items.find(item =>
            item.id === product.id && item.size === size
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                size: size,
                quantity: quantity,
                image: product.image
            });
        }
        this.saveCart();
        this.updateCartCount();
    }

    removeItem(productId, size) {
        this.items = this.items.filter(item =>
            !(item.id === productId && item.size === size)
        );
        this.saveCart();
        this.updateCartCount();
    }

    updateQuantity(productId, size, quantity) {
        const item = this.items.find(item =>
            item.id === productId && item.size === size
        );

        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId, size);
            } else {
                item.quantity = quantity;
            }
            this.saveCart();
            this.updateCartCount();
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.getCount();
        }
    }

    clear() {
        this.items = [];
        this.saveCart();
        this.updateCartCount();
    }
}

// Initialize cart
const cart = new Cart();

// Utility functions
const utils = {
    formatPrice(price) {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(price);
    },

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.prepend(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Product management
const productManager = {
    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    },

    renderProducts(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="col-md-6 col-lg-4">
                <div class="card product-card h-100">
                    <img src="${product.image}" class="card-img-top product-image" alt="${product.name}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text flex-grow-1">${product.description}</p>
                        <div class="mt-auto">
                            <p class="product-price">${utils.formatPrice(product.price)}</p>
                            <div class="mb-2">
                                <small class="text-muted">Sizes: ${product.sizes.join(', ')}</small>
                            </div>
                            <button class="btn btn-primary w-100" onclick="productManager.openProductModal(${product.id})">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    async openProductModal(productId) {
        const products = await this.loadProducts();
        const product = products.find(p => p.id === productId);

        if (!product) return;

        const modalHtml = `
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${product.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <img src="${product.image}" class="img-fluid" alt="${product.name}">
                                </div>
                                <div class="col-md-6">
                                    <p>${product.description}</p>
                                    <p class="product-price fs-4">${utils.formatPrice(product.price)}</p>
                                    <div class="mb-3">
                                        <label class="form-label">Select Size:</label>
                                        <select class="form-select" id="productSize">
                                            ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Quantity:</label>
                                        <input type="number" class="form-control" id="productQuantity" value="1" min="1">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="cartManager.addToCartFromModal(${product.id})">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('productModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }
};

// Cart management
const cartManager = {
    addToCartFromModal(productId) {
        const size = document.getElementById('productSize').value;
        const quantity = parseInt(document.getElementById('productQuantity').value);

        productManager.loadProducts().then(products => {
            const product = products.find(p => p.id === productId);
            if (product) {
                cart.addItem(product, size, quantity);
                utils.showAlert(`${product.name} added to cart!`, 'success');

                const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                modal.hide();
            }
        });
    },

    renderCartItems() {
        const container = document.getElementById('cartItems');
        const totalElement = document.getElementById('cartTotal');

        if (!container) return;

        if (cart.items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h4>Your cart is empty</h4>
                    <p>Browse our store to add items to your cart</p>
                    <a href="/store" class="btn btn-primary">Go Shopping</a>
                </div>
            `;
            if (totalElement) totalElement.textContent = utils.formatPrice(0);
            return;
        }

        container.innerHTML = cart.items.map(item => `
            <div class="cart-item">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${item.image}" class="cart-item-image" alt="${item.name}">
                    </div>
                    <div class="col-md-4">
                        <h6>${item.name}</h6>
                        <small class="text-muted">Size: ${item.size}</small>
                    </div>
                    <div class="col-md-2">
                        <p class="product-price">${utils.formatPrice(item.price)}</p>
                    </div>
                    <div class="col-md-2">
                        <div class="d-flex align-items-center">
                            <button class="quantity-btn" onclick="cartManager.updateItemQuantity(${item.id}, '${item.size}', ${item.quantity - 1})">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                                   onchange="cartManager.updateItemQuantity(${item.id}, '${item.size}', parseInt(this.value))">
                            <button class="quantity-btn" onclick="cartManager.updateItemQuantity(${item.id}, '${item.size}', ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-danger btn-sm" 
                                onclick="cartManager.removeItem(${item.id}, '${item.size}')">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (totalElement) {
            totalElement.textContent = utils.formatPrice(cart.getTotal());
        }
    },

    updateItemQuantity(productId, size, quantity) {
        cart.updateQuantity(productId, size, quantity);
        this.renderCartItems();
    },

    removeItem(productId, size) {
        cart.removeItem(productId, size);
        this.renderCartItems();
    },

    checkoutViaWhatsApp() {
        if (cart.items.length === 0) {
            utils.showAlert('Your cart is empty!', 'warning');
            return;
        }

        const phoneNumber = '08052443377';
        let message = `Hello Belivers Fashion Brand! I would like to place an order:\n\n`;

        cart.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name} (Size: ${item.size}) - ${item.quantity} x ${utils.formatPrice(item.price)}\n`;
        });

        message += `\nTotal: ${utils.formatPrice(cart.getTotal())}\n`;
        message += `\nPlease contact me to complete the order.`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Update cart count
    cart.updateCartCount();

    // Load products on store page
    if (document.getElementById('productsContainer')) {
        productManager.loadProducts().then(products => {
            productManager.renderProducts(products, 'productsContainer');
        });
    }

    // Render cart items on cart page
    if (document.getElementById('cartItems')) {
        cartManager.renderCartItems();
    }

    // Filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', utils.debounce(async function () {
            const category = this.value;
            const products = await productManager.loadProducts();
            const filteredProducts = category === 'all' ? products : products.filter(p => p.category === category);
            productManager.renderProducts(filteredProducts, 'productsContainer');
        }, 300));
    }
});