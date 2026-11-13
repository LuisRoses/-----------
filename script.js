import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://wghzcnpmcunbihxggfwu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ck1A_MbjcalAbxk2o0_S-g_oHogMThP";
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

"use strict";

const CURRENCY = "$";
const STORAGE_KEYS = {
  cart: "voltix-cart",
  products: "voltix-user-products",
  accounts: "voltix-accounts",
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
document.documentElement.classList.add("motion-enabled");
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
// Support tickets now live in Supabase, not in this browser's localStorage.
let supportTickets = [];
let selectedAdminTicketId = null;
let currentUser = null;
let supportRealtimeChannel = null;
let authSyncVersion = 0;
let pendingAuthSync = null;

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
  toast.className = `toast ${type === "error" ? "toast--error" : ""}`;
  void toast.offsetWidth;
  toast.classList.add("is-visible");
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



let motionObserver = null;
function initScrollAnimations(root = document) {
  const elements = [];
  if (root.matches?.(".motion-reveal")) elements.push(root);
  elements.push(...root.querySelectorAll(".motion-reveal"));
  if (!elements.length) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (!motionObserver) {
    motionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  }

  elements.forEach((element) => {
    if (element.dataset.motionObserved === "true") return;
    element.dataset.motionObserved = "true";
    motionObserver.observe(element);
  });
}


function replayViewAnimation(element) {
  if (!element || element.hidden) return;
  element.classList.remove("view-enter");
  void element.offsetWidth;
  element.classList.add("view-enter");
  const finish = (event) => {
    if (event.target !== element) return;
    element.classList.remove("view-enter");
    element.removeEventListener("animationend", finish);
  };
  element.addEventListener("animationend", finish);
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

function getUserRole(user) {
  if (!user) return "user";
  if (user.isAdmin === true) return "admin";
  if (user.role === "seller" || products.some((product) => product.ownerId === user.id)) return "seller";
  return "user";
}

function roleLabel(role) {
  return role === "admin" ? "Администратор" : role === "seller" ? "Продавец" : "Пользователь";
}

function applyUserRole(user) {
  if (!user) return;
  const role = getUserRole(user);
  const badge = $("menu-role");
  if (badge) {
    badge.textContent = roleLabel(role);
    badge.className = `role-badge role-badge--${role}`;
  }
  const adminLink = $("menu-admin-support");
  if (adminLink) adminLink.hidden = role !== "admin";
  updateAdminTicketCount();
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
  applyUserRole(currentUser);
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
  ["profile-page", "my-support-page", "admin-support-page"].forEach((id) => { if ($(id)) $(id).hidden = true; });
  $("search").value = "";
  renderProductDetails(product);
  replayViewAnimation($("product-detail-page"));
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
    button.classList.remove("theme-changing");
    void button.offsetWidth;
    button.classList.add("theme-changing");
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
  filtersEl.innerHTML = names.map((name, index) => `
    <button class="chip ${name === activeCategory ? "is-active" : ""}" style="--i:${index}" type="button" data-category="${escapeHTML(name)}">${escapeHTML(name)}</button>
  `).join("");

  heroCatsEl.innerHTML = Object.keys(categories).map((name, index) => `
    <button class="hero__cat" style="--i:${index}" type="button" data-category="${escapeHTML(name)}">
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
    <article class="card motion-reveal" style="--i:${Math.min(index, 8)}" data-product-card="${escapeHTML(product.id)}" tabindex="0" role="link" aria-label="Подробнее о товаре: ${escapeHTML(product.name)}">
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
  initScrollAnimations(productsEl);
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
  initScrollAnimations(grid);
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
  cartItemsEl.innerHTML = ids.length ? ids.map((id, index) => {
    const product = getProduct(id);
    const category = categories[product.category] || { tint: "#e7ecf5" };
    return `
      <div class="cart-item" style="--i:${index}">
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


function syncCurrentUser(authUser) {
  if (!authUser) {
    const version = ++authSyncVersion;
    pendingAuthSync = null;
    currentUser = null;
    supportTickets = [];
    selectedAdminTicketId = null;
    const oldChannel = supportRealtimeChannel;
    supportRealtimeChannel = null;
    if (oldChannel) void supabaseClient.removeChannel(oldChannel);
    renderAccount();
    updateAdminTicketCount();
    return Promise.resolve();
  }

  if (currentUser?.id === authUser.id && currentUser.roleLoaded) return Promise.resolve();
  if (pendingAuthSync?.id === authUser.id) return pendingAuthSync.promise;

  const version = ++authSyncVersion;
  const task = (async () => {
    let isAdmin = false;
    const { data: adminResult, error: adminError } = await supabaseClient.rpc("is_support_admin");
    if (version !== authSyncVersion) return;
    if (adminError) {
      console.warn("Не удалось проверить роль администратора:", adminError.message);
    } else {
      isAdmin = adminResult === true;
    }

    const metadata = authUser.user_metadata || {};
    currentUser = {
      id: authUser.id,
      authUserId: authUser.id,
      nickname: String(metadata.nickname || metadata.full_name || authUser.email?.split("@")[0] || "Пользователь").slice(0, 24),
      email: authUser.email || "",
      avatar: safeImageUrl(metadata.avatar || ""),
      createdAt: authUser.created_at || new Date().toISOString(),
      isAdmin,
      roleLoaded: true
    };

    renderAccount();
    await loadSupportTickets({ quiet: true });
    if (version !== authSyncVersion) return;
    setupSupportRealtime();
  })();

  const tracked = task.finally(() => {
    if (pendingAuthSync?.promise === tracked) pendingAuthSync = null;
  });
  pendingAuthSync = { id: authUser.id, promise: tracked };
  return tracked;
}

async function initializeSupabaseAuth() {
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    // Defer work out of the auth callback to avoid holding the auth lock.
    window.setTimeout(() => { void syncCurrentUser(session?.user || null); }, 0);
  });

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error("Не удалось восстановить сессию Supabase:", error);
    showToast("Не удалось восстановить вход. Попробуйте обновить страницу.", "error");
    return;
  }
  await syncCurrentUser(data.session?.user || null);
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
  if (password.length < 8) return showAuthMessage("Пароль должен содержать не менее 8 символов.");
  if (password !== passwordConfirm) return showAuthMessage("Пароли не совпадают.");
  if (data.get("avatar") && !avatar) return showAuthMessage("Ссылка на аватар должна начинаться с http:// или https://.");

  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    const { data: result, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { nickname, avatar },
        // Keep the GitHub Pages repository path when Supabase confirms email.
        // Example: https://luisroses.github.io/voltix-electronic-shop/
        emailRedirectTo: new URL("./", window.location.href).href
      }
    });
    if (error) throw error;
    form.reset();

    if (result.session && result.user) {
      await syncCurrentUser(result.user);
      closeAuth();
      showToast(`Добро пожаловать, ${nickname}!`);
    } else {
      showAuthMessage("Аккаунт создан. Проверьте почту и подтвердите адрес, затем войдите в Voltix.", "success");
    }
  } catch (error) {
    showAuthMessage(error.message || "Не удалось создать аккаунт.");
  } finally {
    if (submit) submit.disabled = false;
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;

  try {
    const { data: result, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await syncCurrentUser(result.user);
    form.reset();
    closeAuth();
    showToast(`С возвращением, ${currentUser?.nickname || email}!`);
  } catch (error) {
    showAuthMessage(error.message || "Не удалось выполнить вход.");
  } finally {
    if (submit) submit.disabled = false;
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

async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    showToast(error.message || "Не удалось выйти из аккаунта.", "error");
    return;
  }
  closeAccountMenu();
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
  ["profile-page", "my-support-page", "admin-support-page"].forEach((id) => { if ($(id)) $(id).hidden = true; });
  $("search").placeholder = "Найти товар";
  renderProducts();
  replayViewAnimation($("hero"));
  replayViewAnimation($("catalog"));
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
  ["profile-page", "my-support-page", "admin-support-page"].forEach((id) => { if ($(id)) $(id).hidden = true; });
  renderMyProducts();
  replayViewAnimation($("my-products-page"));
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
  ["profile-page", "my-support-page", "admin-support-page"].forEach((id) => { if ($(id)) $(id).hidden = true; });
  $("create-product-form").reset();
  replayViewAnimation($("create-product-page"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatSupportDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата неизвестна";
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function displayTicketId(ticket) {
  return `VT-${String(ticket.id || "").replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function getTicketStatusLabel(status) {
  return ({ open: "Новое", in_progress: "В работе", waiting: "Ожидает ответа", closed: "Закрыто" })[status] || "Новое";
}

function getTicketStatusClass(status) {
  if (status === "closed") return "closed";
  if (status === "waiting") return "answered";
  return "new";
}

function updateAdminTicketCount() {
  const count = supportTickets.filter((ticket) => ticket.status !== "closed").length;
  const badge = $("admin-menu-ticket-count");
  const label = $("admin-support-count");
  if (badge) { badge.textContent = String(count); badge.hidden = count === 0; }
  if (label) label.textContent = `${supportTickets.length} всего · ${count} активных`;
}

async function loadSupportTickets({ quiet = false } = {}) {
  if (!currentUser) { supportTickets = []; updateAdminTicketCount(); return; }

  const { data: rows, error } = await supabaseClient
    .from("support_tickets")
    .select("id,user_id,user_name,user_email,subject,description,status,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ошибка загрузки обращений:", error);
    if (!quiet) showToast(`Не удалось загрузить обращения: ${error.message}`, "error");
    return;
  }

  const ticketIds = (rows || []).map((row) => row.id);
  let messageRows = [];
  if (ticketIds.length) {
    const { data, error: messageError } = await supabaseClient
      .from("support_messages")
      .select("id,ticket_id,sender_id,sender_role,sender_name,body,created_at")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: true });
    if (messageError) {
      console.error("Ошибка загрузки сообщений:", messageError);
      if (!quiet) showToast(`Не удалось загрузить сообщения: ${messageError.message}`, "error");
      return;
    }
    messageRows = data || [];
  }

  const byTicket = new Map();
  for (const row of messageRows) {
    if (!byTicket.has(row.ticket_id)) byTicket.set(row.ticket_id, []);
    byTicket.get(row.ticket_id).push({
      id: row.id,
      sender: row.sender_role || (row.sender_id === currentUser.id ? "user" : "admin"),
      senderName: row.sender_name || (row.sender_role === "admin" ? "Поддержка Voltix" : "Пользователь"),
      text: row.body,
      createdAt: row.created_at
    });
  }

  supportTickets = (rows || []).map((row) => {
    const messages = byTicket.get(row.id) || [];
    // Show the original description even if the initial message insert was interrupted.
    if (!messages.length && row.description) {
      messages.push({
        id: `initial-${row.id}`,
        sender: "user",
        senderName: row.user_name || "Пользователь",
        text: row.description,
        createdAt: row.created_at
      });
    }
    return {
      id: row.id,
      displayId: `VT-${row.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      userId: row.user_id,
      userName: row.user_name || "Пользователь Voltix",
      userEmail: row.user_email || "",
      title: row.subject,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      messages
    };
  });

  if (!supportTickets.some((ticket) => ticket.id === selectedAdminTicketId)) selectedAdminTicketId = null;
  updateAdminTicketCount();
  if (currentPage === "my-support") renderMySupportPage();
  if (currentPage === "admin-support") { renderAdminTicketList(); renderAdminTicketDetail(); }
  if (currentPage === "profile") renderProfileContent();
}

function setupSupportRealtime() {
  if (!currentUser) return;
  if (supportRealtimeChannel) void supabaseClient.removeChannel(supportRealtimeChannel);

  supportRealtimeChannel = supabaseClient
    .channel(`voltix-support-${currentUser.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
      void loadSupportTickets({ quiet: true });
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => {
      void loadSupportTickets({ quiet: true });
    })
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("Supabase Realtime:", status, error || "");
      }
    });
}

function renderProfileContent() {
  if (!currentUser) return;
  const role = getUserRole(currentUser);
  const myProducts = products.filter((product) => product.ownerId === currentUser.id).length;
  const myTickets = supportTickets.filter((ticket) => ticket.userId === currentUser.id).length;
  $("profile-content").innerHTML = `
    <article class="profile-card">
      <div class="profile-card__identity">
        ${avatarMarkup(currentUser, "avatar avatar--profile")}
        <div><h2>${escapeHTML(currentUser.nickname)}</h2><span class="role-badge role-badge--${role}">${roleLabel(role)}</span></div>
      </div>
      <div class="profile-info-grid">
        <div><span>Электронная почта</span><strong>${escapeHTML(currentUser.email)}</strong></div>
        <div><span>Аккаунт создан</span><strong>${formatSupportDate(currentUser.createdAt)}</strong></div>
      </div>
      <div class="profile-stats">
        <div><strong>${myProducts}</strong><span>Мои товары</span></div>
        <div><strong>${myTickets}</strong><span>Обращения</span></div>
      </div>
      <div class="profile-card__actions">
        <button class="btn" type="button" data-new-support>Обратиться в поддержку</button>
        <button class="btn btn--light" type="button" data-open-my-support>Мои обращения</button>
      </div>
    </article>`;
}

async function showProfilePage() {
  if (!currentUser) return openAuth("login");
  closeAccountMenu();
  currentPage = "profile";
  document.title = "Мой профиль — Voltix";
  ["hero", "catalog", "my-products-page", "create-product-page", "product-detail-page", "my-support-page", "admin-support-page"].forEach((id) => { $(id).hidden = true; });
  $("profile-page").hidden = false;
  await loadSupportTickets({ quiet: true });
  renderProfileContent();
  replayViewAnimation($("profile-page"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSupportModal() {
  if (!currentUser) {
    showToast("Войдите в аккаунт, чтобы отправить обращение.", "error");
    return openAuth("login");
  }
  closeAccountMenu();
  $("support-form").reset();
  $("support-form-message").textContent = "";
  $("support-form-message").className = "form-message";
  $("support-modal").classList.add("is-open");
  document.body.classList.add("no-scroll");
  window.setTimeout(() => $("support-form").elements.title.focus(), 80);
}

function closeSupportModal() {
  $("support-modal").classList.remove("is-open");
  if (!modalEl.classList.contains("is-open") && !authModal.classList.contains("is-open") && !priceModal.classList.contains("is-open") && !cartEl.classList.contains("is-open") && !accountMenu.classList.contains("is-open")) {
    document.body.classList.remove("no-scroll");
  }
}

async function handleSupportCreate(event) {
  event.preventDefault();
  if (!currentUser) return closeSupportModal();
  const data = new FormData(event.currentTarget);
  const title = String(data.get("title") || "").trim();
  const description = String(data.get("description") || "").trim();
  if (title.length < 3 || description.length < 10) {
    $("support-form-message").textContent = "Заполните заголовок и описание подробнее.";
    $("support-form-message").className = "form-message form-message--error";
    return;
  }

  const submit = event.currentTarget.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    // The database creates the ticket and its first message in one secure RPC.
    // Sender identity and role are derived from the authenticated Supabase session.
    const { data: ticket, error } = await supabaseClient.rpc("create_support_ticket", {
      p_subject: title,
      p_description: description
    });
    if (error) throw error;
    if (!ticket || !ticket.id) throw new Error("База данных не вернула номер обращения.");

    closeSupportModal();
    await loadSupportTickets({ quiet: true });
    showToast(`Обращение ${displayTicketId(ticket)} отправлено.`);
    showMySupportPage();
  } catch (error) {
    console.error("Не удалось создать обращение:", error);
    $("support-form-message").textContent = error.message || "Не удалось отправить обращение. Попробуйте ещё раз.";
    $("support-form-message").className = "form-message form-message--error";
  } finally {
    if (submit) submit.disabled = false;
  }
}

function messageMarkup(message) {
  const isAdmin = message.sender === "admin";
  return `<div class="support-message ${isAdmin ? "support-message--admin" : "support-message--user"}">
    <div class="support-message__meta"><strong>${escapeHTML(message.senderName || (isAdmin ? "Поддержка Voltix" : "Пользователь"))}</strong><time>${formatSupportDate(message.createdAt)}</time></div>
    <p>${escapeHTML(message.text).replace(/\n/g, "<br>")}</p>
  </div>`;
}

function renderMySupportPage() {
  const list = $("my-support-list");
  const mine = supportTickets.filter((ticket) => ticket.userId === currentUser?.id);
  if (!mine.length) {
    list.innerHTML = `<div class="support-empty"><span>💬</span><strong>У вас пока нет обращений</strong><p>Нажмите «Новое обращение», чтобы написать напрямую администратору Voltix.</p></div>`;
    return;
  }
  list.innerHTML = mine.map((ticket) => `
    <article class="support-ticket-card">
      <div class="support-ticket-card__head"><div><span class="support-ticket-id">${escapeHTML(ticket.displayId)}</span><h3>${escapeHTML(ticket.title)}</h3></div><span class="ticket-status ticket-status--${getTicketStatusClass(ticket.status)}">${getTicketStatusLabel(ticket.status)}</span></div>
      <p class="support-ticket-date">Создано: ${formatSupportDate(ticket.createdAt)}</p>
      <div class="support-thread">${(ticket.messages || []).map(messageMarkup).join("")}</div>
      ${ticket.status !== "closed" ? `<form class="support-reply-form" data-user-reply="${escapeHTML(ticket.id)}"><label>Ответить поддержке<textarea name="message" required minlength="2" maxlength="2000" rows="3" placeholder="Напишите сообщение для поддержки Voltix..."></textarea></label><p class="support-reply-hint">Ваш ответ увидит администратор. Вы можете продолжить диалог здесь.</p><button class="btn btn--small" type="submit">Отправить сообщение</button><p class="support-reply-error" role="status" aria-live="polite"></p></form>` : `<p class="support-closed-note">Обращение закрыто. Создайте новое обращение, если понадобится помощь.</p>`}
    </article>`).join("");
}

async function showMySupportPage() {
  if (!currentUser) return openAuth("login");
  closeAccountMenu();
  currentPage = "my-support";
  document.title = "Мои обращения — Voltix";
  ["hero", "catalog", "my-products-page", "create-product-page", "product-detail-page", "profile-page", "admin-support-page"].forEach((id) => { $(id).hidden = true; });
  $("my-support-page").hidden = false;
  await loadSupportTickets({ quiet: true });
  renderMySupportPage();
  replayViewAnimation($("my-support-page"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAdminTicketList() {
  const list = $("admin-support-list");
  const openCount = supportTickets.filter((ticket) => ticket.status !== "closed").length;
  $("admin-support-count").textContent = `${supportTickets.length} всего · ${openCount} активных`;
  $("admin-menu-ticket-count").textContent = String(openCount);
  $("admin-menu-ticket-count").hidden = openCount === 0;
  if (!supportTickets.length) {
    list.innerHTML = `<div class="support-empty support-empty--compact"><span>📭</span><strong>Обращений пока нет</strong><p>Новые обращения пользователей появятся здесь.</p></div>`;
    return;
  }
  list.innerHTML = supportTickets.map((ticket) => `
    <button class="admin-ticket-row ${ticket.id === selectedAdminTicketId ? "is-selected" : ""}" type="button" data-open-ticket="${escapeHTML(ticket.id)}">
      <span class="admin-ticket-row__top"><strong>${escapeHTML(ticket.title)}</strong><span class="ticket-status ticket-status--${getTicketStatusClass(ticket.status)}">${getTicketStatusLabel(ticket.status)}</span></span>
      <span class="admin-ticket-row__user">${escapeHTML(ticket.userName || "Пользователь")} · ${escapeHTML(ticket.userEmail || "")}</span>
      <span class="admin-ticket-row__date">${formatSupportDate(ticket.updatedAt || ticket.createdAt)}</span>
    </button>`).join("");
}

function renderAdminTicketDetail() {
  const panel = $("admin-support-detail");
  const ticket = supportTickets.find((item) => item.id === selectedAdminTicketId);
  if (!ticket) {
    panel.innerHTML = `<div class="support-empty"><span>🎧</span><strong>Выберите обращение</strong><p>Откройте заявку слева, чтобы прочитать сообщения и ответить пользователю.</p></div>`;
    return;
  }
  panel.innerHTML = `
    <div class="support-detail-head"><div><span class="support-ticket-id">${escapeHTML(ticket.displayId)}</span><h2>${escapeHTML(ticket.title)}</h2><p>${escapeHTML(ticket.userName || "Пользователь")} · ${escapeHTML(ticket.userEmail || "")}</p></div><span class="ticket-status ticket-status--${getTicketStatusClass(ticket.status)}">${getTicketStatusLabel(ticket.status)}</span></div>
    <div class="support-thread support-thread--admin">${(ticket.messages || []).map(messageMarkup).join("")}</div>
    <div class="support-detail-actions">
      ${ticket.status !== "closed" ? `<form id="admin-reply-form" class="support-reply-form"><label>Ваш ответ<textarea name="message" required minlength="2" maxlength="2000" rows="3" placeholder="Ответьте пользователю..."></textarea></label><button class="btn" type="submit">Отправить ответ</button></form>` : `<p class="support-closed-note">Обращение закрыто.</p>`}
      <button id="admin-ticket-toggle" class="btn ${ticket.status === "closed" ? "btn--light" : "btn--danger"}" type="button">${ticket.status === "closed" ? "Переоткрыть обращение" : "Закрыть обращение"}</button>
    </div>`;
  const replyForm = $("admin-reply-form");
  if (replyForm) replyForm.addEventListener("submit", (event) => { void handleTicketReply(event, ticket.id, "admin"); });
  $("admin-ticket-toggle").addEventListener("click", async () => {
    const nextStatus = ticket.status === "closed" ? "open" : "closed";
    const { error } = await supabaseClient.from("support_tickets").update({ status: nextStatus }).eq("id", ticket.id);
    if (error) { showToast(error.message || "Не удалось изменить статус.", "error"); return; }
    await loadSupportTickets({ quiet: true });
    showToast(nextStatus === "closed" ? "Обращение закрыто." : "Обращение переоткрыто.");
  });
}

async function showAdminSupportPage() {
  if (!currentUser || getUserRole(currentUser) !== "admin") {
    showToast("Доступ к этому разделу есть только у администратора.", "error");
    return showCatalog();
  }
  closeAccountMenu();
  currentPage = "admin-support";
  document.title = "Обращения в поддержку — Voltix";
  ["hero", "catalog", "my-products-page", "create-product-page", "product-detail-page", "profile-page", "my-support-page"].forEach((id) => { $(id).hidden = true; });
  $("admin-support-page").hidden = false;
  await loadSupportTickets({ quiet: true });
  renderAdminTicketList();
  renderAdminTicketDetail();
  replayViewAnimation($("admin-support-page"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleTicketReply(event, ticketId, sender) {
  event.preventDefault();
  const form = event.currentTarget;
  const ticket = supportTickets.find((item) => item.id === ticketId);
  if (!currentUser || !ticket) {
    showToast("Не удалось определить обращение. Обновите страницу.", "error");
    return;
  }
  if (ticket.status === "closed") {
    showToast("Это обращение закрыто. Создайте новое, чтобы продолжить общение.", "error");
    return;
  }

  const isAdmin = getUserRole(currentUser) === "admin";
  if (sender === "admin" && !isAdmin) {
    showToast("Отвечать от имени поддержки может только администратор.", "error");
    return;
  }
  if (sender === "user" && (isAdmin || ticket.userId !== currentUser.id)) {
    showToast("Вы можете отвечать только в собственном обращении.", "error");
    return;
  }
  if (sender !== "admin" && sender !== "user") return;

  const message = String(new FormData(form).get("message") || "").trim();
  if (message.length < 2) {
    showToast("Сообщение должно содержать хотя бы 2 символа.", "error");
    return;
  }

  const submit = form.querySelector('button[type="submit"]');
  const errorBox = form.querySelector(".support-reply-error");
  if (errorBox) errorBox.textContent = "";
  if (submit) submit.disabled = true;

  try {
    // The RPC derives sender_id and sender_role from auth.uid() and the private admin registry.
    // This avoids fragile client-side INSERT policies and prevents role spoofing.
    const { error } = await supabaseClient.rpc("send_support_message", {
      p_ticket_id: ticket.id,
      p_body: message
    });
    if (error) throw error;

    form.reset();
    await loadSupportTickets({ quiet: false });
    showToast(isAdmin ? "Ответ отправлен пользователю." : "Сообщение отправлено поддержке.");
  } catch (error) {
    console.error("Не удалось отправить сообщение в тикет:", error);
    const detail = error?.message || "Не удалось отправить сообщение.";
    const friendly = error?.code === "42501"
      ? "У аккаунта нет прав на отправку. Проверьте, что новый SQL-скрипт выполнен в Supabase."
      : detail;
    if (errorBox) errorBox.textContent = friendly;
    showToast(friendly, "error");
  } finally {
    if (submit) submit.disabled = false;
  }
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
  // Seller status is derived from products owned by this Supabase user.
  renderAccount();
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
$("menu-profile").addEventListener("click", showProfilePage);
$("menu-my-products").addEventListener("click", showMyProducts);
$("menu-add-product").addEventListener("click", showCreateProduct);
$("menu-my-support").addEventListener("click", showMySupportPage);
$("menu-admin-support").addEventListener("click", showAdminSupportPage);
$("logout-btn").addEventListener("click", logout);
$("create-product-cta").addEventListener("click", showCreateProduct);
$("my-products-back").addEventListener("click", showCatalog);
$("my-products-add").addEventListener("click", showCreateProduct);
$("create-back").addEventListener("click", showMyProducts);
$("create-cancel").addEventListener("click", showMyProducts);
$("create-product-form").addEventListener("submit", handleCreateProduct);

$("login-form").addEventListener("submit", handleLogin);
$("register-form").addEventListener("submit", handleRegister);
$("support-fab").addEventListener("click", openSupportModal);
$("support-modal-close").addEventListener("click", closeSupportModal);
$("support-modal").addEventListener("click", (event) => { if (event.target === $("support-modal")) closeSupportModal(); });
$("support-form").addEventListener("submit", handleSupportCreate);
$("admin-support-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-ticket]");
  if (!button || !currentUser || getUserRole(currentUser) !== "admin") return;
  selectedAdminTicketId = button.dataset.openTicket;
  renderAdminTicketList();
  renderAdminTicketDetail();
});
$("my-support-list").addEventListener("submit", (event) => {
  const form = event.target.closest("[data-user-reply]");
  if (form) void handleTicketReply(event, form.dataset.userReply, "user");
});
document.addEventListener("click", (event) => {
  const back = event.target.closest("[data-back-catalog]");
  if (back) showCatalog();
  const newSupport = event.target.closest("[data-new-support]");
  if (newSupport) openSupportModal();
  const openMySupport = event.target.closest("[data-open-my-support]");
  if (openMySupport) showMySupportPage();
});
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
    closeSupportModal();
    closeAccountMenu();
  }
});

const headerEl = document.querySelector(".header");
window.addEventListener("scroll", () => {
  headerEl.classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });


async function startVoltix() {
  initTheme();
  renderFilters();
  renderProducts();
  renderCart();
  renderAccount();
  updateAdminTicketCount();
  syncPageFromUrl();
  await initializeSupabaseAuth();
}

void startVoltix();
