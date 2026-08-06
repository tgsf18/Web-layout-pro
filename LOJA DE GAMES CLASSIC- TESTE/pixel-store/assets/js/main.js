// JavaScript code for interactive features of the Pixel Store e-commerce site

// Function to toggle the shopping cart drawer
const toggleCartDrawer = () => {
    const cartDrawer = document.getElementById('cart-drawer');
    cartDrawer.classList.toggle('hidden');
};

// Function to update the cart item count
const updateCartCount = (count) => {
    const cartCountBadge = document.getElementById('cart-count');
    cartCountBadge.textContent = count;
};

// Function to handle adding items to the cart
const addToCart = (productId) => {
    // Logic to add the product to the cart
    // This is a placeholder for actual cart logic
    console.log(`Product ${productId} added to cart`);
    // Update cart count (this is just a placeholder value)
    updateCartCount(1);
};

// Event listeners for cart toggle and add to cart buttons
document.addEventListener('DOMContentLoaded', () => {
    const cartButton = document.getElementById('cart-button');
    cartButton.addEventListener('click', toggleCartDrawer);

    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            addToCart(productId);
        });
    });
});