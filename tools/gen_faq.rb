# encoding: utf-8
# Вставляет блоки «Часто задаваемые вопросы» и «Прямая связь с руководством» в index.html
# (между маркерами <!-- FAQ:START --> и <!-- FAQ:END -->). Тексты — с главной ugli-ekb.ru.
require "json"
require "cgi"
faq = JSON.parse(File.read("assets/faq-data.json", encoding: "utf-8"))
faq_en = JSON.parse(File.read("assets/i18n/faq-en.json", encoding: "utf-8"))
h = ->(s) { CGI.escapeHTML(s.to_s) }
items = faq.each_with_index.map do |f, i|
  <<~I.strip
    <div class="faq__item">
              <h3 class="faq__q">
                <button type="button" aria-expanded="false" aria-controls="faq-a-#{i + 1}" id="faq-q-#{i + 1}">
                  <span data-en="#{h.(faq_en[i]["q"])}">#{h.(f["q"])}</span>
                  <i class="faq__icon" aria-hidden="true"></i>
                </button>
              </h3>
              <div class="faq__a" id="faq-a-#{i + 1}" role="region" aria-labelledby="faq-q-#{i + 1}" hidden>
                <div class="faq__a-inner" data-en-html="#{h.(faq_en[i]["a"])}">#{f["a"]}</div>
              </div>
            </div>
  I
end.join("\n          ")

block = <<~HTML
<!-- FAQ:START -->
    <!-- ===== Часто задаваемые вопросы — тексты с ugli-ekb.ru ===== -->
    <section class="faq" id="faq" aria-labelledby="faq-title">
      <div class="faq__inner">
        <h2 class="section-title" id="faq-title" data-reveal data-i18n="faqTitle">Часто задаваемые вопросы</h2>
        <div class="faq__list">
          #{items}
        </div>
      </div>
    </section>

    <!-- ===== Прямая связь с руководством — тексты и поля как на ugli-ekb.ru ===== -->
    <section class="feedback" id="feedback" aria-labelledby="fb-title">
      <div class="feedback__card" data-reveal>
        <div class="feedback__info">
          <h2 class="feedback__title" id="fb-title" data-i18n="fbTitle">Прямая связь с руководством</h2>
          <div class="feedback__note">
            <img src="assets/information.svg" alt="" width="32" height="32">
            <div>
              <p><strong data-en="Dear guests!">Уважаемые гости!</strong></p>
              <p data-en="You can share your feedback and wishes with the management by filling out this form. All feedback will be reviewed. Please remember to leave a way to contact you.">Ваши отзывы и пожелания вы можете сообщить руководству, заполнив эту форму. Все отзывы будут обязательно рассмотрены. Не забывайте указывать варианты связи с вами.</p>
            </div>
          </div>
        </div>
        <form class="feedback__form" novalidate data-feedback>
          <input class="field" type="text" name="surname" placeholder="Фамилия" aria-label="Фамилия" data-en-ph="Surname" data-en-label="Surname" autocomplete="family-name">
          <input class="field" type="text" name="name" placeholder="Имя" aria-label="Имя" data-en-ph="Name" data-en-label="Name" autocomplete="given-name">
          <input class="field" type="email" name="email" placeholder="Эл. почта" aria-label="Эл. почта" data-en-ph="Email" data-en-label="Email" autocomplete="email">
          <input class="field" type="tel" name="phone" placeholder="Телефон" aria-label="Телефон" data-en-ph="Phone" data-en-label="Phone" autocomplete="tel">
          <textarea class="field field--area" name="comment" rows="5" placeholder="Комментарий" aria-label="Комментарий" data-en-ph="Comment" data-en-label="Comment"></textarea>
          <div class="feedback__bottom">
            <button class="btn btn--accent" type="submit" data-en="Send">Отправить</button>
            <label class="subscribe__check">
              <input type="checkbox" name="agree">
              <span class="subscribe__box" aria-hidden="true"></span>
              <span><span data-en="I agree to the">даю согласие на</span> <a href="https://ugli-ekb.ru/documents/policy-data.pdf" target="_blank" rel="noopener" data-en="processing of personal data">обработку персональных данных</a></span>
            </label>
          </div>
          <p class="subscribe__msg" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>
<!-- FAQ:END -->
HTML

s = File.read("index.html", encoding: "utf-8")
if s.include?("<!-- FAQ:START -->")
  s.sub!(/<!-- FAQ:START -->.*?<!-- FAQ:END -->\n/m, block)
else
  s.sub!("  </main>", "\n    " + block + "  </main>") or abort("main")
end
File.write("index.html", s)
puts "faq: #{faq.size}"
