# encoding: utf-8
# Снимает «Часто задаваемые вопросы» с главной ugli-ekb.ru → assets/faq-data.json
require "json"
require "cgi"
html = File.read(ARGV[0], encoding: "utf-8")
part = html[/<h2 class="faq__title">(.*?)<\/section>/m, 1] or abort("faq")
local_pdf = { "banketnoe-menyu" => 1, "furshetnoe-menyu" => 1, "detskoe-menyu" => 1, "karta-vin-i-piva" => 1, "karta-bara" => 1, "osnovnoe-menyu" => 1 }
items = part.split(/<div class="faq__question" id="[^"]+">/)[1..].map do |q|
  title = CGI.unescapeHTML(q[/<p class="faq__question-title">(.*?)<\/p>/m, 1].to_s.gsub(/<[^>]+>/, "").gsub(/\s+/, " ").strip)
  a = q[/<div class="faq__question-answer">(.*)<\/div>\s*<\/div>/m, 1].to_s
  a = a.gsub(/<span[^>]*>|<\/span>/i, "").gsub(/<p[^>]*>/i, "<p>").gsub(/ style="[^"]*"/i, "")
  a = a.gsub(/<(\/?)b>/i, '<\1strong>').gsub("<strong></strong>", "")
  a = a.gsub(%r{https://ugli-ekb\.ru/pdf_menu/([\w-]+)/}) { local_pdf[$1] ? "assets/pdf/#{$1}.pdf" : $& }
  a = a.gsub(/<a href="([^"]+)">/) { %(<a href="#{$1}"#{$1.start_with?("tel:") ? "" : ' target="_blank" rel="noopener"'}>) }
  a = a.gsub(/&nbsp;/, " ").gsub(/\s+/, " ").gsub(%r{(\s*</div>)+\s*\z}, "").gsub("</strong><strong>", "")
  a = a.gsub(%r{<p>\s*<p>}, "<p>").gsub(%r{</p>\s*(<br>\s*)*</p>}, "</p>").gsub(%r{<br>\s*</p>}, "</p>").gsub(%r{<p>\s*</p>}, "")
  { q: title, a: a.strip }
end
File.write(ARGV[1], JSON.pretty_generate(items))
items.each { |i| puts "Q: #{i[:q]}\nA: #{i[:a]}\n\n" }
