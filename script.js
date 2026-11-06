"use strict";

const CURRENCY = "$";
const STORAGE_KEYS = {
  cart: "voltix-cart",
  products: "voltix-user-products",
  accounts: "voltix-accounts",
  session: "voltix-session",
  theme: "voltix-theme"
};

const categories = {
  "Смартфоны":         { icon: "📱", tint: "#dfe8ff" },
  "Ноутбуки":          { icon: "💻", tint: "#e3f3e6" },
  "Телевизоры":        { icon: "📺", tint: "#ffe9d6" },
  "Наушники":          { icon: "🎧", tint: "#f1e4fb" },
  "Бытовая техника":   { icon: "🤖", tint: "#fff3c9" },
  "Игровые приставки": { icon: "🎮", tint: "#ffdede" },
  "Аксессуары":        { icon: "⌚", tint: "#dcf3f5" }
};


const baseProducts = [
  { id: 1,  name: "Смартфон Nova X",          category: "Смартфоны",         price: 499,  image: "images/novax.jpg",    description: "Экран AMOLED 6,5″, 128 ГБ, тройная камера." },
  { id: 2,  name: "Смартфон Pixel Lite",      category: "Смартфоны",         price: 349,  image: "images/pixel.jpg",    description: "Компактный, 6 ГБ памяти, быстрая зарядка." },
  { id: 3,  name: "Ноутбук AirBook 14",       category: "Ноутбуки",          price: 899,  image: "images/airbook.jpg",  description: "Лёгкий, 16 ГБ ОЗУ, SSD 512 ГБ, до 12 часов работы." },
  { id: 4,  name: "Игровой ноутбук Titan 16", category: "Ноутбуки",          price: 1399, image: "images/titan.jpg",    description: "Видеокарта RTX, экран 165 Гц, 32 ГБ ОЗУ." },
  { id: 5,  name: "Телевизор Vision 55″ 4K",  category: "Телевизоры",        price: 599,  image: "images/vision.jpg",   description: "Диагональ 55″, HDR, Smart TV, три порта HDMI." },
  { id: 6,  name: "Наушники Beat Air",        category: "Наушники",          price: 129,  image: "images/beat.jpg",     description: "Беспроводные, шумоподавление, 30 часов звука." },
  { id: 7,  name: "Наушники Studio Pro",      category: "Наушники",          price: 249,  image: "images/beat.jpg",     description: "Накладные, студийный звук, съёмный кабель." },
  { id: 8,  name: "Приставка PlayBox S",      category: "Игровые приставки", price: 449,  image: "images/playbox.jpg",  description: "4K-игры, SSD 1 ТБ, геймпад в комплекте." },
  { id: 9,  name: "Робот-пылесос CleanBot",   category: "Бытовая техника",   price: 279,  image: "images/clean.jpg",    description: "Влажная уборка, карта комнат, управление с телефона." },
  { id: 10, name: "Кофемашина Barista 15",    category: "Бытовая техника",   price: 329,  image: "images/coffee.jpg",   description: "Давление 15 бар, капучинатор, два режима помола." },
  { id: 11, name: "Powerbank 20 000 мАч",     category: "Аксессуары",        price: 39,   image: "images/powerbank.jpg",description: "Два порта USB-C, быстрая зарядка 45 Вт." },
  { id: 12, name: "Умные часы Pulse 2",       category: "Аксессуары",        price: 159,  image: "images/pulse.jpg",    description: "Пульс, сон, GPS, влагозащита, 7 дней без зарядки." }
];

