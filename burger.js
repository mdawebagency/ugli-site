// Бургер-меню (справа сверху, три полоски) — на всех страницах.
// Структура как у них: телефон, «Получить карту», «Забронировать», «Войти» → разделы → соцсети → «Оплата и доставка».
// В разделах — все наши блоки и страницы. Motion — выезд панели, anime.js — пункты появляются по очереди.
import { animate as motionAnimate } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";
import { animate as animeAnimate, stagger as animeStagger } from "https://cdn.jsdelivr.net/npm/animejs@4/+esm";
import { lockScroll, unlockScroll } from "./scroll-lock.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = [0.22, 1, 0.36, 1];
const onHome = /(^\/$|index\.html$)/.test(location.pathname);
const home = (id) => (onHome ? `#${id}` : `index.html#${id}`);

const T = {
  ru: {
    open: "Открыть меню", close: "Закрыть меню", card: "Получить карту", book: "Забронировать", login: "Войти", delivery: "Оплата и доставка",
    links: ["О ресторане", "Новости и акции", "Меню и доставка", "Меню в PDF", "Банкеты", "Часто задаваемые вопросы", "Прямая связь с руководством", "Контакты"],
  },
  en: {
    open: "Open menu", close: "Close menu", card: "Get a card", book: "Book a table", login: "Log in", delivery: "Payment and delivery",
    links: ["About", "News", "Menu and delivery", "PDF menu", "Banquets", "FAQ", "Contact the management", "Contacts"],
  },
};
const hrefs = [home("about"), "news.html", "menu.html", "menu.html#pdf", "news.html#banquets", home("faq"), home("feedback"), home("contacts")];
const socials = [
  ["https://max.ru/u/f9LHodD0cOI1_cVaK9ztD3dzQzi-vCalgGqEfkl7UUvR3izO3-byCxwGWAs", "max-chat", "Max-chat"],
  ["https://t.me/ugli_ekb_bot", "tg-chat", "Telegram-chat"],
  ["https://wa.me/79321166490", "whatsapp", "Whatsapp"],
  ["https://max.ru/id6685197405_biz", "max-channel", "Max-channel"],
  ["https://t.me/ugli_ekb", "tg-channel", "Telegram-channel"],
  ["https://vk.com/ugli_ek", "vk", "VK"],
  ["http://instagram.com/ugli_ekb", "instagram", "Instagram*"],
  ["http://tripadvisor.ru/Restaurant_Review-g298540-d10687340-Reviews-Ugli-Yekaterinburg_Sverdlovsk_Oblast_Urals_District.html", "tripadvisor", "Tripadvisor"],
];
const lang = () => { try { return localStorage.getItem("ugli-lang") === "en" ? "en" : "ru"; } catch (e) { return "ru"; } };

// Кнопка из трёх полосок — в правый край шапки
const btn = document.createElement("button");
btn.className = "burger";
btn.type = "button";
btn.setAttribute("aria-expanded", "false");
btn.setAttribute("aria-controls", "drawer");
btn.innerHTML = "<span></span><span></span><span></span>";
document.querySelector(".header__actions")?.appendChild(btn);

