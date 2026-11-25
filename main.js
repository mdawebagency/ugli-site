// Motion — появление видео, шапки и элементов первого экрана
// anime.js — побуквенное появление заголовка и индикатор прокрутки
import { animate as motionAnimate, stagger as motionStagger, inView, scroll } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";
import { animate as animeAnimate, stagger as animeStagger } from "https://cdn.jsdelivr.net/npm/animejs@4/+esm";

document.documentElement.classList.add("js");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Языки: RU / EN (как в «Сойке») =====
// Русский текст берётся прямо со страницы. Английский: пункты меню и «Meat restaurant UGLI» —
// дословно с их английской версии ugli-ekb.ru/en, остальное — перевод их же русских текстов.
const EN = {
  docTitle: "Meat restaurant UGLI — Yekaterinburg",
  navMenu: "Menu and delivery",
  navBanquets: "Banquets",
  navNews: "News",
  navContacts: "Contacts",
  book: "Book a table",
  login: "Log in",
  heroTitle: "The largest selection of steaks in Yekaterinburg",
  heroLead: "All the best steaks come to us",
  btnBanquet: "Book a banquet",
  btnCard: "Get a card",
  btnDelivery: "Delivery menu",
  aboutTitle: "Meat restaurant UGLI",
  item1: "Signature dishes of meat, fish and seafood",
  item2: "Original desserts from our pastry chef",
  item3: "Signature teas and refreshing natural lemonades",
  item4: "Modern loft-style interior, comfortable tables and soft sofas for fun groups",
  item5: "A private room for groups of 8 or more, a comfortable separate hall for 25 guests",
  item6: "DJ sets on Fridays and Saturdays from 20:00",
  item7: "A separate banquet hall for weddings, corporate parties, wine tastings and other celebrations for up to 40 guests",
  fact1: "types of beef steaks",
  fact2: "wines on the list",
  fact3: "types of beer",
  fact4: "guests in the banquet hall",
  upTo: "up to ",
  promoTitle: "News",
  promoBtn: "View",
  menuTitle: "Menu",
  menuP1: "The menu is diverse — from the classic «Caesar» to crab cutlets.",
  menuP2: "Our chefs are ready to offer you 12 types of beef steaks, venison, lamb, turkey and fish dishes, as well as burgers, khachapuri and delicious signature cakes.",
  menuP3: "To go with them — 6 types of draft beer, 14 types of whisky, 120 wines, signature tea and cocktails from the bartenders of «UGLI».",
  menuBtn: "View menu",
  // подписка — тексты с их английской версии ugli-ekb.ru/en
  subTitle: "Subscribe to news",
  subText: "We provide special promotions and offers only to news subscribers.",
  subPh: "Your email",
  subBtn: "Subscribe",
  subAgree: "I agree to the",
  subAgreeLink: "processing of personal data",
  subErrEmail: "Enter your email",
  subErrAgree: "Please confirm your consent to the processing of personal data",
  subOk: "This is a demo version of the site: the subscription is not connected yet.",
  faqTitle: "Frequently asked questions",
  fbTitle: "Direct contact with the management",
  // контакты — с их английской версии (Contacts, адрес, Phone)
  contactsTitle: "Contacts", dMonThu: "Mon – Thu", dFriSat: "Fri – Sat", dSun: "Sun",
  address: "Yekaterinburg, st. Siberian tract 3", cPhone: "Phone", cBot: "Telegram chat bot",
  depBanquet: "Banquet manager:", depPurchase: "Purchasing department:", depMarketing: "Marketing department:", depHr: "Recruitment department:",
};
const RU = {
  docTitle: document.title, upTo: "до ",
  subErrEmail: "Введите почту",
  subErrAgree: "Подтвердите согласие на обработку персональных данных",
  subOk: "Это демо-версия сайта: подписка пока не подключена.",
};
document.querySelectorAll("[data-i18n]").forEach((el) => { RU[el.dataset.i18n] = el.textContent; });
document.querySelectorAll("[data-i18n-ph]").forEach((el) => { RU[el.dataset.i18nPh] = el.placeholder; });
const titleEl = document.querySelector("[data-split]");
RU.heroTitle = titleEl.textContent;

