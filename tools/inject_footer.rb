# encoding: utf-8
# Вставляет общий подвал во все страницы (между маркерами <!-- FOOTER:START --> / <!-- FOOTER:END -->,
# или вместо <!-- FOOTER -->). Все ссылки, логотипы и подписи — с ugli-ekb.ru.
Dir.chdir(File.expand_path("..", __dir__))

partners = [
  ["https://stroganov-grill.ru", "assets/partners/stroganov.jpg", "СТРОГАНОВ ГРИЛЬ", "STROGANOV GRILL"],
  ["https://shustof.ru", "assets/partners/shustov.png", "ШУСТОВ", "SHUSTOV"],
  ["https://lethai.ru", "assets/partners/lethai.jpg", "Салон тайского массажа", "Thai massage salon"],
  ["https://italians-ekb.ru", "assets/partners/italians.png", "Ресторан Итальянцы", "Italians restaurant"],
  ["https://ppr-ek.ru/", "assets/partners/pizzeria.jpg", "Пиццерия", "Pizzeria"],
  ["https://floralavka.ru", "assets/partners/flora.png", "Цветы", "Flowers"],
]
socials = [
  ["https://max.ru/u/f9LHodD0cOI1_cVaK9ztD3dzQzi-vCalgGqEfkl7UUvR3izO3-byCxwGWAs", "max-chat", "Max-chat"],
  ["https://t.me/ugli_ekb_bot", "tg-chat", "Telegram-chat"],
  ["https://wa.me/79321166490", "whatsapp", "Whatsapp"],
  ["https://max.ru/id6685197405_biz", "max-channel", "Max-channel"],
  ["https://t.me/ugli_ekb", "tg-channel", "Telegram-channel"],
  ["https://vk.com/ugli_ek", "vk", "VK"],
  ["http://instagram.com/ugli_ekb", "instagram", "Instagram*"],
  ["http://tripadvisor.ru/Restaurant_Review-g298540-d10687340-Reviews-Ugli-Yekaterinburg_Sverdlovsk_Oblast_Urals_District.html", "tripadvisor", "Tripadvisor"],
]

tiles = partners.map { |href, img, title, en|
  %(<a class="partner" href="#{href}" target="_blank" rel="noopener" title="#{title}" data-en-title="#{en}"><span class="partner__logo"><img src="#{img}" alt="#{title}" data-en-alt="#{en}" loading="lazy"></span><span class="partner__name" data-en="#{en}">#{title}</span></a>)
}.join("\n          ")
icons = socials.map { |href, icon, title|
  %(<a class="social" href="#{href}" target="_blank" rel="noopener" title="#{title}" aria-label="#{title}"><img src="assets/social/#{icon}.svg" alt=""></a>)
}.join("\n          ")

footer = <<~HTML
<!-- FOOTER:START -->
  <footer class="site-footer">
    <!-- Рекомендуем к посещению — партнёры с ugli-ekb.ru, лента листается сама и стрелками -->
    <section class="partners" aria-labelledby="partners-title">
      <div class="partners__head">
        <h2 class="partners__title" id="partners-title" data-i18n="partnersTitle">Рекомендуем к посещению</h2>
        <div class="partners__arrows">
          <button class="partners__arrow" type="button" aria-label="Назад" data-en-label="Back" data-partners-prev><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
          <button class="partners__arrow" type="button" aria-label="Вперёд" data-en-label="Next" data-partners-next><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
      </div>
      <div class="partners__viewport">
        <div class="partners__track" data-partners-track>
          #{tiles}
        </div>
      </div>
    </section>

    <div class="site-footer__bottom">
      <nav class="socials" aria-label="Соцсети" data-en-label="Social media">
          #{icons}
      </nav>
      <div class="site-footer__links">
        <a href="https://ugli-ekb.ru/usloviya-dostavki/" target="_blank" rel="noopener" data-i18n="fDelivery">Оплата и доставка</a>
        <a href="https://ugli-ekb.ru/policy/" target="_blank" rel="noopener" data-i18n="fPolicy">Политика конфиденциальности</a>
        <a href="https://ugli-ekb.ru/documents/policy-data.pdf" target="_blank" rel="noopener" data-i18n="fData">Обработка персональных данных</a>
      </div>
      <p class="site-footer__copy" data-en="UGLI © 2017-2026">УГЛИ © 2017-2026</p>
    </div>
  </footer>
  <script type="module" src="footer.js"></script>
  <script type="module" src="burger.js"></script>
  <script type="module" src="lang.js"></script>
<!-- FOOTER:END -->
HTML

%w[index.html menu.html news.html].each do |page|
  s = File.read(page, encoding: "utf-8")
  if s.include?("<!-- FOOTER:START -->")
    s.sub!(/<!-- FOOTER:START -->.*?<!-- FOOTER:END -->\n/m, footer)
  elsif s.include?("<!-- FOOTER -->")
    s.sub!("<!-- FOOTER -->\n", footer)
  else
    s.sub!("  </main>\n", "  </main>\n\n" + footer) or abort("no </main> in #{page}")
  end
  File.write(page, s)
  puts "footer → #{page}"
end
