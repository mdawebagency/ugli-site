// Окно «Бронирование стола» — поля и тексты как на ugli-ekb.ru, стиль наш.
// Подключается на всех страницах; открывается любой кнопкой «Забронировать»
// (ссылки с ?reserve и элементы с data-book). Motion — открытие окна, anime.js — счётчик гостей и ошибки.
// Отправка заявки подключается к их системе брони при запуске сайта — сейчас данные никуда не уходят.
import { animate as motionAnimate } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";
import { animate as animeAnimate } from "https://cdn.jsdelivr.net/npm/animejs@4/+esm";
import { lockScroll, unlockScroll } from "./scroll-lock.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = [0.22, 1, 0.36, 1];

const T = {
  ru: {
    title: "Бронирование стола", name: "Имя", surname: "Фамилия", phone: "Телефон", guests: "Количество персон",
    date: "Дата", time: "Время", comment: "Комментарий", submit: "Забронировать",
    oferta: "Нажимая кнопку «Забронировать» вы соглашаетесь с", policy: "политикой конфиденциальности",
    close: "Закрыть", less: "Меньше гостей", more: "Больше гостей",
    errName: "Укажите имя", errPhone: "Укажите телефон", errDate: "Выберите дату", errTime: "Выберите время",
    ok: "Это демо-версия сайта: заявка пока не отправляется. Чтобы забронировать стол, позвоните +7 (343) 237-24-01.",
  },
  en: {
    title: "Table reservation", name: "Name", surname: "Surname", phone: "Phone", guests: "Number of guests",
    date: "Date", time: "Time", comment: "Comment", submit: "Book a table",
    oferta: "By clicking «Book a table» you agree to the", policy: "privacy policy",
    close: "Close", less: "Fewer guests", more: "More guests",
    errName: "Enter your name", errPhone: "Enter your phone number", errDate: "Choose a date", errTime: "Choose a time",
    ok: "This is a demo version of the site: the request is not sent yet. To book a table, call +7 (343) 237-24-01.",
  },
};
const lang = () => { try { return localStorage.getItem("ugli-lang") === "en" ? "en" : "ru"; } catch (e) { return "ru"; } };

