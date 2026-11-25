// Страница меню.
// Motion — появление карточек и плавная прокрутка к разделу; anime.js — «пружинка» активного раздела в ленте.
import { animate as motionAnimate, stagger as motionStagger, inView } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";
import { animate as animeAnimate } from "https://cdn.jsdelivr.net/npm/animejs@4/+esm";

document.documentElement.classList.add("js");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = [0.22, 1, 0.36, 1];

// ===== Язык (тот же выбор, что на главной) =====
// Названия блюд и описания — только на русском, как у ресторана.
const EN = {
  navMenu: "Menu and delivery", navBanquets: "Banquets", navNews: "News", navContacts: "Contacts",
  book: "Book a table", login: "Log in", back: "← Back to home", menuTitle: "Menu",
  pdfChip: "PDF menu", pdfTitle: "PDF Menu",
  pdfNote: "Dear guests! These PDF menus are promotional material. The official menu is available from the restaurant administration.",
  docTitle: "Menu — meat restaurant UGLI, Yekaterinburg",
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

// ===== Появление карточек блюд по разделам =====
if (!reduced) {
  inView(".mcat__grid", (grid) => {
    const items = grid.querySelectorAll(".dish");
    motionAnimate(items, { opacity: [0, 1], y: [28, 0] }, { duration: 0.7, delay: motionStagger(0.04), ease: easeOut });
  }, { margin: "0px 0px -10% 0px" });
}

// ===== Меню в PDF: обложки выезжают сразу при открытии страницы, лента листается стрелками =====
const pdfStrip = document.querySelector("[data-pdf-strip]");
if (pdfStrip) {
  const pdfCards = pdfStrip.querySelectorAll(".pdf");
  if (!reduced) {
    animeAnimate(pdfCards, { opacity: [0, 1], x: [40, 0], duration: 900, delay: (el, i) => 250 + i * 60, ease: "outExpo" });
    // плашка «дышит» один раз, чтобы гость её заметил
    animeAnimate(".mpdf", { scale: [0.97, 1], opacity: [0, 1], duration: 900, ease: "outExpo" });
  } else {
    pdfCards.forEach((c) => { c.style.opacity = 1; });
  }

  const prev = document.querySelector("[data-pdf-prev]");
  const next = document.querySelector("[data-pdf-next]");
  const maxS = () => pdfStrip.scrollWidth - pdfStrip.clientWidth;
  const upd = () => { prev.disabled = pdfStrip.scrollLeft <= 2; next.disabled = pdfStrip.scrollLeft >= maxS() - 2; };
  const go = (dir) => {
    const to = Math.max(0, Math.min(maxS(), pdfStrip.scrollLeft + dir * pdfStrip.clientWidth * 0.8));
    motionAnimate(pdfStrip.scrollLeft, to, { duration: reduced ? 0 : 0.8, ease: easeOut, onUpdate: (v) => { pdfStrip.scrollLeft = v; } });
  };
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  pdfStrip.addEventListener("scroll", upd, { passive: true });
  window.addEventListener("resize", upd);
  upd();
}

// ===== Лента разделов: подсветка текущего и прокрутка =====
const chips = [...document.querySelectorAll(".mchip")];
const chipTrack = document.querySelector(".mchips__track");
const sections = chips.map((c) => document.querySelector(c.getAttribute("href")));
let activeIdx = -1;

function setActive(i) {
  if (i === activeIdx) return;
  activeIdx = i;
  chips.forEach((c, k) => c.classList.toggle("is-active", k === i));
  const chip = chips[i];
  if (!chip) return;
  // держим активный раздел в видимой части ленты
  const target = chip.offsetLeft - chipTrack.clientWidth / 2 + chip.offsetWidth / 2;
  motionAnimate(chipTrack.scrollLeft, Math.max(0, target), {
    duration: reduced ? 0 : 0.5, ease: easeOut, onUpdate: (v) => { chipTrack.scrollLeft = v; },
  });
  if (!reduced) animeAnimate(chip, { scale: [0.92, 1], duration: 450, ease: "outElastic(1, .7)" });
}

let ticking = false;
function spy() {
  ticking = false;
  const line = 170;
  let idx = 0;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top - line <= 0) idx = i; });
  setActive(idx);
}
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
spy();

chips.forEach((chip, i) => chip.addEventListener("click", (e) => {
  const s = sections[i];
  if (!s) return;
  e.preventDefault();
  const to = s.getBoundingClientRect().top + window.scrollY - 140;
  motionAnimate(window.scrollY, to, {
    duration: reduced ? 0 : 0.9, ease: easeOut, onUpdate: (v) => window.scrollTo(0, v),
  });
  history.replaceState(null, "", chip.getAttribute("href"));
}));

// ===== Плавающая кнопка «Забронировать» (телефон) =====
const bookFloat = document.querySelector(".book-float");
if (bookFloat && !reduced) motionAnimate(bookFloat, { opacity: [0, 1], y: [24, 0] }, { duration: 0.8, delay: 0.6, ease: easeOut });