// Разбиваем заголовок на слова (маска) и буквы
function splitTitle(text) {
  titleEl.innerHTML = text
    .split(/(\s)/)
    .map((part) => {
      if (part === " ") return " ";
      if (part === " ") return "&nbsp;";
      if (!part) return "";
      const letters = [...part].map((ch) => `<span class="ch">${ch}</span>`).join("");
      return `<span class="word"><span>${letters}</span></span>`;
    })
    .join("");
}

let lang = "ru";
try { lang = localStorage.getItem("ugli-lang") === "en" ? "en" : "ru"; } catch (e) {}

function applyLang(next, animateTitle) {
  lang = next;
  const dict = next === "en" ? EN : RU;
  document.documentElement.lang = next;
  document.title = dict.docTitle;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const t = dict[el.dataset.i18n];
    if (t != null) el.textContent = t;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const t = dict[el.dataset.i18nPh];
    if (t != null) { el.placeholder = t; el.setAttribute("aria-label", t); }
  });
  document.querySelectorAll("[data-i18n-prefix]").forEach((dt) => {
    dt.dataset.prefix = dict.upTo;
    dt.textContent = dict.upTo + dt.dataset.count;
  });
  splitTitle(dict.heroTitle);
  if (animateTitle && !reduced) {
    animeAnimate(".hero__title .ch", { y: ["110%", "0%"], opacity: [0, 1], duration: 800, delay: animeStagger(12), ease: "outExpo" });
  }
  document.querySelectorAll(".langs button").forEach((b) => {
    const on = b.dataset.lang === next;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });
  try { localStorage.setItem("ugli-lang", next); } catch (e) {}
}
applyLang(lang, false);
document.querySelectorAll(".langs button").forEach((b) =>
  b.addEventListener("click", () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang, true); })
);

if (!reduced) {
  const video = document.querySelector(".hero__video");
  const items = document.querySelectorAll("[data-hero-item]");

  // 1. Видео плавно проявляется и «отъезжает»
  motionAnimate(video, { opacity: [0, 1], scale: [1.12, 1] }, { duration: 2.4, ease: [0.22, 1, 0.36, 1] });

  // 2. Шапка спускается сверху
  motionAnimate("[data-reveal-header]", { opacity: [0, 1], y: [-24, 0] }, { duration: 1, delay: 0.4, ease: "easeOut" });

  // 3. Заголовок — буквы поднимаются из-под маски (anime.js)
  animeAnimate(".hero__title .ch", {
    y: ["110%", "0%"],
    opacity: [0, 1],
    duration: 1100,
    delay: animeStagger(22, { start: 600 }),
    ease: "outExpo",
  });

  // 4. Подзаголовок, кнопки, нижняя строка — каскадом (Motion)
  motionAnimate(items, { opacity: [0, 1], y: [20, 0] }, {
    duration: 0.9,
    delay: motionStagger(0.12, { startDelay: 1.1 }),
    ease: [0.22, 1, 0.36, 1],
  });
} else {
  document.querySelector(".hero__video").style.opacity = 1;
}

// Фоновое видео: гарантированный повтор, даже если браузер не сработал по атрибуту loop
const heroVideo = document.querySelector(".hero__video");
const restartVideo = () => {
  heroVideo.currentTime = 0;
  heroVideo.play().catch(() => {});
};
heroVideo.addEventListener("ended", restartVideo);
// При сбое сети — одна-две аккуратные попытки перезагрузить, без бесконечного цикла
let videoRetries = 0;
heroVideo.addEventListener("error", () => {
  if (videoRetries >= 2) return;
  videoRetries += 1;
  setTimeout(() => {
    heroVideo.load();
    heroVideo.play().catch(() => {});
  }, 1500 * videoRetries);
});