const $ = (id) => document.getElementById(id);
const money = (value) => CURRENCY + Number(value || 0).toLocaleString("ru-RU", {
  minimumFractionDigits: Number(value) % 1 ? 2 : 0,
  maximumFractionDigits: 2
});
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.warn(`Не удалось прочитать ${key}:`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Не удалось сохранить ${key}:`, error);
    showToast("Не удалось сохранить данные. Возможно, память браузера заполнена.", "error");
    return false;
  }
}

function loadUserProducts() {
  const saved = readStorage(STORAGE_KEYS.products, []);
  if (!Array.isArray(saved)) return [];
  return saved.filter((product) => product && product.id && categories[product.category]);
}

function loadAccounts() {
  const saved = readStorage(STORAGE_KEYS.accounts, []);
  return Array.isArray(saved) ? saved.filter((account) => account && account.id && account.email) : [];
}

let cart = readStorage(STORAGE_KEYS.cart, {});
if (!cart || typeof cart !== "object" || Array.isArray(cart)) cart = {};
let userProducts = loadUserProducts();
let products = [...baseProducts, ...userProducts];
let accounts = loadAccounts();
let currentUser = null;
const storedSession = readStorage(STORAGE_KEYS.session, null);
if (storedSession && storedSession.userId) {
  currentUser = accounts.find((account) => account.id === storedSession.userId) || null;
}

let activeCategory = "Все";
let searchQuery = "";
let sortMode = "default";
let authMode = "login";
let editingProductId = null;
let toastTimer = null;
let currentPage = "catalog";
let productReturnPage = "catalog";

const productsEl = $("products");
const filtersEl = $("filters");
const heroCatsEl = $("hero-categories");
const titleEl = $("catalog-title");
const cartEl = $("cart");
const cartItemsEl = $("cart-items");
const cartTotalEl = $("cart-total");
const cartCountEl = $("cart-count");
const checkoutBtn = $("checkout-btn");
const overlayEl = $("overlay");
const modalEl = $("modal");
const orderForm = $("order-form");
const orderSuccess = $("order-success");
const authModal = $("auth-modal");
const priceModal = $("price-modal");
const accountMenu = $("account-menu");
const accountOverlay = $("account-overlay");

function showToast(message, type = "success") {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast is-visible ${type === "error" ? "toast--error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function safeImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:\/\/|\.\.?\/|images\/)/i.test(url)) return url;
  return "";
}

function productImage(product) {
  const image = safeImageUrl(product.image);
  if (image) {
    const fallbackIcon = categories[product.category]?.icon || "📦";
    return `<img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}" data-fallback="${escapeHTML(fallbackIcon)}" loading="lazy">`;
  }
  return `<span aria-hidden="true">${categories[product.category]?.icon || "📦"}</span>`;
}

function bindImageFallbacks(root) {
  root.querySelectorAll("img[data-fallback]").forEach((image) => {
    image.addEventListener("error", () => {
      const fallback = document.createElement("span");
      fallback.setAttribute("aria-hidden", "true");
      fallback.textContent = image.dataset.fallback || "📦";
      image.replaceWith(fallback);
    }, { once: true });
  });
}

function getProduct(id) {
  return products.find((product) => String(product.id) === String(id));
}

function saveCart() {
  writeStorage(STORAGE_KEYS.cart, cart);
}

function saveUserProducts() {
  userProducts = products.filter((product) => product.ownerId);
  return writeStorage(STORAGE_KEYS.products, userProducts);
}

function saveAccounts() {
  return writeStorage(STORAGE_KEYS.accounts, accounts);
}

function initials(name) {
  const value = String(name || "V").trim();
  return escapeHTML((value[0] || "V").toUpperCase());
}

function avatarMarkup(user, className = "avatar", elementId = "") {
  const idAttribute = elementId ? ` id="${escapeHTML(elementId)}"` : "";
  const avatarUrl = safeImageUrl(user?.avatar);
  if (avatarUrl) {
    return `<img${idAttribute} class="${className}" src="${escapeHTML(avatarUrl)}" alt="Аватар ${escapeHTML(user.nickname)}">`;
  }
  return `<span${idAttribute} class="${className}" aria-hidden="true">${initials(user?.nickname)}</span>`;
}