// Время брони по часам работы с их сайта: ПН–ЧТ и ВС 11:30–00:00, ПТ–СБ 11:30–02:00.
// Последняя бронь — за полчаса до закрытия.
const slotList = (late) => {
  const out = [];
  const last = late ? 25 * 60 + 30 : 23 * 60 + 30;
  for (let m = 11 * 60 + 30; m <= last; m += 30) {
    const h = Math.floor(m / 60) % 24;
    out.push(`${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
};
const times = slotList(false);

const root = document.createElement("div");
root.className = "bmodal";
root.hidden = true;
root.setAttribute("role", "dialog");
root.setAttribute("aria-modal", "true");
root.setAttribute("aria-labelledby", "bmodal-title");
root.innerHTML = `
  <div class="bmodal__backdrop" data-bclose></div>
  <div class="bmodal__card">
    <button class="bmodal__x" type="button" data-bclose data-t-label="close">✕</button>
    <h2 class="bmodal__title" id="bmodal-title" data-t="title"></h2>
    <form class="bmodal__form" novalidate>
      <input class="bfield" name="name" type="text" autocomplete="given-name" data-t-ph="name">
      <input class="bfield" name="surname" type="text" autocomplete="family-name" data-t-ph="surname">
      <input class="bfield" name="phone" type="tel" autocomplete="tel" data-t-ph="phone">
      <div class="bguests">
        <span class="bguests__label" data-t="guests"></span>
        <button type="button" class="bguests__btn" data-step="-1" data-t-label="less">−</button>
        <input class="bguests__val" name="guests" type="text" inputmode="numeric" value="1" aria-live="polite" data-t-label="guests">
        <button type="button" class="bguests__btn" data-step="1" data-t-label="more">+</button>
      </div>
      <label class="bfield bfield--date"><span data-t="date"></span><input name="date" type="date"></label>
      <label class="bfield bfield--date"><span data-t="time"></span>
        <select name="time"><option value="">—</option>${times.map((t) => `<option>${t}</option>`).join("")}</select>
      </label>
      <textarea class="bfield bfield--area" name="comment" rows="3" data-t-ph="comment"></textarea>
      <button class="btn btn--accent bmodal__submit" type="submit" data-t="submit"></button>
      <p class="bmodal__oferta"><span data-t="oferta"></span> <a href="https://ugli-ekb.ru/policy/" target="_blank" rel="noopener" data-t="policy"></a></p>
      <p class="bmodal__msg" role="status" aria-live="polite"></p>
    </form>
  </div>`;
document.body.appendChild(root);

const card = root.querySelector(".bmodal__card");
const backdrop = root.querySelector(".bmodal__backdrop");
const form = root.querySelector("form");
const msg = root.querySelector(".bmodal__msg");
const guests = form.elements.guests;
let lastFocus = null;

function localize() {
  const t = T[lang()];
  root.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t[el.dataset.t]; });
  root.querySelectorAll("[data-t-ph]").forEach((el) => { el.placeholder = t[el.dataset.tPh]; el.setAttribute("aria-label", t[el.dataset.tPh]); });
  root.querySelectorAll("[data-t-label]").forEach((el) => el.setAttribute("aria-label", t[el.dataset.tLabel]));
}

function open(e) {
  if (e) e.preventDefault();
  localize();
  lastFocus = document.activeElement;
  const today = new Date();
  form.elements.date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  msg.textContent = "";
  msg.classList.remove("is-ok");
  root.hidden = false;
  lockScroll();
  if (!reduced) {
    motionAnimate(backdrop, { opacity: [0, 1] }, { duration: 0.35 });
    motionAnimate(card, { opacity: [0, 1], y: [40, 0], scale: [0.98, 1] }, { duration: 0.6, ease: easeOut });
  }
  form.elements.name.focus();
}

function close() {
  if (root.hidden) return;
  const done = () => { root.hidden = true; unlockScroll(); lastFocus?.focus?.(); };
  if (reduced) return done();
  motionAnimate(backdrop, { opacity: 0 }, { duration: 0.25 });
  motionAnimate(card, { opacity: 0, y: 30 }, { duration: 0.3, ease: "easeIn" }).then(done);
}

// Все «Забронировать» на сайте открывают это окно
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href*="?reserve"], [data-book]');
  if (a) open(e);
});
root.querySelectorAll("[data-bclose]").forEach((el) => el.addEventListener("click", close));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

// Количество персон: − и +
root.querySelectorAll(".bguests__btn").forEach((b) => b.addEventListener("click", () => {
  const v = Math.min(99, Math.max(1, (parseInt(guests.value, 10) || 1) + Number(b.dataset.step)));
  guests.value = v;
  if (!reduced) animeAnimate(guests, { scale: [1.25, 1], duration: 350, ease: "outBack" });
}));
guests.addEventListener("input", () => { guests.value = guests.value.replace(/\D/g, "").slice(0, 2); });
guests.addEventListener("blur", () => { if (!(parseInt(guests.value, 10) > 0)) guests.value = 1; });

form.addEventListener("input", (e) => { e.target.closest(".bfield")?.classList.remove("is-error"); msg.textContent = ""; });
form.addEventListener("change", (e) => { e.target.closest(".bfield")?.classList.remove("is-error"); });

// Пятница и суббота — можно выбрать время до 01:30
form.elements.date.addEventListener("change", () => {
  const sel = form.elements.time;
  const v = form.elements.date.value;
  const day = v ? new Date(`${v}T12:00:00`).getDay() : -1;
  const keep = sel.value;
  const list = slotList(day === 5 || day === 6);
  sel.innerHTML = `<option value="">—</option>${list.map((t) => `<option>${t}</option>`).join("")}`;
  if (list.includes(keep)) sel.value = keep;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const t = T[lang()];
  const f = form.elements;
  const fail = (input, text) => {
    const box = input.closest(".bfield") || input;
    box.classList.add("is-error");
    msg.classList.remove("is-ok");
    msg.textContent = text;
    if (!reduced) animeAnimate(box, { x: [0, -8, 8, -5, 5, 0], duration: 420, ease: "inOutSine" });
    input.focus();
  };
  if (!f.name.value.trim()) return fail(f.name, t.errName);
  if (f.phone.value.replace(/\D/g, "").length < 10) return fail(f.phone, t.errPhone);
  if (!f.date.value) return fail(f.date, t.errDate);
  if (!f.time.value) return fail(f.time, t.errTime);
  msg.textContent = t.ok;
  msg.classList.add("is-ok");
  if (!reduced) motionAnimate(msg, { opacity: [0, 1], y: [8, 0] }, { duration: 0.5, ease: easeOut });
  form.reset();
  guests.value = 1;
});
