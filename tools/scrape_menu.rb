# encoding: utf-8
require "json"
require "cgi"
dir = ARGV[0]
cats = [
 ["podarki-ko-dnyu-materi","Подарки ко Дню матери"],["sety_3","Сеты"],["furshet","Фуршет"],["polufabrikaty_1","Полуфабрикаты"],
 ["biznes-lanch-s-pn-po-pt-s-11-30-do-16-00","Бизнес-ланч"],["steyki-i-gril-sety","Стейки"],["zakuski","Закуски"],["salaty","Салаты"],
 ["goryachie-blyuda","Горячее"],["burgery","Бургеры"],["supy","Супы"],["garniry","Гарниры"],["deserty","Десерты"],
 ["detskoe-menyu","Для Детей"],["napitki","Напитки"],["sousy","Соусы"],["shashlyki_2","Шашлыки"],["boksy","Боксы"],
 ["vypechka","Выпечка"],["okhlazhdennye-steyki","Охлажденные стейки"],["novogodnie-blyuda","Банкетные блюда"],
 ["torty-na-zakaz-za-sutki-po-telefonu-237-24-01","Торты"],["pirogi","Пироги"],["18","18+"],["devaysy-i-merch","Девайсы и Мерч"],
 ["sertifikaty","Сертификаты"],["master-klassy_1","Мастер-классы"]]
clean = ->(s) { s && CGI.unescapeHTML(s.gsub(/<[^>]+>/, " ").gsub(/&nbsp;/, " ").gsub(/\s+/, " ").strip) }
out = []
cats.each do |slug, title|
  html = File.read(File.join(dir, "#{slug}.html"), encoding: "utf-8")
  h1 = clean.(html[/<h1[^>]*>(.*?)<\/h1>/m, 1])
  intro = clean.(html[/<div class="section_description[^"]*">(.*?)<\/div>/m, 1])
  parts = html.split(/<div class="cards_wrapper catalog_section"/)
  main = parts[1] || ""
  items = []
  main.split(/<div class="single_card_wrap product-item-container"/)[1..].to_a.each do |c|
    id = c[/class="anchors" id="(\d+)"/, 1] or next
    img = c[/background-image:url\(([^)]+)\)/, 1]
    items << {
      id: id,
      name: clean.(c[/class="product_name"[^>]*title="([^"]*)"/, 1]),
      marker: clean.(c[/<div class="marker"[^>]*>(.*?)<\/div>/m, 1]),
      img: img,
      descr: clean.(c[/<span class="descr">(.*?)<\/span>/m, 1]),
      weight: clean.(c[/<span class="product_data">(.*?)(?:<div class="smalll">|<\/span>)/m, 1]),
      nutr: clean.(c[/<div class="smalll">(.*?)<\/div>/m, 1])&.sub(/,\s*\z/, ""),
      price: clean.(c[/product-item-price-current"[^>]*>(.*?)<\/span>/m, 1]),
    }
  end
  out << { slug: slug, title: title, h1: h1, intro: intro, items: items }
  STDERR.puts "#{title}: #{items.size}"
end
puts JSON.pretty_generate(out)