function renderAccount() {
  const guest = $("account-guest");
  const userBlock = $("account-user");
  if (!currentUser) {
    guest.hidden = false;
    userBlock.hidden = true;
    return;
  }

  guest.hidden = true;
  userBlock.hidden = false;
  $("account-avatar").outerHTML = avatarMarkup(currentUser, "avatar", "account-avatar");
  $("account-nickname").textContent = currentUser.nickname;
  $("menu-avatar").outerHTML = avatarMarkup(currentUser, "avatar avatar--large", "menu-avatar");
  $("menu-nickname").textContent = currentUser.nickname;
  $("menu-email").textContent = currentUser.email;
}

function sellerMarkup(product) {
  if (!product.ownerId) {
    return `
      <div class="seller-card">
        <div class="seller-brand-logo" aria-label="Логотип Voltix">V</div>
        <div class="seller-card__info">
          <span class="seller-card__label">Продавец</span>
          <strong>Voltix — магазин электроники</strong>
          <span class="seller-card__note">Официальный продавец магазина</span>
        </div>
      </div>`;
  }

  const owner = accounts.find((account) => account.id === product.ownerId);
  const nickname = owner?.nickname || product.ownerName || "Пользователь Voltix";
  const avatar = safeImageUrl(owner?.avatar || product.ownerAvatar || "");
  const avatarView = avatar
    ? `<img class="seller-avatar" src="${escapeHTML(avatar)}" alt="Аватар ${escapeHTML(nickname)}">`
    : `<span class="seller-avatar seller-avatar--initial" aria-hidden="true">${initials(nickname)}</span>`;

  return `
    <div class="seller-card">
      ${avatarView}
      <div class="seller-card__info">
        <span class="seller-card__label">Продавец</span>
        <strong>${escapeHTML(nickname)}</strong>
        <span class="seller-card__note">Пользователь Voltix</span>
      </div>
    </div>`;
}

function renderProductDetails(product) {
  const category = categories[product.category] || { icon: "📦", tint: "#e7ecf5" };
  const image = safeImageUrl(product.image);
  const media = image
    ? `<img class="product-detail__image" src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">`
    : `<div class="product-detail__placeholder" style="--tint:${category.tint}" aria-label="Изображение не добавлено">${category.icon}</div>`;

  $("product-detail-content").innerHTML = `
    <article class="product-detail">
      <div class="product-detail__media">${media}</div>
      <div class="product-detail__info">
        <span class="product-detail__category">${escapeHTML(product.category)}</span>
        <h1>${escapeHTML(product.name)}</h1>
        <p class="product-detail__description">${escapeHTML(product.description)}</p>
        <div class="product-detail__purchase">
          <strong class="product-detail__price">${money(product.price)}</strong>
          <button class="btn" type="button" data-add="${escapeHTML(product.id)}">Добавить в корзину</button>
        </div>
        ${sellerMarkup(product)}
      </div>
    </article>`;
  bindImageFallbacks($("product-detail-content"));
}

function openProduct(productId, pushHistory = true) {
  const product = getProduct(productId);
  if (!product) {
    showToast("Этот товар больше недоступен.", "error");
    showCatalog(false);
    return;
  }

  productReturnPage = currentPage === "my-products" ? "my-products" : "catalog";
  closeAccountMenu();
  closeCart();
  if (pushHistory) {
    const nextUrl = `${window.location.pathname}${window.location.search}#product=${encodeURIComponent(String(product.id))}`;
    window.history.pushState({ view: "product", productId: product.id }, "", nextUrl);
  }
  currentPage = "product";
  $("hero").hidden = true;
  $("catalog").hidden = true;
  $("my-products-page").hidden = true;
  $("create-product-page").hidden = true;
  $("product-detail-page").hidden = false;
  $("search").value = "";
  renderProductDetails(product);
  document.title = `${product.name} — Voltix`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncPageFromUrl() {
  const match = window.location.hash.match(/^#product=(.+)$/);
  if (match) {
    let productId = match[1];
    try { productId = decodeURIComponent(productId); } catch (_) { /* use encoded id */ }
    openProduct(productId, false);
  } else {
    showCatalog(false);
  }
}

function applyTheme(theme, persist = true) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  const button = $("theme-toggle");
  if (button) {
    const dark = normalized === "dark";
    button.querySelector(".theme-btn__icon").textContent = dark ? "☀️" : "🌙";
    button.querySelector(".theme-btn__label").textContent = dark ? "Светлая" : "Тёмная";
    button.setAttribute("aria-label", dark ? "Включить светлую тему" : "Включить тёмную тему");
    button.title = dark ? "Включить светлую тему" : "Включить тёмную тему";
  }
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = normalized === "dark" ? "#111827" : "#ffffff";
  if (persist) {
    try { localStorage.setItem(STORAGE_KEYS.theme, normalized); } catch (error) { console.warn("Не удалось сохранить тему:", error); }
  }
}

function initTheme() {
  let savedTheme = "light";
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (storedTheme === "dark" || storedTheme === "light") savedTheme = storedTheme;
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) savedTheme = "dark";
  } catch (error) {
    console.warn("Не удалось прочитать тему:", error);
  }
  applyTheme(savedTheme, false);
}

