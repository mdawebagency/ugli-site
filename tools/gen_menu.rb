# encoding: utf-8
# Генерирует ugli-site/menu.html из assets/menu-data.json (данные сняты с ugli-ekb.ru/menu/)
require "json"
require "cgi"
root = ARGV[0]
data = JSON.parse(File.read(File.join(root, "assets/menu-data.json"), encoding: "utf-8"))
h = ->(s) { CGI.escapeHTML(s.to_s) }
# ===== английские переводы блюд (assets/i18n) =====
names_en = JSON.parse(File.read(File.join(root, "assets/i18n/menu-names-en-1.json"), encoding: "utf-8"))
             .merge(JSON.parse(File.read(File.join(root, "assets/i18n/menu-names-en-2.json"), encoding: "utf-8")))
descr_ru = data.flat_map { |c| c["items"].map { |i| i["descr"].to_s } }.uniq.reject(&:empty?)
descr_en = Hash[descr_ru.zip(JSON.parse(File.read(File.join(root, "assets/i18n/menu-descr-en.json"), encoding: "utf-8")))]
nutr_en = ->(t) { t.sub(/\AВсего:\s*/, "").sub("Ккал", "kcal").sub("Белки -", "Protein").sub("Жиры -", "Fat").sub("Углеводы -", "Carbs").gsub(/\s*г(?=,|\z)/, " g") }
weight_en = ->(t) { t.gsub(/\s*г(?=\s|,|\z)/, " g") }
marker_en = { "🔥Хит" => "🔥Hit" }
size_en = ->(t) { t.sub("МБ", "MB").sub("КБ", "KB").sub(",", ".") }
price = ->(p) { p.to_s.sub(/\s*руб\.?\s*\z/, "").strip + " ₽" }

EN_CATS = {
  "Подарки ко Дню матери" => "Mother's Day gifts", "Сеты" => "Sets", "Фуршет" => "Buffet", "Полуфабрикаты" => "Semi-finished",
  "Бизнес-ланч" => "Business lunch", "Стейки" => "Steaks", "Закуски" => "Starters", "Салаты" => "Salads", "Горячее" => "Main courses",
  "Бургеры" => "Burgers", "Супы" => "Soups", "Гарниры" => "Side dishes", "Десерты" => "Desserts", "Для Детей" => "For kids",
  "Напитки" => "Drinks", "Соусы" => "Sauces", "Шашлыки" => "Shashlik", "Боксы" => "Boxes", "Выпечка" => "Bakery",
  "Охлажденные стейки" => "Chilled steaks", "Банкетные блюда" => "Banquet dishes", "Торты" => "Cakes", "Пироги" => "Pies",
  "18+" => "18+", "Девайсы и Мерч" => "Devices and merch", "Сертификаты" => "Certificates", "Мастер-классы" => "Master classes"
}

PDFS = [
  ["osnovnoe-menyu", "Основное меню", "Main menu"], ["karta-bara", "Карта бара", "Bar map"], ["karta-vin-i-piva", "Карта вин", "Wine list"],
  ["detskoe-menyu", "Детское меню", "Children's menu"], ["biznes-lanch", "Бизнес-ланч", "Business lunch"],
  ["stenki-vagyu-spetsialnoe-predlozhenie", "Стейки ВАГЮ. Специальное предложение", "WAGYU steaks. Special offer"],
  ["banketnoe-predlozhenie", "Банкетное предложение", "Banquet offer"], ["banketnoe-menyu", "Банкетное меню", "Banquet menu"],
  ["furshetnoe-menyu", "Фуршетное меню", "Buffet menu"], ["torty-na-zakaz", "Торты на заказ", "Cakes to order"],
  ["english-menu", "English menu", "English menu"], ["chinese-menu", "餐厅菜单 🇨🇳", "Chinese menu 🇨🇳"],
  ["biznes-zavtrak-dlya-komandy", "Бизнес-завтрак для команды", "Business breakfast for the team"],
  ["biznes-lanch-dlya-komandy", "Бизнес-ланч для команды", "Business lunch for the team"],
  ["delovoy-furshet", "Деловой фуршет", "Business buffet"], ["otraslevaya-vstrecha", "Отраслевая встреча", "Industry meeting"]
]
size = ->(slug) {
  b = File.size(File.join(root, "assets/pdf/#{slug}.pdf"))
  b >= 1024 * 1024 ? format("%.1f МБ", b / 1048576.0).sub(".", ",") : format("%d КБ", b / 1024)
}