// ===== Блок «О ресторане» (Motion) =====
const easeOut = [0.22, 1, 0.36, 1];

if (!reduced) {
  // Тексты и пункты списка — поднимаются по одному при появлении в кадре
  inView("[data-reveal]", (el) => {
    motionAnimate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.9, ease: easeOut });
  }, { margin: "0px 0px -10% 0px" });

  // Рамка с фото — «шторка» снизу вверх при первом появлении
  inView("[data-photo]", (frame) => {
    // радиус «шторки» берём из CSS рамки (на телефоне у баннеров он 0)
    const r = getComputedStyle(frame).borderTopLeftRadius;
    motionAnimate(frame, { clipPath: [`inset(100% 0% 0% 0% round ${r})`, `inset(0% 0% 0% 0% round ${r})`] }, { duration: 1.3, ease: easeOut })
      .then(() => { frame.style.clipPath = "none"; });
    const activeImg = frame.querySelector(".stage__img.is-active, .promo__slide.is-active img");
    if (activeImg) motionAnimate(activeImg, { scale: [1.2, 1] }, { duration: 1.8, ease: easeOut });
  }, { margin: "0px 0px -15% 0px" });

  // Пункты списка проявляются по одному
  inView(".about__list li", (li) => {
    motionAnimate(li, { opacity: [0, 1], x: [-16, 0] }, { duration: 0.8, ease: easeOut });
  }, { margin: "0px 0px -8% 0px" });

  // Цифры — счётчик от нуля
  inView(".about__facts dt", (dt) => {
    const to = +dt.dataset.count;
    const pre = dt.dataset.prefix || "";
    const suf = dt.dataset.suffix || "";
    motionAnimate(0, to, {
      duration: 1.6,
      ease: easeOut,
      onUpdate: (v) => (dt.textContent = pre + Math.round(v) + suf),
    });
  });
}

// ===== Фото под каждый пункт: плавное перетекание =====
// Motion — перелив фото (прозрачность + лёгкий зум и расфокус)
const steps = [...document.querySelectorAll(".about__list li")];
const photos = [...document.querySelectorAll(".stage__img")];
let current = 0;

function setStep(next) {
  if (next === current || !photos[next]) return;
  const prev = current;
  current = next;

  steps.forEach((li, i) => li.classList.toggle("is-active", i === next));

  const inImg = photos[next];
  const outImg = photos[prev];
  photos.forEach((p, i) => {
    if (i !== next && i !== prev) { p.style.opacity = 0; p.style.zIndex = 0; }
  });
  outImg.style.zIndex = 1;
  inImg.style.zIndex = 2;

  if (reduced) {
    inImg.style.opacity = 1;
    outImg.style.opacity = 0;
  } else {
    motionAnimate(inImg, { opacity: [0, 1], scale: [1.08, 1], filter: ["blur(8px)", "blur(0px)"] }, { duration: 1.1, ease: easeOut });
    motionAnimate(outImg, { opacity: 0, scale: 1.03 }, { duration: 1.1, ease: easeOut });
  }
}

// Активный пункт определяется автоматически при прокрутке: тот, что ближе всего
// к «линии чтения». На компьютере линия — середина экрана, на телефоне/планшете —
// чуть ниже закреплённого фото (верх экрана занят им). Клик тоже переключает.
const stage = document.querySelector(".about__stage");
const stacked = window.matchMedia("(max-width: 960px)");

function readingLine() {
  if (stacked.matches && stage) {
    const bottom = stage.getBoundingClientRect().bottom;
    return bottom + (window.innerHeight - bottom) * 0.3;
  }
  return window.innerHeight * 0.5;
}

