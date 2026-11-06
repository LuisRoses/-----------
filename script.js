
const CURRENCY = "$";


const categories = {
  "Смартфоны":        { icon: "📱", tint: "#dfe8ff" },
  "Ноутбуки":         { icon: "💻", tint: "#e3f3e6" },
  "Телевизоры":       { icon: "📺", tint: "#ffe9d6" },
  "Наушники":         { icon: "🎧", tint: "#f1e4fb" },
  "Бытовая техника":  { icon: "🤖", tint: "#fff3c9" },
  "Игровые приставки":{ icon: "🎮", tint: "#ffdede" },
  "Аксессуары":       { icon: "⌚", tint: "#dcf3f5" }
};


const products = [
  { id: 1,  name: "Смартфон Nova X",           category: "Смартфоны",         price: 499, image: "images/novax.jpg",  description: "Экран AMOLED 6,5″, 128 ГБ, тройная камера." },
  { id: 2,  name: "Смартфон Pixel Lite",       category: "Смартфоны",         price: 349, image: "images/pixel.jpg",  description: "Компактный, 6 ГБ памяти, быстрая зарядка." },
  { id: 3,  name: "Ноутбук AirBook 14",        category: "Ноутбуки",          price: 899, image: "images/airbook.jpg",  description: "Лёгкий, 16 ГБ ОЗУ, SSD 512 ГБ, до 12 часов работы." },
  { id: 4,  name: "Игровой ноутбук Titan 16",  category: "Ноутбуки",          price: 1399, image: "images/titan.jpg", description: "Видеокарта RTX, экран 165 Гц, 32 ГБ ОЗУ." },
  { id: 5,  name: "Телевизор Vision 55″ 4K",   category: "Телевизоры",        price: 599, image: "images/vision.jpg",  description: "Диагональ 55″, HDR, Smart TV, три порта HDMI." },
  { id: 6,  name: "Наушники Beat Air",         category: "Наушники",          price: 129, image: "images/beat.jpg",  description: "Беспроводные, шумоподавление, 30 часов звука." },
  { id: 7,  name: "Наушники Studio Pro",       category: "Наушники",          price: 249, image: "images/beat.jpg",  description: "Накладные, студийный звук, съёмный кабель." },
  { id: 8,  name: "Приставка PlayBox S",       category: "Игровые приставки", price: 449, image: "images/playbox.jpg",  description: "4K-игры, SSD 1 ТБ, геймпад в комплекте." },
  { id: 9,  name: "Робот-пылесос CleanBot",    category: "Бытовая техника",   price: 279, image: "images/clean.jpg",  description: "Влажная уборка, карта комнат, управление с телефона." },
  { id: 10, name: "Кофемашина Barista 15",     category: "Бытовая техника",   price: 329, image: "images/coffee.jpg",  description: "Давление 15 бар, капучинатор, два режима помола." },
  { id: 11, name: "Powerbank 20 000 мАч",      category: "Аксессуары",        price: 39, image: "images/powerbank.jpg",   description: "Два порта USB-C, быстрая зарядка 45 Вт." },
  { id: 12, name: "Умные часы Pulse 2",        category: "Аксессуары",        price: 159, image: "images/pulse.jpg",  description: "Пульс, сон, GPS, влагозащита, 7 дней без зарядки." }
];


let cart = loadCart();          
let activeCategory = "Все";
let searchQuery = "";
let sortMode = "default";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("voltix-cart")) || {};
  } catch (e) {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem("voltix-cart", JSON.stringify(cart));
  } catch (e) {
    
  }
}


const $ = (id) => document.getElementById(id);
const productsEl   = $("products");
const filtersEl    = $("filters");
const heroCatsEl   = $("hero-categories");
const titleEl      = $("catalog-title");
const cartEl       = $("cart");
const cartItemsEl  = $("cart-items");
const cartTotalEl  = $("cart-total");
const cartCountEl  = $("cart-count");
const checkoutBtn  = $("checkout-btn");
const overlayEl    = $("overlay");
const modalEl      = $("modal");
const orderForm    = $("order-form");
const orderSuccess = $("order-success");

const money = (n) => CURRENCY + n.toLocaleString("ru-RU");
const getProduct = (id) => products.find((p) => p.id === Number(id));

const IMAGE_PLACEHOLDER = "Сюда картинку";


function productImage(p) {
  if (p.image && p.image !== IMAGE_PLACEHOLDER) {
    return `<img src="${p.image}" alt="${p.name}">`;
  }
  return categories[p.category].icon;
}


function renderFilters() {
  const names = ["Все", ...Object.keys(categories)];
  filtersEl.innerHTML = names.map((name) => `
    <button class="chip ${name === activeCategory ? "is-active" : ""}"
            type="button" data-category="${name}">${name}</button>
  `).join("");

  heroCatsEl.innerHTML = Object.keys(categories).map((name) => `
    <button class="hero__cat" type="button" data-category="${name}">
      <span aria-hidden="true">${categories[name].icon}</span> ${name}
    </button>
  `).join("");
}

