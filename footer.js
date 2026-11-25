// Подвал: бесконечная лента «Рекомендуем к посещению» (едет сама по кругу, тянется мышью/пальцем, стрелки — Motion)
// и появление карточек и иконок соцсетей «волной» (anime.js).
import { animate as motionAnimate, inView } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";
import { animate as animeAnimate, stagger as animeStagger } from "https://cdn.jsdelivr.net/npm/animejs@4/+esm";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = [0.22, 1, 0.36, 1];

// Подписи подвала на английском (как на их /en: «Оплата и доставка» там не переведено — переводим сами)
const EN = { partnersTitle: "We recommend visiting", fDelivery: "Payment and delivery", fPolicy: "Privacy policy", fData: "Personal data processing" };
const footer = document.querySelector(".site-footer");
const RU = {};
footer.querySelectorAll("[data-i18n]").forEach((el) => { RU[el.dataset.i18n] = el.textContent; });
const applyLang = () => {
  let lang = "ru";
  try { lang = localStorage.getItem("ugli-lang") === "en" ? "en" : "ru"; } catch (e) {}
  const dict = lang === "en" ? EN : RU;
  footer.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = dict[el.dataset.i18n]; });
};
applyLang();
document.querySelectorAll(".langs button").forEach((b) => b.addEventListener("click", () => setTimeout(applyLang, 0)));

const track = footer.querySelector("[data-partners-track]");
const viewport = footer.querySelector(".partners__viewport");

// ===== Бесконечная лента по кругу =====
// Карточки дублируются, лента непрерывно едет влево (requestAnimationFrame); когда первый набор уехал целиком —
// незаметно перескакиваем на начало, поэтому кажется, что карточки идут по кругу без конца.
// Мышью или пальцем ленту можно тянуть в любую сторону, после отпускания она мягко «докатывается» и едет дальше.
// Стрелки плавно сдвигают на одну карточку (Motion). При наведении лента замедляется.
const originals = [...track.children];
const fill = () => {
  // добавляем копии, пока лента не станет минимум вдвое шире экрана
  while (track.scrollWidth < viewport.clientWidth * 2 + setWidth()) {
    originals.forEach((el) => {
      const c = el.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.tabIndex = -1;
      track.appendChild(c);
    });
  }
};
const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
const setWidth = () => originals.reduce((w, el) => w + el.getBoundingClientRect().width, 0) + gap() * originals.length;
const cardStep = () => originals[0].getBoundingClientRect().width + gap();

const SPEED = 90;            // пикселей в секунду
let offset = 0;              // насколько лента уехала влево
let speedK = 1;              // множитель скорости (наведение — медленнее)
let visible = false;
let dragging = false;
let velocity = 0;            // скорость «докатывания» после перетаскивания
let nudge = null;            // анимация от стрелок
let last = performance.now();

const wrap = () => {
  const w = setWidth();
  if (w <= 0) return;
  offset = ((offset % w) + w) % w;
};
const render = () => { track.style.transform = `translateX(${-offset}px)`; };

function tick(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (visible && !document.hidden && !dragging && !nudge) {
    if (Math.abs(velocity) > 5) {
      offset += velocity * dt;        // инерция после броска
      velocity *= Math.pow(0.04, dt); // плавное затухание
    } else if (!reduced) {
      velocity = 0;
      offset += SPEED * speedK * dt;
    }
    wrap();
    render();
  }
  requestAnimationFrame(tick);
}

// Перетаскивание (мышь и палец)
let startX = 0, startOffset = 0, lastX = 0, lastT = 0, moved = 0;
viewport.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  dragging = true;
  nudge?.stop(); nudge = null;
  velocity = 0;
  startX = lastX = e.clientX;
  lastT = performance.now();
  startOffset = offset;
  moved = 0;
  viewport.setPointerCapture(e.pointerId);
  viewport.classList.add("is-dragging");
});
viewport.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const now = performance.now();
  offset = startOffset - (e.clientX - startX);
  moved = Math.max(moved, Math.abs(e.clientX - startX));
  const dt = (now - lastT) / 1000;
  if (dt > 0) velocity = -(e.clientX - lastX) / dt;
  lastX = e.clientX; lastT = now;
  wrap(); render();
});
const endDrag = () => {
  if (!dragging) return;
  dragging = false;
  viewport.classList.remove("is-dragging");
  velocity = Math.max(-2500, Math.min(2500, velocity));
  last = performance.now();
};
viewport.addEventListener("pointerup", endDrag);
viewport.addEventListener("pointercancel", endDrag);
// если тянули — не открываем ссылку под пальцем
viewport.addEventListener("click", (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
viewport.addEventListener("dragstart", (e) => e.preventDefault());

// Стрелки — плавный сдвиг на одну карточку
const go = (dir) => {
  nudge?.stop();
  velocity = 0;
  const from = offset;
  nudge = motionAnimate(from, from + dir * cardStep(), {
    duration: reduced ? 0 : 0.7,
    ease: easeOut,
    onUpdate: (v) => { offset = v; wrap(); render(); },
    onComplete: () => { nudge = null; last = performance.now(); },
  });
};
footer.querySelector("[data-partners-next]").addEventListener("click", () => go(1));
footer.querySelector("[data-partners-prev]").addEventListener("click", () => go(-1));

viewport.addEventListener("mouseenter", () => { speedK = 0.35; });
viewport.addEventListener("mouseleave", () => { speedK = 1; });
window.addEventListener("resize", () => { fill(); wrap(); render(); });

fill();
requestAnimationFrame(tick);

inView(footer, () => {
  visible = true;
  last = performance.now();
  if (!reduced && !footer.dataset.shown) {
    footer.dataset.shown = "1";
    animeAnimate(track.children, { opacity: [0, 1], y: [30, 0], duration: 900, delay: animeStagger(60), ease: "outExpo" });
    animeAnimate(footer.querySelectorAll(".site-footer__bottom .social"), { opacity: [0, 1], scale: [0.6, 1], duration: 700, delay: animeStagger(50, { start: 300 }), ease: "outBack" });
  }
  return () => { visible = false; };
}, { amount: 0.1 });