let scrollTicking = false;
function pickStepByScroll() {
  scrollTicking = false;
  const line = readingLine();
  let best = 0;
  let bestDist = Infinity;
  steps.forEach((li, i) => {
    const r = li.getBoundingClientRect();
    const dist = line < r.top ? r.top - line : line > r.bottom ? line - r.bottom : 0;
    if (dist < bestDist) { bestDist = dist; best = i; }
  });
  setStep(best);
}
const onStepScroll = () => {
  if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(pickStepByScroll); }
};
window.addEventListener("scroll", onStepScroll, { passive: true });
window.addEventListener("resize", onStepScroll);
pickStepByScroll();

steps.forEach((li, i) => li.addEventListener("click", () => setStep(i)));

// ===== Новости и акции: слайд-шоу =====
// Каждые 3 секунды баннер плавно сменяется следующим (Motion), по кругу без остановок.
// На компьютере внутри баннера — медленное приближение (anime.js),
// на телефоне баннер показывается целиком и неподвижно.
// Пауза только когда блок вне экрана или вкладка свёрнута.
const show = document.querySelector(".promo__show");
if (show) {
  const slides = [...show.querySelectorAll(".promo__slide")];
  const HOLD = 3000;
  const FADE = 1;
  const phone = window.matchMedia("(max-width: 560px)");
  let idx = 0;
  let timer = null;
  let visible = false;

  // На телефоне баннер показывается целиком и неподвижно — без приближения
  const drift = (slide) => {
    if (reduced || phone.matches) return;
    animeAnimate(slide.querySelector("img"), { scale: [1, 1.05], duration: HOLD + FADE * 1000, ease: "linear" });
  };

  const next = () => {
    const prev = slides[idx];
    idx = (idx + 1) % slides.length;
    const cur = slides[idx];
    slides.forEach((s) => { if (s !== prev && s !== cur) s.style.zIndex = 0; });
    prev.style.zIndex = 1;
    cur.style.zIndex = 2;
    prev.classList.remove("is-active");
    cur.classList.add("is-active");
    if (reduced) {
      prev.style.opacity = 0;
      cur.style.opacity = 1;
      return;
    }
    motionAnimate(cur, { opacity: [0, 1] }, { duration: FADE, ease: easeOut });
    motionAnimate(prev, { opacity: 0 }, { duration: FADE, ease: easeOut });
    drift(cur);
  };

  const sync = () => {
    const run = visible && !document.hidden;
    if (run && !timer) timer = setInterval(next, HOLD);
    if (!run && timer) { clearInterval(timer); timer = null; }
  };

  inView(show, () => {
    visible = true;
    sync();
    return () => { visible = false; sync(); };
  }, { amount: 0.2 });
  document.addEventListener("visibilitychange", sync);
  drift(slides[0]);
}

