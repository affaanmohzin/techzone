const PRODUCTS = [
  {
    id: "phone-nova",
    name: "Nova X Pro Smartphone",
    category: "smartphones",
    categoryLabel: "Smartphones",
    price: 184999,
    rating: "4.9",
    description: "A brilliant AMOLED display, pro-level camera, and fast all-day performance.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82",
    imageAlt: "Modern smartphone with a vivid screen"
  },
  {
    id: "laptop-air",
    name: "NovaBook Air 14",
    category: "laptops",
    categoryLabel: "Laptops",
    price: 249999,
    rating: "4.8",
    description: "A lightweight everyday laptop with a sharp display and responsive performance.",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=82",
    imageAlt: "Slim laptop open on a desk"
  },
  {
    id: "headphones-sonic",
    name: "SonicFlow Wireless Headphones",
    category: "audio",
    categoryLabel: "Headphones",
    price: 32999,
    rating: "4.8",
    description: "Comfortable over-ear listening with rich sound and active noise cancellation.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82",
    imageAlt: "Premium wireless over-ear headphones"
  },
  {
    id: "watch-pulse",
    name: "PulseFit Smartwatch",
    category: "wearables",
    categoryLabel: "Smartwatches",
    price: 42999,
    rating: "4.7",
    description: "Keep your day on track with fitness insights, helpful alerts, and GPS.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82",
    imageAlt: "Minimal smartwatch with a dark face"
  },
  {
    id: "keyboard-arc",
    name: "Arc Mechanical Keyboard",
    category: "accessories",
    categoryLabel: "Keyboards",
    price: 18999,
    rating: "4.7",
    description: "Tactile mechanical switches and a compact layout for a more satisfying desk.",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=82",
    imageAlt: "Mechanical keyboard on a clean desk"
  },
  {
    id: "earbuds-air",
    name: "AirBeat Wireless Earbuds",
    category: "audio",
    categoryLabel: "Wireless Earbuds",
    price: 14999,
    rating: "4.6",
    description: "Pocket-sized wireless audio with a comfortable fit and clear call quality.",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=82",
    imageAlt: "Compact wireless earbuds and charging case"
  }
];

const CART_STORAGE_KEY = "techzone_cart";
const money = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  currencyDisplay: "code",
  maximumFractionDigits: 0
});

const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const cartDrawer = document.querySelector("#cart-drawer");
const cartOverlay = document.querySelector("#cart-overlay");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartSubtotal = document.querySelector("#cart-subtotal");
const checkoutItems = document.querySelector("#checkout-items");
const checkoutSubtotal = document.querySelector("#checkout-subtotal");
const checkoutTotal = document.querySelector("#checkout-total");
const checkoutForm = document.querySelector("#checkout-form");
const phoneInput = checkoutForm.elements.phone;
const toast = document.querySelector("#toast");
const menuToggle = document.querySelector("#menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

let activeCategory = "all";
let cart = loadCart();
let toastTimer;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(savedCart)) return [];
    return savedCart
      .filter(item => PRODUCTS.some(product => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0)
      .map(item => ({ id: item.id, quantity: item.quantity }));
  } catch (error) {
    console.warn("Could not restore the saved cart; starting with an empty cart.", error);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Could not save the cart in this browser.", error);
    showToast("Your cart works for this visit, but could not be saved.");
  }
}

function getCartProducts() {
  return cart
    .map(cartItem => {
      const product = PRODUCTS.find(item => item.id === cartItem.id);
      return product ? { ...product, quantity: cartItem.quantity } : null;
    })
    .filter(Boolean);
}

function getSubtotal() {
  return getCartProducts().reduce((total, product) => total + product.price * product.quantity, 0);
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visibleProducts = PRODUCTS.filter(product => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const searchableText = `${product.name} ${product.categoryLabel} ${product.description}`.toLocaleLowerCase();
    return matchesCategory && searchableText.includes(query);
  });

  productGrid.innerHTML = visibleProducts.map(product => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.imageAlt}" loading="lazy">
        <span class="product-category-label">${product.categoryLabel}</span>
      </div>
      <div class="product-info">
        <div class="product-title-row">
          <h3>${product.name}</h3>
          <span class="rating" aria-label="Rated ${product.rating} out of 5">★ ${product.rating} <span>/ 5</span></span>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-card-footer">
          <span class="product-price">${money.format(product.price)}</span>
          <button class="add-button" type="button" data-add-id="${product.id}" aria-label="Add ${product.name} to cart">Add to Cart <span aria-hidden="true">+</span></button>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelector("#result-count").textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"}`;
  document.querySelector("#no-results").hidden = visibleProducts.length !== 0;
}

