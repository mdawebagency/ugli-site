// Общий перевод для всех страниц: всё, что помечено атрибутами data-en*, переключается вместе с RU/EN.
//   data-en        — текст элемента
//   data-en-html   — содержимое с разметкой (ответы, тексты новостей)
//   data-en-alt / data-en-ph / data-en-label / data-en-title — alt, placeholder, aria-label, title
// Русский вариант запоминается со страницы при первом переключении.
const ATTRS = [["enAlt", "alt"], ["enPh", "placeholder"], ["enLabel", "aria-label"], ["enTitle", "title"]];

function current() {
  try { return localStorage.getItem("ugli-lang") === "en" ? "en" : "ru"; } catch (e) { return "ru"; }
}

export function applyExtra(root = document) {
  const en = current() === "en";
  root.querySelectorAll("[data-en]").forEach((el) => {
    if (el.dataset.ru == null) el.dataset.ru = el.textContent;
    el.textContent = en ? el.dataset.en : el.dataset.ru;
  });
  root.querySelectorAll("[data-en-html]").forEach((el) => {
    if (el.dataset.ruHtml == null) el.dataset.ruHtml = el.innerHTML;
    el.innerHTML = en ? el.dataset.enHtml : el.dataset.ruHtml;
  });
  ATTRS.forEach(([key, attr]) => {
    const sel = `[data-${key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}]`;
    root.querySelectorAll(sel).forEach((el) => {
      const ruKey = "ru" + key.slice(2);
      if (el.dataset[ruKey] == null) el.dataset[ruKey] = el.getAttribute(attr) || "";
      el.setAttribute(attr, en ? el.dataset[key] : el.dataset[ruKey]);
    });
  });
}

applyExtra();
document.querySelectorAll(".langs button").forEach((b) => b.addEventListener("click", () => setTimeout(() => applyExtra(), 0)));
// окна, которые наполняются из <template> (новости), переводим при открытии
window.ugliApplyLang = applyExtra;