// Панель
const drawer = document.createElement("div");
drawer.className = "drawer";
drawer.id = "drawer";
drawer.hidden = true;
drawer.setAttribute("role", "dialog");
drawer.setAttribute("aria-modal", "true");
drawer.innerHTML = `
  <div class="drawer__backdrop" data-dclose></div>
  <aside class="drawer__panel">
    <div class="drawer__top">
      <a class="drawer__phone" href="tel:+73432372401">+7 (343) 237-24-01</a>
      <button class="drawer__x" type="button" data-dclose>✕</button>
    </div>
    <div class="drawer__actions">
      <a class="btn btn--accent" href="#book" data-book data-t="book"></a>
      <a class="drawer__pill" href="https://ugli-ekb.ru/register/" data-t="card"></a>
      <a class="drawer__pill drawer__pill--login" href="https://ugli-ekb.ru/register/"><img src="assets/login.svg" alt="" width="18" height="18"><span data-t="login"></span></a>
    </div>
    <nav class="drawer__nav" aria-label="Разделы сайта" data-en-label="Site sections">
      ${hrefs.map((h, i) => `<a href="${h}"><i>${String(i + 1).padStart(2, "0")}</i><span data-link="${i}"></span></a>`).join("")}
    </nav>
    <div class="drawer__bottom">
      <div class="drawer__socials">
        ${socials.map(([h, icon, t]) => `<a class="social" href="${h}" target="_blank" rel="noopener" title="${t}" aria-label="${t}"><img src="assets/social/${icon}.svg" alt=""></a>`).join("")}
      </div>
      <a class="drawer__delivery" href="https://ugli-ekb.ru/usloviya-dostavki/" target="_blank" rel="noopener" data-t="delivery"></a>
    </div>
  </aside>`;
document.body.appendChild(drawer);

const panel = drawer.querySelector(".drawer__panel");
const backdrop = drawer.querySelector(".drawer__backdrop");

function localize() {
  const t = T[lang()];
  btn.setAttribute("aria-label", btn.getAttribute("aria-expanded") === "true" ? t.close : t.open);
  drawer.setAttribute("aria-label", t.open);
  drawer.querySelector(".drawer__x").setAttribute("aria-label", t.close);
  drawer.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t[el.dataset.t]; });
  drawer.querySelectorAll("[data-link]").forEach((el) => { el.textContent = t.links[+el.dataset.link]; });
}
localize();
document.querySelectorAll(".langs button").forEach((b) => b.addEventListener("click", () => setTimeout(localize, 0)));

function open() {
  localize();
  drawer.hidden = false;
  btn.setAttribute("aria-expanded", "true");
  btn.classList.add("is-open");
  lockScroll();
  if (!reduced) {
    motionAnimate(backdrop, { opacity: [0, 1] }, { duration: 0.35 });
    motionAnimate(panel, { x: ["100%", "0%"] }, { duration: 0.6, ease: easeOut });
    animeAnimate(drawer.querySelectorAll(".drawer__nav a, .drawer__socials .social"), {
      opacity: [0, 1], x: [30, 0], duration: 700, delay: animeStagger(35, { start: 180 }), ease: "outExpo",
    });
  }
  drawer.querySelector(".drawer__x").focus();
}

function close(then) {
  if (drawer.hidden) return;
  btn.setAttribute("aria-expanded", "false");
  btn.classList.remove("is-open");
  const done = () => {
    drawer.hidden = true;
    // если поверх открылось окно брони — прокрутку страницы не возвращаем
    if (document.querySelector(".bmodal")?.hidden !== false) unlockScroll();
    then?.();
  };
  if (reduced) return done();
  motionAnimate(backdrop, { opacity: 0 }, { duration: 0.3 });
  motionAnimate(panel, { x: "100%" }, { duration: 0.4, ease: [0.4, 0, 1, 1] }).then(done);
}

btn.addEventListener("click", () => (drawer.hidden ? open() : close(() => btn.focus())));
drawer.querySelectorAll("[data-dclose]").forEach((el) => el.addEventListener("click", () => close(() => btn.focus())));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) close(() => btn.focus()); });

// Пункты разделов: на текущей странице — плавно прокручиваем, иначе обычный переход
drawer.querySelectorAll(".drawer__nav a").forEach((a) => a.addEventListener("click", (e) => {
  const href = a.getAttribute("href");
  if (href.startsWith("#")) {
    e.preventDefault();
    close(() => document.querySelector(href)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }));
  } else {
    close();
  }
}));
// «Забронировать» в меню: закрываем панель — окно брони откроется само (booking.js)
drawer.querySelector("[data-book]").addEventListener("click", () => close());
