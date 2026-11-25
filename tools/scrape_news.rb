# encoding: utf-8
# Снимает все новости и акции с ugli-ekb.ru/news/ → assets/news-data.json (+ картинки в assets/news/)
require "json"
require "cgi"
require "open3"
root = ARGV[0] || "."
tmp = ARGV[1] || "/tmp"
get = ->(url, out) { system("curl", "-s", "-A", "Mozilla/5.0", "-o", out, url) }
list_file = File.join(tmp, "news-list.html")
get.("https://ugli-ekb.ru/news/", list_file)
list = File.read(list_file, encoding: "utf-8")
block = list[/<div class="cards_wrapper news-items">(.*?)<footer/m, 1] or abort("no list")
cards = block.scan(/<a href="\/news\/([^"]+)\/" class="single_card">\s*<div class="card_img" style="background-image:url\(([^)]+)\)"><\/div>\s*<div class="card_name"><span>(.*?)<\/span>/m)
dir = File.join(root, "assets/news"); Dir.mkdir(dir) unless Dir.exist?(dir)
orig = ->(p) { p.sub(%r{/resize_cache/iblock/(\w+)/\d+_\d+_\d+/}, '/iblock/\1/') }
clean_body = lambda do |html, id|
  h = html.dup
  n = 0
  # картинки внутри текста новости (афиши, акции) — скачиваем к себе
  h.gsub!(/<img [^>]*src="([^"]+)"[^>]*>/i) do
    src = $1
    n += 1
    ext = File.extname(src).downcase
    local = "assets/news/#{id}-in#{n}#{ext}"
    get.(src.start_with?("http") ? src : "https://ugli-ekb.ru#{src}", File.join(root, local))
    %(\u0001img src="#{local}"\u0002)
  end
  h.gsub!(/<(\/?)(b|strong)>/i, '<\1strong>')
  h.gsub!(/<(?!\/?(strong|br|a|i|em|p|ul|li)\b)[^>]+>/i, "")       # оставляем только простую разметку
  h.gsub!(/<a [^>]*href="([^"]+)"[^>]*>/i) { %(<a href="#{$1.start_with?("/") ? "https://ugli-ekb.ru" + $1 : $1}" target="_blank" rel="noopener">) }
  h.gsub!(/(&nbsp;| )+/, " ")
  h.gsub!(/(<br\s*\/?>\s*){3,}/i, "<br><br>")
  h.gsub!("\u0001", "<").gsub!("\u0002", ' alt="" loading="lazy">') if h.include?("\u0001")
  h.strip.sub(/\A(<br\s*\/?>\s*)+/i, "").sub(/(<br\s*\/?>\s*)+\z/i, "")
end
items = cards.each_with_index.map do |(slug, thumb, title), i|
  id = format("%02d", i + 1)
  f = File.join(tmp, "news-#{i}.html")
  get.("https://ugli-ekb.ru/news/#{slug}/", f)
  d = File.read(f, encoding: "utf-8")
  pic = d[/<img class="detail_picture" src="([^"]+)"/, 1]
  right = d[/<div class="col-right">(.*?)<\/div>\s*<\/div>\s*<div class="detail_text">/m, 1] || ""
  extra = d[/<div class="detail_text">(.*?)<\/div>\s*<div class="date">/m, 1] || ""
  date = CGI.unescapeHTML(d[/<div class="date">\s*(.*?)\s*<\/div>/m, 1].to_s.strip)
  id = format("%02d", i + 1)
  img_src = pic ? orig.(pic) : orig.(thumb)
  ext = File.extname(img_src).downcase
  img = "assets/news/#{id}#{ext}"
  get.("https://ugli-ekb.ru#{img_src}", File.join(root, img))
  thumb_ext = File.extname(thumb).downcase
  timg = "assets/news/#{id}-card#{thumb_ext}"
  get.("https://ugli-ekb.ru#{orig.(thumb)}", File.join(root, timg))
  STDERR.puts "#{id} #{CGI.unescapeHTML(title)} | #{date}"
  { id: id, slug: slug.sub(/\A-+/, "").sub(/-+\z/, ""), title: CGI.unescapeHTML(title.gsub(/<[^>]+>/, "").strip), date: date,
    card: timg, image: img, body: clean_body.(right + extra, id), source: "https://ugli-ekb.ru/news/#{slug}/" }
end
File.write(File.join(root, "assets/news-data.json"), JSON.pretty_generate(items))
puts "news: #{items.size}"