function renderCart() {
  const items = getCartProducts();
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = getSubtotal();

  cartCount.textContent = String(count);
  cartCount.setAttribute("aria-label", `${count} ${count === 1 ? "item" : "items"} in cart`);
  cartSubtotal.textContent = money.format(subtotal);
  checkoutSubtotal.textContent = money.format(subtotal);
  checkoutTotal.textContent = money.format(subtotal);

  cartItems.innerHTML = items.length
    ? items.map(item => `
        <article class="cart-item">
          <img src="${item.image}" alt="">
          <div>
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">${money.format(item.price)} each</span>
            <div class="cart-item-actions" aria-label="Quantity for ${item.name}">
              <button class="quantity-button" type="button" data-quantity-id="${item.id}" data-change="-1" aria-label="Decrease ${item.name} quantity">−</button>
              <span class="quantity-value">${item.quantity}</span>
              <button class="quantity-button" type="button" data-quantity-id="${item.id}" data-change="1" aria-label="Increase ${item.name} quantity">+</button>
              <button class="remove-button" type="button" data-remove-id="${item.id}">Remove</button>
            </div>
          </div>
          <span class="cart-line-total">${money.format(item.price * item.quantity)}</span>
        </article>
      `).join("")
    : '<p class="cart-empty-state">Your cart is empty.<br>Explore the products and find your next favorite.</p>';

  checkoutItems.innerHTML = items.length
    ? items.map(item => `
        <div class="summary-item">
          <span>${item.name} × ${item.quantity}</span>
          <strong>${money.format(item.price * item.quantity)}</strong>
        </div>
      `).join("")
    : '<p class="summary-empty">Your cart is empty.</p>';

  document.querySelector("#place-order").disabled = items.length === 0;
  document.querySelector("#place-order").classList.toggle("button-disabled", items.length === 0);
}

function updateCart() {
  saveCart();
  renderCart();
}

function addToCart(productId) {
  const product = PRODUCTS.find(item => item.id === productId);
  if (!product) return;

  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) cartItem.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });

  updateCart();
  showToast(`${product.name} added to your cart.`);
}

function changeQuantity(productId, change) {
  const cartItem = cart.find(item => item.id === productId);
  if (!cartItem) return;

  cartItem.quantity += change;
  if (cartItem.quantity <= 0) cart = cart.filter(item => item.id !== productId);
  updateCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCart();
  showToast("Product removed from your cart.");
}

function setCartOpen(isOpen) {
  cartDrawer.classList.toggle("open", isOpen);
  cartOverlay.classList.toggle("open", isOpen);
  cartDrawer.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("cart-open", isOpen);
  if (isOpen) document.querySelector("#cart-close").focus();
  else document.querySelector("#cart-toggle").focus();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add-id]");
  if (button) addToCart(button.dataset.addId);
});

cartItems.addEventListener("click", event => {
  const quantityButton = event.target.closest("[data-quantity-id]");
  if (quantityButton) {
    changeQuantity(quantityButton.dataset.quantityId, Number(quantityButton.dataset.change));
    return;
  }

  const removeButton = event.target.closest("[data-remove-id]");
  if (removeButton) removeFromCart(removeButton.dataset.removeId);
});

searchInput.addEventListener("input", renderProducts);

document.querySelector("#category-filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  activeCategory = button.dataset.category;
  filterButtons.forEach(filterButton => {
    const selected = filterButton === button;
    filterButton.classList.toggle("active", selected);
    filterButton.setAttribute("aria-pressed", String(selected));
  });
  renderProducts();
});

document.querySelectorAll("[data-footer-category]").forEach(link => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.footerCategory;
    filterButtons.forEach(button => {
      const selected = button.dataset.category === activeCategory;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    renderProducts();
  });
});

document.querySelector("#cart-toggle").addEventListener("click", () => setCartOpen(true));
document.querySelector("#cart-close").addEventListener("click", () => setCartOpen(false));
cartOverlay.addEventListener("click", () => setCartOpen(false));
document.querySelector("#go-to-checkout").addEventListener("click", () => setCartOpen(false));

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) setCartOpen(false);
});

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  primaryNav.classList.toggle("open", !isExpanded);
});

primaryNav.addEventListener("click", event => {
  if (event.target.closest("a")) {
    primaryNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});

checkoutForm.addEventListener("submit", event => {
  event.preventDefault();
  const message = document.querySelector("#order-message");
  message.textContent = "";

  if (!checkoutForm.reportValidity()) return;
  if (cart.length === 0) {
    message.textContent = "Add a product to your cart before placing an order.";
    return;
  }

  const orderNumber = Math.floor(100000 + Math.random() * 900000);
  cart = [];
  updateCart();
  checkoutForm.reset();
  message.textContent = `Thank you! Demo order #${orderNumber} has been placed. No payment was processed.`;
});

phoneInput.addEventListener("input", () => {
  const phone = phoneInput.value.trim();
  const validPhone = /^[+0-9()\s-]{7,20}$/.test(phone);
  phoneInput.setCustomValidity(phone && !validPhone ? "Enter a valid phone number using digits, spaces, parentheses, or +." : "");
});

renderProducts();
renderCart();