function renderFilters() {
  const names = ["Все", ...Object.keys(categories)];
  filtersEl.innerHTML = names.map((name) => `
    <button class="chip ${name === activeCategory ? "is-active" : ""}" type="button" data-category="${escapeHTML(name)}">${escapeHTML(name)}</button>
  `).join("");

  heroCatsEl.innerHTML = Object.keys(categories).map((name) => `
    <button class="hero__cat" type="button" data-category="${escapeHTML(name)}">
      <span aria-hidden="true">${categories[name].icon}</span> ${escapeHTML(name)}
    </button>
  `).join("");
}

function getVisibleProducts() {
  let list = products.filter((product) => {
    const matchesCategory = activeCategory === "Все" || product.category === activeCategory;
    const searchable = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return matchesCategory && searchable.includes(searchQuery);
  });
  if (sortMode === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sortMode === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

function productCard(product, index, ownerControls = false) {
  const category = categories[product.category] || { icon: "📦", tint: "#e7ecf5" };
  const ownBadge = product.ownerId ? `<span class="product-badge">Товар пользователя</span>` : "";
  const controls = ownerControls ? `
    <div class="owner-controls">
      <button class="btn btn--small btn--light" type="button" data-edit-price="${escapeHTML(product.id)}">Изменить цену</button>
      <button class="btn btn--small btn--danger" type="button" data-delete-product="${escapeHTML(product.id)}">Удалить</button>
    </div>` : "";

  return `
    <article class="card" style="--i:${Math.min(index, 8)}" data-product-card="${escapeHTML(product.id)}" tabindex="0" role="link" aria-label="Подробнее о товаре: ${escapeHTML(product.name)}">
      <div class="card__stage" style="--tint:${category.tint}">${productImage(product)}</div>
      <div class="card__body">
        <div class="card__meta"><span class="card__cat">${escapeHTML(product.category)}</span>${ownBadge}</div>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="card__desc">${escapeHTML(product.description)}</p>
        <div class="card__bottom">
          <span class="price">${money(product.price)}</span>
          ${ownerControls ? "" : `<button class="btn" type="button" data-add="${escapeHTML(product.id)}">В корзину</button>`}
        </div>
        ${controls}
      </div>
    </article>`;
}

function renderProducts() {
  const list = getVisibleProducts();
  titleEl.textContent = activeCategory === "Все" ? "Все товары" : activeCategory;
  if (list.length === 0) {
    productsEl.innerHTML = `<p class="empty">Ничего не найдено. Измените запрос или выберите другую категорию.</p>`;
    return;
  }
  productsEl.innerHTML = list.map((product, index) => productCard(product, index)).join("");
  bindImageFallbacks(productsEl);
}

function renderMyProducts() {
  const grid = $("my-products-grid");
  const mine = currentUser ? products.filter((product) => product.ownerId === currentUser.id) : [];
  if (mine.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📦</div>
        <h2>Вы ещё не добавили товары</h2>
        <p>Создайте первую карточку товара — она появится в общем каталоге.</p>
        <button class="btn" type="button" data-page="create">Добавить товар</button>
      </div>`;
    return;
  }
  grid.innerHTML = mine.map((product, index) => productCard(product, index, true)).join("");
  bindImageFallbacks(grid);
}

function getTotals() {
  let total = 0;
  let count = 0;
  for (const id of Object.keys(cart)) {
    const product = getProduct(id);
    const quantity = Number(cart[id]);
    if (!product || !Number.isFinite(quantity) || quantity <= 0) continue;
    total += product.price * quantity;
    count += quantity;
  }
  return { total, count };
}

function renderCart() {
  const ids = Object.keys(cart).filter((id) => getProduct(id) && Number(cart[id]) > 0);
  cartItemsEl.innerHTML = ids.length ? ids.map((id) => {
    const product = getProduct(id);
    const category = categories[product.category] || { tint: "#e7ecf5" };
    return `
      <div class="cart-item">
        <div class="cart-item__icon" style="--tint:${category.tint}">${productImage(product)}</div>
        <div class="cart-item__details">
          <div class="cart-item__name">${escapeHTML(product.name)}</div>
          <div class="cart-item__price">${money(product.price)}</div>
        </div>
        <div class="cart-item__side">
          <div class="qty">
            <button type="button" data-dec="${escapeHTML(id)}" aria-label="Уменьшить количество">−</button>
            <span>${Number(cart[id])}</span>
            <button type="button" data-inc="${escapeHTML(id)}" aria-label="Увеличить количество">+</button>
          </div>
          <button class="link-btn" type="button" data-remove="${escapeHTML(id)}">Удалить</button>
        </div>
      </div>`;
  }).join("") : `<p class="empty">В корзине пока пусто. Добавьте товар из каталога.</p>`;

  bindImageFallbacks(cartItemsEl);
  const { total, count } = getTotals();
  cartTotalEl.textContent = money(total);
  cartCountEl.textContent = count;
  checkoutBtn.disabled = count === 0;
}

function replayAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function addToCart(id, button) {
  if (!getProduct(id)) return;
  cart[id] = (Number(cart[id]) || 0) + 1;
  saveCart();
  renderCart();
  replayAnimation(cartCountEl, "bump");
  replayAnimation($("cart-btn"), "pulse");
  if (button) {
    button.classList.add("is-added");
    button.textContent = "Добавлено ✓";
    setTimeout(() => {
      if (!button.isConnected) return;
      button.classList.remove("is-added");
      button.textContent = "В корзину";
    }, 1000);
  }
}

function changeQty(id, delta) {
  cart[id] = (Number(cart[id]) || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
}

function openCart() {
  closeAccountMenu();
  cartEl.classList.add("is-open");
  overlayEl.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  cartEl.classList.remove("is-open");
  overlayEl.classList.remove("is-open");
  if (!modalEl.classList.contains("is-open") && !authModal.classList.contains("is-open") && !priceModal.classList.contains("is-open")) {
    document.body.classList.remove("no-scroll");
  }
}

function openCheckout() {
  if (getTotals().count === 0) return;
  $("order-total").textContent = money(getTotals().total);
  orderForm.hidden = false;
  orderSuccess.hidden = true;
  closeCart();
  modalEl.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeCheckout() {
  modalEl.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  $("login-form").hidden = isRegister;
  $("register-form").hidden = !isRegister;
  $("auth-title").textContent = isRegister ? "Создать аккаунт" : "С возвращением!";
  $("auth-message").textContent = "";
  $("auth-message").className = "form-message";
  document.querySelectorAll("[data-auth-mode]").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.authMode === mode);
  });
}

function openAuth(mode = "login") {
  closeAccountMenu();
  setAuthMode(mode);
  authModal.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeAuth() {
  authModal.classList.remove("is-open");
  if (!modalEl.classList.contains("is-open") && !priceModal.classList.contains("is-open")) {
    document.body.classList.remove("no-scroll");
  }
}

function showAuthMessage(message, type = "error") {
  const element = $("auth-message");
  element.textContent = message;
  element.className = `form-message ${type === "error" ? "form-message--error" : "form-message--success"}`;
}

// Пароль в демо-версии не хранится открытым текстом: используется PBKDF2-хеш.
// Для настоящего сайта аккаунты и проверка паролей должны находиться на сервере.
async function hashPassword(password, saltBase64) {
  if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
    throw new Error("Для регистрации откройте сайт через HTTPS или локальный сервер (например, Live Server).");
  }
  const encoder = new TextEncoder();
  const salt = saltBase64
    ? Uint8Array.from(atob(saltBase64), (char) => char.charCodeAt(0))
    : window.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, keyMaterial, 256);
  const hashBytes = new Uint8Array(bits);
  const hash = btoa(Array.from(hashBytes, (byte) => String.fromCharCode(byte)).join(""));
  const saltValue = btoa(Array.from(salt, (byte) => String.fromCharCode(byte)).join(""));
  return { hash, salt: saltValue };
}

function setCurrentUser(user) {
  currentUser = user;
  writeStorage(STORAGE_KEYS.session, { userId: user.id });
  renderAccount();
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const nickname = String(data.get("nickname") || "").trim();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const avatar = safeImageUrl(data.get("avatar"));
  const password = String(data.get("password") || "");
  const passwordConfirm = String(data.get("passwordConfirm") || "");

  if (nickname.length < 2 || nickname.length > 24) return showAuthMessage("Никнейм должен содержать от 2 до 24 символов.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthMessage("Введите корректный адрес электронной почты.");
  if (accounts.some((account) => account.email.toLowerCase() === email)) return showAuthMessage("Аккаунт с такой почтой уже существует. Попробуйте войти.");
  if (password.length < 8) return showAuthMessage("Пароль должен содержать не менее 8 символов.");
  if (password !== passwordConfirm) return showAuthMessage("Пароли не совпадают.");
  if (data.get("avatar") && !avatar) return showAuthMessage("Ссылка на аватар должна начинаться с http:// или https://.");

  try {
    const credentials = await hashPassword(password);
    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nickname,
      email,
      avatar,
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt,
      createdAt: new Date().toISOString()
    };
    accounts.push(user);
    if (!saveAccounts()) {
      accounts = accounts.filter((account) => account.id !== user.id);
      return;
    }
    setCurrentUser(user);
    form.reset();
    closeAuth();
    renderAccount();
    showToast(`Добро пожаловать, ${nickname}!`);
  } catch (error) {
    showAuthMessage(error.message || "Не удалось создать аккаунт.");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const user = accounts.find((account) => account.email.toLowerCase() === email);
  if (!user) return showAuthMessage("Аккаунт не найден. Проверьте почту или зарегистрируйтесь.");

  try {
    const credentials = await hashPassword(password, user.passwordSalt);
    if (credentials.hash !== user.passwordHash) return showAuthMessage("Неверный пароль.");
    setCurrentUser(user);
    form.reset();
    closeAuth();
    showToast(`С возвращением, ${user.nickname}!`);
  } catch (error) {
    showAuthMessage(error.message || "Не удалось выполнить вход.");
  }
}

function openAccountMenu() {
  if (!currentUser) return openAuth("login");
  accountMenu.classList.add("is-open");
  accountOverlay.classList.add("is-open");
  $("account-menu-btn").setAttribute("aria-expanded", "true");
  document.body.classList.add("no-scroll");
}

function closeAccountMenu() {
  accountMenu.classList.remove("is-open");
  accountOverlay.classList.remove("is-open");
  const trigger = $("account-menu-btn");
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  if (!cartEl.classList.contains("is-open") && !modalEl.classList.contains("is-open") && !authModal.classList.contains("is-open") && !priceModal.classList.contains("is-open")) {
    document.body.classList.remove("no-scroll");
  }
}

function logout() {
  currentUser = null;
  try { localStorage.removeItem(STORAGE_KEYS.session); } catch (error) { console.warn(error); }
  closeAccountMenu();
  renderAccount();
  showCatalog();
  showToast("Вы вышли из аккаунта.");
}

function showCatalog(updateHistory = true) {
  currentPage = "catalog";
  document.title = "Voltix — магазин электроники";
  if (updateHistory) {
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({ view: "catalog" }, "", cleanUrl);
  }
  $("hero").hidden = false;
  $("catalog").hidden = false;
  $("my-products-page").hidden = true;
  $("create-product-page").hidden = true;
  $("product-detail-page").hidden = true;
  $("search").placeholder = "Найти товар";
  renderProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showMyProducts() {
  if (!currentUser) return openAuth("login");
  closeAccountMenu();
  currentPage = "my-products";
  document.title = "Мои товары — Voltix";
  $("hero").hidden = true;
  $("catalog").hidden = true;
  $("my-products-page").hidden = false;
  $("create-product-page").hidden = true;
  $("product-detail-page").hidden = true;
  renderMyProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showCreateProduct() {
  if (!currentUser) return openAuth("login");
  closeAccountMenu();
  currentPage = "create-product";
  document.title = "Новый товар — Voltix";
  $("hero").hidden = true;
  $("catalog").hidden = true;
  $("my-products-page").hidden = true;
  $("create-product-page").hidden = false;
  $("product-detail-page").hidden = true;
  $("create-product-form").reset();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleCreateProduct(event) {
  event.preventDefault();
  if (!currentUser) return openAuth("login");
  const form = event.currentTarget;
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const category = String(data.get("category") || "");
  const price = Number(data.get("price"));
  const imageInput = String(data.get("image") || "").trim();
  const image = safeImageUrl(imageInput);
  const description = String(data.get("description") || "").trim();

  if (name.length < 2 || !categories[category] || !Number.isFinite(price) || price <= 0 || price > 1000000 || description.length < 5) {
    showToast("Проверьте заполнение формы товара.", "error");
    return;
  }
  if (imageInput && !image) {
    showToast("Укажите корректную ссылку на изображение (http или https).", "error");
    return;
  }

  const product = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    category,
    price: Math.round(price * 100) / 100,
    image,
    description,
    ownerId: currentUser.id,
    ownerName: currentUser.nickname,
    ownerAvatar: currentUser.avatar || "",
    createdAt: new Date().toISOString()
  };
  products.push(product);
  if (!saveUserProducts()) {
    products = products.filter((item) => item.id !== product.id);
    return;
  }
  form.reset();
  showMyProducts();
  showToast("Товар опубликован и добавлен в каталог!");
}

function openPriceEditor(productId) {
  const product = getProduct(productId);
  if (!currentUser || !product || product.ownerId !== currentUser.id) return;
  editingProductId = product.id;
  $("price-form").elements.price.value = product.price;
  priceModal.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closePriceEditor() {
  priceModal.classList.remove("is-open");
  editingProductId = null;
  if (!modalEl.classList.contains("is-open") && !authModal.classList.contains("is-open")) {
    document.body.classList.remove("no-scroll");
  }
}

function handlePriceUpdate(event) {
  event.preventDefault();
  const product = getProduct(editingProductId);
  if (!currentUser || !product || product.ownerId !== currentUser.id) return closePriceEditor();
  const price = Number(new FormData(event.currentTarget).get("price"));
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
    showToast("Введите цену больше нуля.", "error");
    return;
  }
  product.price = Math.round(price * 100) / 100;
  saveUserProducts();
  closePriceEditor();
  renderMyProducts();
  renderCart();
  showToast("Цена обновлена.");
}

function deleteProduct(productId) {
  const product = getProduct(productId);
  if (!currentUser || !product || product.ownerId !== currentUser.id) return;
  if (!window.confirm(`Удалить товар «${product.name}»?`)) return;
  products = products.filter((item) => String(item.id) !== String(productId));
  for (const id of Object.keys(cart)) {
    if (String(id) === String(productId)) delete cart[id];
  }
  saveUserProducts();
  saveCart();
  renderMyProducts();
  renderProducts();
  renderCart();
  showToast("Товар удалён.");
}

function selectCategory(name) {
  if (!categories[name] && name !== "Все") return;
  activeCategory = name;
  renderFilters();
  renderProducts();
}


document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.category) {
    selectCategory(button.dataset.category);
    if (button.classList.contains("hero__cat")) $("catalog").scrollIntoView({ behavior: "smooth" });
  }
  if (button.dataset.add) addToCart(button.dataset.add, button);
  if (button.dataset.inc) changeQty(button.dataset.inc, 1);
  if (button.dataset.dec) changeQty(button.dataset.dec, -1);
  if (button.dataset.remove) removeFromCart(button.dataset.remove);
  if (button.dataset.authMode) setAuthMode(button.dataset.authMode);
  if (button.dataset.page === "create") showCreateProduct();
  if (button.dataset.editPrice) openPriceEditor(button.dataset.editPrice);
  if (button.dataset.deleteProduct) deleteProduct(button.dataset.deleteProduct);
});

document.addEventListener("click", (event) => {
  const card = event.target.closest("[data-product-card]");
  if (!card || event.target.closest("button")) return;
  openProduct(card.dataset.productCard);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest?.("[data-product-card]");
  if (!card || event.target !== card) return;
  event.preventDefault();
  openProduct(card.dataset.productCard);
});

$("search").addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderProducts();
});

$("sort").addEventListener("change", (event) => {
  sortMode = event.target.value;
  renderProducts();
});

$("logo-link").addEventListener("click", (event) => {
  event.preventDefault();
  showCatalog();
});
$("theme-toggle").addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});
$("product-detail-back").addEventListener("click", () => {
  if (productReturnPage === "my-products" && currentUser) showMyProducts();
  else showCatalog();
});
window.addEventListener("popstate", syncPageFromUrl);
$("auth-open").addEventListener("click", () => openAuth("login"));
$("account-menu-btn").addEventListener("click", openAccountMenu);
$("account-menu-close").addEventListener("click", closeAccountMenu);
accountOverlay.addEventListener("click", closeAccountMenu);
$("menu-my-products").addEventListener("click", showMyProducts);
$("menu-add-product").addEventListener("click", showCreateProduct);
$("logout-btn").addEventListener("click", logout);
$("create-product-cta").addEventListener("click", showCreateProduct);
$("my-products-back").addEventListener("click", showCatalog);
$("my-products-add").addEventListener("click", showCreateProduct);
$("create-back").addEventListener("click", showMyProducts);
$("create-cancel").addEventListener("click", showMyProducts);
$("create-product-form").addEventListener("submit", handleCreateProduct);

$("login-form").addEventListener("submit", handleLogin);
$("register-form").addEventListener("submit", handleRegister);
$("auth-close").addEventListener("click", closeAuth);
authModal.addEventListener("click", (event) => { if (event.target === authModal) closeAuth(); });

$("price-form").addEventListener("submit", handlePriceUpdate);
$("price-close").addEventListener("click", closePriceEditor);
$("price-cancel").addEventListener("click", closePriceEditor);
priceModal.addEventListener("click", (event) => { if (event.target === priceModal) closePriceEditor(); });

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (getTotals().count === 0) return closeCheckout();
  const number = "V-" + Math.floor(100000 + Math.random() * 900000);
  $("order-number").textContent = number;
  cart = {};
  saveCart();
  renderCart();
  orderForm.reset();
  orderForm.hidden = true;
  orderSuccess.hidden = false;
});

$("cart-btn").addEventListener("click", openCart);
$("cart-close").addEventListener("click", closeCart);
overlayEl.addEventListener("click", closeCart);
checkoutBtn.addEventListener("click", openCheckout);
$("modal-close").addEventListener("click", closeCheckout);
$("success-close").addEventListener("click", closeCheckout);
modalEl.addEventListener("click", (event) => { if (event.target === modalEl) closeCheckout(); });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
    closeAuth();
    closePriceEditor();
    closeAccountMenu();
  }
});

const headerEl = document.querySelector(".header");
window.addEventListener("scroll", () => {
  headerEl.classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });


initTheme();
renderFilters();
renderProducts();
renderCart();
renderAccount();
syncPageFromUrl();