// ===== Меню: карусель фото =====
// 1) При прокрутке страницы лента сама плавно едет вбок (Motion scroll — прогресс блока на экране).
// 2) Стрелки по бокам сдвигают ленту на несколько фото (Motion), стрелка «пружинит» (anime.js).
// 3) На телефоне ленту можно листать пальцем — движение от прокрутки продолжается от этого места.
// 4) Появление карточек «волной», через одну выше/ниже (anime.js).
const track = document.querySelector("[data-menu-track]");
if (track) {
  const prevBtn = document.querySelector("[data-menu-prev]");
  const nextBtn = document.querySelector("[data-menu-next]");
  const cards = [...track.querySelectorAll(".menu__card")];
  const carousel = track.closest(".menu__carousel");

  let base = 0;        // сдвиг от стрелок/свайпа
  let progress = 0;    // 0..1 — насколько блок прошёл по экрану
  let selfScroll = false;
  let sliding = null;

  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const driftRange = () => Math.min(maxScroll() * 0.6, window.innerWidth * 0.55);
  const clamp = (v) => Math.max(0, Math.min(maxScroll(), v));

  const updateArrows = () => {
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = track.scrollLeft >= maxScroll() - 2;
  };

  const render = () => {
    selfScroll = true;
    track.scrollLeft = clamp(base + (reduced ? 0 : progress * driftRange()));
    requestAnimationFrame(() => { selfScroll = false; });
    updateArrows();
  };

  // Прокрутка страницы → лента едет влево (вперёд по фото), обратно — вправо
  if (!reduced) {
    scroll((p) => { progress = p; if (!sliding) render(); }, {
      target: carousel,
      offset: ["start end", "end start"],
    });
  }

  // Ручной свайп/тачпад: запоминаем, где оставил человек
  track.addEventListener("scroll", () => {
    if (selfScroll || sliding) { updateArrows(); return; }
    base = track.scrollLeft - (reduced ? 0 : progress * driftRange());
    updateArrows();
  }, { passive: true });

  const step = () => {
    const cardW = cards[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const perView = Math.max(1, Math.floor((track.clientWidth + gap) / (cardW + gap)) - (window.innerWidth > 560 ? 1 : 0));
    return perView * (cardW + gap);
  };

  const slide = (dir) => {
    const drift = reduced ? 0 : progress * driftRange();
    const from = track.scrollLeft;
    const to = clamp(from + dir * step());
    if (sliding) sliding.stop();
    sliding = motionAnimate(from, to, {
      duration: reduced ? 0 : 0.9,
      ease: easeOut,
      onUpdate: (v) => { selfScroll = true; track.scrollLeft = v; updateArrows(); },
      onComplete: () => { base = to - drift; sliding = null; selfScroll = false; render(); },
    });
  };

  const press = (btn) => {
    if (reduced) return;
    animeAnimate(btn, { scale: [0.86, 1], duration: 500, ease: "outElastic(1, .6)" });
  };

  prevBtn.addEventListener("click", () => { press(prevBtn); slide(-1); });
  nextBtn.addEventListener("click", () => { press(nextBtn); slide(1); });
  window.addEventListener("resize", render);
  render();

  if (!reduced) {
    inView(track, () => {
      animeAnimate(cards, {
        opacity: [0, 1],
        y: (el, i) => [i % 2 ? 90 : 60, 0],
        duration: 1000,
        delay: animeStagger(70),
        ease: "outExpo",
      });
    }, { amount: 0.2 });
  }
}

// ===== Подписка на рассылку =====
// Проверяем почту и галочку согласия. Отправка подключается к их рассылке при запуске сайта —
// сейчас форма никуда данные не отправляет.
const subForm = document.querySelector("[data-subscribe]");
if (subForm) {
  const email = subForm.querySelector('input[name="email"]');
  const agree = subForm.querySelector('input[name="agree"]');
  const check = subForm.querySelector(".subscribe__check");
  const msg = subForm.querySelector(".subscribe__msg");
  const t = (k) => (lang === "en" ? EN : RU)[k];
  const shake = (el) => { if (!reduced) animeAnimate(el, { x: [0, -8, 8, -5, 5, 0], duration: 420, ease: "inOutSine" }); };

  email.addEventListener("input", () => { email.classList.remove("is-error"); msg.textContent = ""; });
  agree.addEventListener("change", () => { check.classList.remove("is-error"); msg.textContent = ""; });

  subForm.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.classList.remove("is-ok");
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!okEmail) {
      email.classList.add("is-error"); msg.textContent = t("subErrEmail"); shake(email); email.focus(); return;
    }
    if (!agree.checked) {
      check.classList.add("is-error"); msg.textContent = t("subErrAgree"); shake(check); return;
    }
    msg.textContent = t("subOk");
    msg.classList.add("is-ok");
    if (!reduced) motionAnimate(msg, { opacity: [0, 1], y: [8, 0] }, { duration: 0.5, ease: easeOut });
    subForm.reset();
  });
}

