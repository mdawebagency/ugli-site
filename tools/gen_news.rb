# encoding: utf-8
# Генерирует news.html из assets/news-data.json (новости и акции с ugli-ekb.ru/news/)
# + блок банкетного зала внизу (тексты с ugli-ekb.ru/shares/).
require "json"
require "cgi"
root = ARGV[0] || "."
news = JSON.parse(File.read(File.join(root, "assets/news-data.json"), encoding: "utf-8"))
h = ->(s) { CGI.escapeHTML(s.to_s) }
# английские переводы (assets/i18n/news-en.json) и даты
news_en = JSON.parse(File.read(File.join(root, "assets/i18n/news-en.json"), encoding: "utf-8"))
MONTHS = { "января" => "January", "февраля" => "February", "марта" => "March", "апреля" => "April", "мая" => "May", "июня" => "June",
           "июля" => "July", "августа" => "August", "сентября" => "September", "октября" => "October", "ноября" => "November", "декабря" => "December" }
en_date = ->(d) { d.to_s.sub(/(\d+)\s+(\S+)\s+(\d{4})/) { "#{MONTHS[$2] || $2} #{$1}, #{$3}" } }
size_en = ->(t) { t.sub("МБ", "MB").sub("КБ", "KB").sub(",", ".") }
size = ->(slug) {
  b = File.size(File.join(root, "assets/pdf/#{slug}.pdf"))
  b >= 1024 * 1024 ? format("%.1f МБ", b / 1048576.0).sub(".", ",") : format("%d КБ", b / 1024)
}