function getVisibleProducts() {
  let list = products.filter((p) =>
    (activeCategory === "Все" || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchQuery)
  );
  if (sortMode === "price-asc")  list = [...list].sort((a, b) => a.price - b.price);
  if (sortMode === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

function renderProducts() {
  const list = getVisibleProducts();
  titleEl.textContent = activeCategory === "Все" ? "Все товары" : activeCategory;

  if (list.length === 0) {
    productsEl.innerHTML = `<p class="empty">Ничего не найдено. Измените запрос или выберите другую категорию.</p>`;
    return;
  }

  productsEl.innerHTML = list.map((p, i) => {
    const cat = categories[p.category];
    return `
      <article class="card" style="--i:${Math.min(i, 8)}">
        <div class="card__stage" style="--tint:${cat.tint}">${productImage(p)}</div>
        <div class="card__body">
          <span class="card__cat">${p.category}</span>
          <h3>${p.name}</h3>
          <p class="card__desc">${p.description}</p>
          <div class="card__bottom">
            <span class="price">${money(p.price)}</span>
            <button class="btn" type="button" data-add="${p.id}">В корзину</button>
          </div>
        </div>
      </article>`;
  }).join("");
}


function getTotals() {
  let total = 0, count = 0;
  for (const id in cart) {
    const p = getProduct(id);
    if (!p) continue;
    total += p.price * cart[id];
    count += cart[id];
  }
  return { total, count };
}

function renderCart() {
  const ids = Object.keys(cart).filter((id) => getProduct(id));

  cartItemsEl.innerHTML = ids.length
    ? ids.map((id) => {
        const p = getProduct(id);
        const cat = categories[p.category];
        return `
          <div class="cart-item">
            <div class="cart-item__icon" style="--tint:${cat.tint}">${productImage(p)}</div>
            <div>
              <div class="cart-item__name">${p.name}</div>
              <div class="cart-item__price">${money(p.price)}</div>
            </div>
            <div class="cart-item__side">
              <div class="qty">
                <button type="button" data-dec="${id}" aria-label="Уменьшить количество">−</button>
                <span>${cart[id]}</span>
                <button type="button" data-inc="${id}" aria-label="Увеличить количество">+</button>
              </div>
              <button class="link-btn" type="button" data-remove="${id}">Удалить</button>
            </div>
          </div>`;
      }).join("")
    : `<p class="empty">В корзине пока пусто. Добавьте товар из каталога.</p>`;

  const { total, count } = getTotals();
  cartTotalEl.textContent = money(total);
  cartCountEl.textContent = count;
  checkoutBtn.disabled = ids.length === 0;
}

function replayAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;            
  el.classList.add(className);
}

function addToCart(id, button) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();

  replayAnimation(cartCountEl, "bump");           
  replayAnimation($("cart-btn"), "pulse");        

  if (button) {                                   
    button.classList.add("is-added");
    button.textContent = "Добавлено ✓";
    setTimeout(() => {
      button.classList.remove("is-added");
      button.textContent = "В корзину";
    }, 1000);
  }
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
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
  cartEl.classList.add("is-open");
  overlayEl.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  cartEl.classList.remove("is-open");
  overlayEl.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}


function openCheckout() {
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

orderForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const number = "V-" + Math.floor(100000 + Math.random() * 900000);
  $("order-number").textContent = number;

  cart = {};            
  saveCart();
  renderCart();
  orderForm.reset();

  orderForm.hidden = true;
  orderSuccess.hidden = false;
});


function selectCategory(name) {
  activeCategory = name;
  renderFilters();
  renderProducts();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;

  if (t.dataset.category) {
    selectCategory(t.dataset.category);
    if (t.classList.contains("hero__cat")) {
      $("catalog").scrollIntoView({ behavior: "smooth" });
    }
  }
  if (t.dataset.add)    addToCart(t.dataset.add, t);
  if (t.dataset.inc)    changeQty(t.dataset.inc, 1);
  if (t.dataset.dec)    changeQty(t.dataset.dec, -1);
  if (t.dataset.remove) removeFromCart(t.dataset.remove);
});

$("search").addEventListener("input", (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderProducts();
});

$("sort").addEventListener("change", (e) => {
  sortMode = e.target.value;
  renderProducts();
});

$("cart-btn").addEventListener("click", openCart);
$("cart-close").addEventListener("click", closeCart);
overlayEl.addEventListener("click", closeCart);
checkoutBtn.addEventListener("click", openCheckout);
$("modal-close").addEventListener("click", closeCheckout);
$("success-close").addEventListener("click", closeCheckout);
modalEl.addEventListener("click", (e) => { if (e.target === modalEl) closeCheckout(); });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeCart(); closeCheckout(); }
});


const headerEl = document.querySelector(".header");
window.addEventListener("scroll", () => {
  headerEl.classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });


renderFilters();
renderProducts();
renderCart();