chips = data.map { |c| %(<a class="mchip" href="#cat-#{h.(c["slug"])}" data-en="#{h.(EN_CATS[c["title"]])}">#{h.(c["title"])}</a>) }.join("\n        ")

sections = data.map do |c|
  cards = c["items"].map do |i|
    marker = i["marker"].to_s.empty? ? "" : %(<span class="dish__mark" data-en="#{h.(marker_en[i["marker"]] || i["marker"])}">#{h.(i["marker"])}</span>)
    descr = i["descr"].to_s.empty? ? "" : %(<p class="dish__descr" data-en="#{h.(descr_en[i["descr"]] || i["descr"])}">#{h.(i["descr"])}</p>)
    nutr = i["nutr"].to_s.empty? ? "" : %(<p class="dish__nutr" data-en="#{h.(nutr_en.(i["nutr"]))}">#{h.(i["nutr"].sub(/\AВсего:\s*/, ""))}</p>)
    weight = i["weight"].to_s.empty? ? "" : %(<span class="dish__weight" data-en="#{h.(weight_en.(i["weight"]))}">#{h.(i["weight"])}</span>)
    <<~CARD.strip
      <article class="dish">
              <div class="dish__img"><img src="assets/dishes/#{i["id"]}.jpg" alt="#{h.(i["name"])}" data-en-alt="#{h.(names_en[i["name"]] || i["name"])}" loading="lazy" width="350" height="350">#{marker}</div>
              <div class="dish__body">
                <h3 class="dish__name" data-en="#{h.(names_en[i["name"]] || i["name"])}">#{h.(i["name"])}</h3>
                #{descr}
                <div class="dish__meta">#{weight}<strong class="dish__price">#{h.(price.(i["price"]))}</strong></div>
                #{nutr}
              </div>
            </article>
    CARD
  end.join("\n          ")
  <<~SEC
      <section class="mcat" id="cat-#{h.(c["slug"])}" aria-labelledby="t-#{h.(c["slug"])}">
        <h2 class="mcat__title" id="t-#{h.(c["slug"])}" data-en="#{h.(EN_CATS[c["title"]])}">#{h.(c["title"])}</h2>
        <div class="mcat__grid">
          #{cards}
        </div>
      </section>
  SEC
end.join("\n")

pdfs = PDFS.map { |slug, ru, en|
  %(<a class="pdf" href="assets/pdf/#{slug}.pdf" target="_blank" rel="noopener"><span class="pdf__img"><img src="assets/pdf-covers/#{slug}.jpg" alt="" loading="lazy"></span><span class="pdf__info"><span class="pdf__badge" data-en="PDF · #{size_en.(size.(slug))}">PDF · #{size.(slug)}</span><span class="pdf__name" data-en="#{h.(en)}">#{h.(ru)}</span></span></a>)
}.join("\n        ")

total = data.sum { |c| c["items"].size }

html = <<~HTML
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Меню — мясной ресторан «Угли», Екатеринбург</title>
  <meta name="description" content="Меню ресторана «Угли»: стейки, закуски, салаты, горячее, бургеры, десерты, напитки и меню в PDF.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="booking.css">
  <link rel="stylesheet" href="menu.css">
</head>
<body class="page-menu">
  <!-- Страница собрана скриптом из assets/menu-data.json: #{total} позиций в #{data.size} разделах, всё с ugli-ekb.ru/menu/ -->
  <header class="header is-solid">
    <div class="header__left">
      <a class="header__logo" href="index.html" aria-label="Угли — на главную" data-en-label="UGLI — home">
        <img src="assets/logo_image.svg" alt="" width="44" height="44">
        <img src="assets/logo_text.svg" alt="Угли" data-en-alt="UGLI" width="82" height="23">
      </a>
      <nav class="langs" aria-label="Язык сайта" data-en-label="Site language">
        <button type="button" data-lang="ru" class="on" aria-pressed="true">RU</button><i aria-hidden="true">|</i>
        <button type="button" data-lang="en" aria-pressed="false">EN</button>
      </nav>
    </div>
    <div class="header__actions">
      <a class="header__phone" href="tel:+73432372401">+7 (343) 237-24-01</a>
      <a class="header__login" href="https://ugli-ekb.ru/register/"><img src="assets/login.svg" alt="" width="22" height="22"><span data-i18n="login">Войти</span></a>
      <a class="btn btn--accent" href="#book" data-book data-i18n="book">Забронировать</a>
    </div>
  </header>

  <main class="mpage">
    <div class="mpage__head">
      <a class="mpage__back" href="index.html#menu" data-i18n="back">← На главную</a>
      <h1 class="mpage__title" data-i18n="menuTitle">Меню</h1>
    </div>

<!-- Меню в PDF — первым делом, сразу под заголовком, чтобы гости его заметили -->
<section class="mpdf" id="pdf" aria-labelledby="t-pdf">
  <div class="mpdf__head">
    <h2 class="mpdf__title" id="t-pdf" data-i18n="pdfTitle">Меню в PDF формате</h2>
    <div class="mpdf__arrows">
      <button class="mpdf__arrow" type="button" aria-label="Назад" data-en-label="Back" data-pdf-prev><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="mpdf__arrow" type="button" aria-label="Вперёд" data-en-label="Next" data-pdf-next><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
    </div>
  </div>
  <p class="mpdf__note" data-i18n="pdfNote">Уважаемые гости! Данные меню в формате PDF являются рекламным материалом. С контрольным меню Вы можете ознакомиться у администрации ресторана</p>
  <div class="mpdf__strip" data-pdf-strip>
    #{pdfs}
  </div>
</section>

    <!-- Разделы меню: лента закреплена сверху, активный раздел подсвечивается при прокрутке -->
    <nav class="mchips" aria-label="Разделы меню" data-en-label="Menu sections">
      <div class="mchips__track">
        <a class="mchip mchip--pdf" href="#pdf" data-i18n="pdfChip">Меню в PDF</a>
        #{chips}
      </div>
    </nav>

    <div class="mpage__body">
#{sections}
    </div>
  </main>

  <a class="book-float" href="#book" data-book data-i18n="book">Забронировать</a>

  <script type="module" src="menu.js"></script>
  <script type="module" src="booking.js"></script>
</body>
</html>
HTML
File.write(File.join(root, "menu.html"), html)
puts "menu.html: #{total} items, #{data.size} sections, #{PDFS.size} pdf"

# общий подвал
system("/usr/bin/ruby", File.join(__dir__, "inject_footer.rb"))