cards = news.map do |n|
  date = n["date"].to_s.empty? ? "" : %(<span class="ncard__date" data-en="#{h.(en_date.(n["date"]))}">#{h.(n["date"])}</span>)
  <<~C.strip
    <a class="ncard" href="##{h.(n["slug"])}" data-news="#{h.(n["slug"])}">
            <span class="ncard__img"><img src="#{h.(n["card"])}" alt="" loading="lazy"></span>
            <span class="ncard__body">#{date}<span class="ncard__title" data-en="#{h.(news_en[n["id"]]["title"])}">#{h.(n["title"].strip)}</span></span>
          </a>
  C
end.join("\n        ")

# Полные тексты новостей лежат в <template> — открываются во всплывающем окне
templates = news.map do |n|
  date = n["date"].to_s.empty? ? "" : %(<p class="nmodal__date">#{h.(n["date"])}</p>)
  <<~T.strip
    <template id="news-#{h.(n["slug"])}">
        <img class="nmodal__img" src="#{h.(n["image"])}" alt="">
        <div class="nmodal__text">
          #{date}
          <h2 class="nmodal__title">#{h.(n["title"].strip)}</h2>
          <div class="nmodal__body">#{n["body"]}</div>
        </div>
      </template>
      <template id="news-#{h.(n["slug"])}-en">
        <img class="nmodal__img" src="#{h.(n["image"])}" alt="">
        <div class="nmodal__text">
          #{n["date"].to_s.empty? ? "" : %(<p class="nmodal__date">#{h.(en_date.(n["date"]))}</p>)}
          <h2 class="nmodal__title">#{h.(news_en[n["id"]]["title"])}</h2>
          <div class="nmodal__body">#{news_en[n["id"]]["body"]}</div>
        </div>
      </template>
  T
end.join("\n  ")

halls = %w[06 04 09].map { |n| %(<img src="assets/banquet/hall-#{n}.jpg" alt="Банкетный зал ресторана «Угли»" data-en-alt="UGLI restaurant banquet hall" loading="lazy">) }.join("\n          ")

bmenus = [["banketnoe-predlozhenie", "Банкетное предложение", "Banquet offer"],
          ["banketnoe-menyu", "Банкетное меню", "Banquet menu"],
          ["furshetnoe-menyu", "Фуршетное меню", "Buffet menu"]].map { |slug, ru, en|
  %(<a class="pdf" href="assets/pdf/#{slug}.pdf" target="_blank" rel="noopener"><span class="pdf__img"><img src="assets/pdf-covers/#{slug}.jpg" alt="" loading="lazy"></span><span class="pdf__info"><span class="pdf__badge" data-en="PDF · #{size_en.(size.(slug))}">PDF · #{size.(slug)}</span><span class="pdf__name" data-en="#{h.(en)}">#{h.(ru)}</span></span></a>)
}.join("\n            ")

forYou = ["Средний чек от 1500 руб", "Отдельные банкетные залы на 10, 15, 30 и 40 человек", "Специальные цены на алкоголь*",
          "Банкетное и фуршетное меню", "Музыкальная аппаратура", "Экран и проектор, флип чарт",
          "Бесплатный паркинг возле ресторана", "Обученный персонал, всегда готовый пойти вам навстречу"]
           .zip(["Average bill from 1500 rub", "Separate banquet halls for 10, 15, 30 and 40 people", "Special prices on alcohol*",
                 "Banquet and buffet menu", "Sound system", "Screen and projector, flipchart",
                 "Free parking next to the restaurant", "Trained staff, always ready to meet you halfway"])
           .map { |t, e| %(<li data-en="#{h.(e)}">#{h.(t)}</li>) }.join("\n            ")

html = <<~HTML
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Новости и акции — мясной ресторан «Угли», Екатеринбург</title>
  <meta name="description" content="Новости и акции ресторана «Угли»: афиши, мастер-классы, DJ-сеты, специальные предложения. Банкетный зал до 40 человек.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="booking.css">
  <link rel="stylesheet" href="menu.css">
  <link rel="stylesheet" href="news.css">
</head>
<body class="page-menu page-news">
  <!-- Собрано скриптом tools/gen_news.rb: #{news.size} новостей с ugli-ekb.ru/news/ -->
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
      <a class="mpage__back" href="index.html#news" data-i18n="back">← На главную</a>
      <h1 class="mpage__title" data-i18n="newsTitle">Новости и акции</h1>
    </div>

    <div class="mpage__body">
      <section class="news" aria-label="Новости и акции" data-en-label="News">
        <div class="news__grid">
        #{cards}
        </div>
      </section>
    </div>

    <!-- ===== Банкетный зал — тексты и меню с ugli-ekb.ru/shares/ ===== -->
    <section class="banq" id="banquets" aria-labelledby="banq-title">
      <div class="banq__inner">
        <div class="banq__text">
          <h2 class="banq__title" id="banq-title" data-i18n="banqTitle">Банкетный зал для вашего идеального мероприятия!</h2>
          <p data-en="UGLI is a restaurant created for big and small celebrations. The main space of the restaurant is divided into cosy zones for groups of 8 to 40 people.">УГЛИ - ресторан созданный для больших и маленьких торжеств. Основное помещение ресторана поделено на уютные зоны, рассчитанные на компании от 8 до 40 человек.</p>
          <p data-en="At your request, we will put together a themed menu, decorate the table, recommend a good host, DJ and photographer. And, of course, provide first-class service.">По вашему желанию мы составим тематическое меню, оформим стол, посоветуем хорошего ведущего, DJ и фотографа. И, конечно, обеспечим первоклассный сервис.</p>
          <h3 class="banq__sub" data-en="For YOU:">Для ВАС:</h3>
          <ul class="banq__list">
            #{forYou}
          </ul>
          <p class="banq__note" data-en="*the offer is available for the second floor if the company takes the whole hall">*предложение доступно для второго этажа, если компания занимает весь зал</p>
        </div>
        <div class="banq__photos">
          #{halls}
        </div>
      </div>

      <div class="banq__menus">
        <h3 class="banq__menus-title" data-i18n="banqMenus">Меню для банкета</h3>
        <div class="banq__menus-grid">
            #{bmenus}
        </div>
      </div>

      <div class="banq__cta">
        <p data-en-html="Call &lt;a href=&quot;tel:+79220208806&quot;&gt;+7 (922) 020-88-06&lt;/a&gt; and our banquet manager Ekaterina will be happy to answer all your questions and offer a solution for any request">Звоните по номеру <a href="tel:+79220208806">+7 (922) 020-88-06</a> и наш банкетный менеджер Екатерина с радостью ответит на все вопросы и предложит решение на любые запросы</p>
        <a class="btn btn--accent" href="https://ugli-ekb.ru/shares/#banquetForm" data-i18n="banqBtn">Оставить заявку</a>
      </div>
    </section>
  </main>

  <!-- Окно с полной новостью -->
  <div class="nmodal" role="dialog" aria-modal="true" aria-label="Новость" data-en-label="News item" hidden>
    <div class="nmodal__backdrop" data-close></div>
    <article class="nmodal__card">
      <button class="nmodal__x" type="button" aria-label="Закрыть" data-en-label="Close" data-close>✕</button>
      <div class="nmodal__content"></div>
    </article>
  </div>

  #{templates}

  <a class="book-float" href="#book" data-book data-i18n="book">Забронировать</a>

  <script type="module" src="news.js"></script>
  <script type="module" src="booking.js"></script>
</body>
</html>
HTML
File.write(File.join(root, "news.html"), html)
puts "news.html: #{news.size} news"

# общий подвал
system("/usr/bin/ruby", File.join(__dir__, "inject_footer.rb"))
