// Блокировка прокрутки страницы под окнами (меню, бронь) без «прыжка» шапки:
// когда полоса прокрутки исчезает, добавляем такой же отступ справа странице и фиксированной шапке.
export function lockScroll() {
  if (document.body.dataset.locked) return;
  const sw = window.innerWidth - document.documentElement.clientWidth;
  document.body.dataset.locked = "1";
  document.body.style.overflow = "hidden";
  if (sw > 0) {
    document.body.style.paddingRight = `${sw}px`;
    document.querySelectorAll(".header").forEach((el) => {
      el.dataset.pr = el.style.paddingRight;
      el.style.paddingRight = `calc(${getComputedStyle(el).paddingRight} + ${sw}px)`;
    });
  }
}

export function unlockScroll() {
  if (!document.body.dataset.locked) return;
  delete document.body.dataset.locked;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.querySelectorAll(".header").forEach((el) => {
    el.style.paddingRight = el.dataset.pr || "";
    delete el.dataset.pr;
  });
}