// ===== Часто задаваемые вопросы: ответ плавно раскрывается (Motion), открыт один за раз =====
const faqButtons = [...document.querySelectorAll(".faq__q button")];
function toggleFaq(btn, open) {
  const panel = document.getElementById(btn.getAttribute("aria-controls"));
  if (open === (btn.getAttribute("aria-expanded") === "true")) return;
  btn.setAttribute("aria-expanded", open);
  if (reduced) { panel.hidden = !open; return; }
  if (open) {
    panel.hidden = false;
    const h = panel.scrollHeight;
    motionAnimate(panel, { height: [0, h], opacity: [0, 1] }, { duration: 0.5, ease: easeOut })
      .then(() => { panel.style.height = "auto"; });
  } else {
    motionAnimate(panel, { height: [panel.offsetHeight, 0], opacity: [1, 0] }, { duration: 0.4, ease: easeOut })
      .then(() => { if (btn.getAttribute("aria-expanded") === "false") panel.hidden = true; });
  }
}
faqButtons.forEach((btn) => btn.addEventListener("click", () => {
  const willOpen = btn.getAttribute("aria-expanded") !== "true";
  faqButtons.forEach((b) => { if (b !== btn) toggleFaq(b, false); });
  toggleFaq(btn, willOpen);
}));
if (!reduced) {
  inView(".faq__list", (list) => {
    animeAnimate(list.querySelectorAll(".faq__item"), { opacity: [0, 1], y: [20, 0], duration: 800, delay: animeStagger(60), ease: "outExpo" });
  }, { amount: 0.15 });
}

// ===== Прямая связь с руководством: проверка полей =====
// Как и подписка, пока никуда не отправляет — подключается к их почте/CRM при запуске сайта.
const fbForm = document.querySelector("[data-feedback]");
if (fbForm) {
  const msg = fbForm.querySelector(".subscribe__msg");
  const check = fbForm.querySelector(".subscribe__check");
  const T = {
    ru: { contact: "Укажите почту или телефон, чтобы мы могли с вами связаться", comment: "Напишите комментарий", agree: "Подтвердите согласие на обработку персональных данных", ok: "Это демо-версия сайта: сообщение пока не отправляется. Связаться с рестораном: +7 (343) 237-24-01." },
    en: { contact: "Please leave your email or phone so we can contact you", comment: "Please write a comment", agree: "Please confirm your consent to the processing of personal data", ok: "This is a demo version of the site: the message is not sent yet. Contact the restaurant: +7 (343) 237-24-01." },
  };
  const fail = (el, text) => {
    msg.classList.remove("is-ok");
    msg.textContent = text;
    if (el) { el.classList.add("is-error"); if (!reduced) animeAnimate(el, { x: [0, -8, 8, -5, 5, 0], duration: 420, ease: "inOutSine" }); el.focus?.(); }
  };
  fbForm.addEventListener("input", (e) => { e.target.classList?.remove("is-error"); check.classList.remove("is-error"); msg.textContent = ""; });
  fbForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = T[lang] || T.ru;
    const f = fbForm.elements;
    const email = f.email.value.trim();
    const phone = f.phone.value.replace(/\D/g, "");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk && phone.length < 10) return fail(email ? f.email : f.phone, t.contact);
    if (!f.comment.value.trim()) return fail(f.comment, t.comment);
    if (!f.agree.checked) { check.classList.add("is-error"); return fail(null, t.agree); }
    fbForm.querySelectorAll(".is-error").forEach((el) => el.classList.remove("is-error"));
    msg.textContent = t.ok;
    msg.classList.add("is-ok");
    if (!reduced) motionAnimate(msg, { opacity: [0, 1], y: [8, 0] }, { duration: 0.5, ease: easeOut });
    fbForm.reset();
  });
}

// ===== Телефон: плавающая кнопка «Забронировать» =====
// Появляется вместе с кнопками первого экрана и дальше всегда остаётся внизу по центру.
const bookFloat = document.querySelector("[data-book-float]");
if (bookFloat && !reduced) {
  motionAnimate(bookFloat, { opacity: [0, 1], y: [24, 0] }, { duration: 0.8, delay: 1.6, ease: easeOut });
}

// Шапка становится зелёной при прокрутке
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
