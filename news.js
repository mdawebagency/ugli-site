// Страница «Новости и акции».
// Motion — появление карточек и открытие/закрытие окна новости; anime.js — «волна» фото банкетного зала.
import { animate as motionAnimate, stagger as motionStagger, inView } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";
import { animate as animeAnimate, stagger as animeStagger } from "https://cdn.jsdelivr.net/npm/animejs@4/+esm";

document.documentElement.classList.add("js");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = [0.22, 1, 0.36, 1];

// ===== Язык (общий выбор с главной). Тексты новостей — на русском, как у ресторана =====
const EN = {
  docTitle: "News — meat restaurant UGLI, Yekaterinburg",
  book: "Book a table", login: "Log in", back: "← Back to home", newsTitle: "News",
  banqTitle: "A banquet hall for your perfect event!", banqMenus: "Banquet menus", banqBtn: "Leave a request",
};
const RU = { docTitle: document.title };
document.querySelectorAll("[data-i18n]").forEach((el) => { RU[el.dataset.i18n] = el.textContent; });
document.querySelectorAll("[data-en]").forEach((el) => { el.dataset.ru = el.textContent; });
let lang = "ru";
try { lang = localStorage.getItem("ugli-lang") === "en" ? "en" : "ru"; } catch (e) {}
function applyLang(next) {
  lang = next;
  const dict = next === "en" ? EN : RU;
  document.documentElement.lang = next;
  document.title = dict.docTitle;
  document.querySelectorAll("[data-i18n]").forEach((el) => { if (dict[el.dataset.i18n] != null) el.textContent = dict[el.dataset.i18n]; });
  document.querySelectorAll("[data-en]").forEach((el) => { el.textContent = next === "en" ? el.dataset.en : el.dataset.ru; });
  document.querySelectorAll(".langs button").forEach((b) => {
    const on = b.dataset.lang === next;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });
  try { localStorage.setItem("ugli-lang", next); } catch (e) {}
}
applyLang(lang);
document.querySelectorAll(".langs button").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

// ===== Карточки появляются рядами =====
if (!reduced) {
  inView(".news__grid", (grid) => {
    motionAnimate(grid.querySelectorAll(".ncard"), { opacity: [0, 1], y: [30, 0] }, { duration: 0.8, delay: motionStagger(0.05), ease: easeOut });
  });
  inView(".banq__photos", (box) => {
    animeAnimate(box.querySelectorAll("img"), { opacity: [0, 1], scale: [0.94, 1], duration: 900, delay: animeStagger(90), ease: "outExpo" });
  }, { amount: 0.2 });
}

// ===== Окно с полной новостью (адрес вида news.html#slug — можно поделиться ссылкой) =====
const modal = document.querySelector(".nmodal");
const card = modal.querySelector(".nmodal__card");
const content = modal.querySelector(".nmodal__content");
const backdrop = modal.querySelector(".nmodal__backdrop");
let lastFocus = null;

function openNews(slug, push) {
  // английский вариант новости, если включён EN
  const tpl = (lang === "en" && document.getElementById(`news-${slug}-en`)) || document.getElementById(`news-${slug}`);
  if (!tpl) return;
  lastFocus = document.activeElement;
  content.replaceChildren(tpl.content.cloneNode(true));
  card.scrollTop = 0;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  if (push) history.pushState(null, "", `#${slug}`);
  if (!reduced) {
    motionAnimate(backdrop, { opacity: [0, 1] }, { duration: 0.35 });
    motionAnimate(card, { opacity: [0, 1], y: [40, 0], scale: [0.98, 1] }, { duration: 0.6, ease: easeOut });
  }
  modal.querySelector(".nmodal__x").focus();
}

function closeNews(pop) {
  if (modal.hidden) return;
  const done = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    content.replaceChildren();
    if (lastFocus) lastFocus.focus();
  };
  if (!pop) history.pushState(null, "", location.pathname);
  if (reduced) return done();
  motionAnimate(backdrop, { opacity: 0 }, { duration: 0.25 });
  motionAnimate(card, { opacity: 0, y: 30 }, { duration: 0.3, ease: "easeIn" }).then(done);
}

document.querySelectorAll("[data-news]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  openNews(a.dataset.news, true);
}));
modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => closeNews(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNews(false); });
window.addEventListener("popstate", () => {
  const slug = location.hash.slice(1);
  if (slug && document.getElementById(`news-${slug}`)) openNews(slug, false); else closeNews(true);
});
// открыть сразу, если пришли по ссылке на конкретную новость
const initial = location.hash.slice(1);
if (initial && document.getElementById(`news-${initial}`)) openNews(initial, false);
else if (initial === "banquets") document.getElementById("banquets")?.scrollIntoView();

// ===== Плавающая кнопка «Забронировать» (телефон) =====
const bookFloat = document.querySelector(".book-float");
if (bookFloat && !reduced) motionAnimate(bookFloat, { opacity: [0, 1], y: [24, 0] }, { duration: 0.8, delay: 0.6, ease: easeOut });
