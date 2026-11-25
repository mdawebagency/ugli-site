# Локальный сервер для превью ugli-site.
# Сам отдаёт файлы (без кэша и без 304), корректно поддерживает Range — нужно для фонового видео.
require "webrick"

ROOT = File.expand_path(__dir__)
PORT = (ENV["PORT"] || 5173).to_i

TYPES = {
  ".html" => "text/html; charset=utf-8", ".css" => "text/css; charset=utf-8",
  ".js" => "text/javascript; charset=utf-8", ".json" => "application/json",
  ".svg" => "image/svg+xml", ".png" => "image/png", ".jpg" => "image/jpeg",
  ".jpeg" => "image/jpeg", ".webp" => "image/webp", ".mp4" => "video/mp4",
  ".ico" => "image/x-icon", ".woff2" => "font/woff2", ".pdf" => "application/pdf"
}.freeze

class StaticServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(req, res)
    path = File.expand_path("." + WEBrick::HTTPUtils.unescape(req.path), ROOT)
    path = File.join(path, "index.html") if File.directory?(path)
    unless path.start_with?(ROOT) && File.file?(path)
      res.status = 404
      res.body = "Not found"
      return
    end

    size = File.size(path)
    res["Content-Type"] = TYPES[File.extname(path).downcase] || "application/octet-stream"
    res["Cache-Control"] = "no-store"
    res["Accept-Ranges"] = "bytes"

    range = req["range"].to_s[/bytes=(\d*)-(\d*)/] && [$1, $2]
    if range
      first = range[0].empty? ? size - range[1].to_i : range[0].to_i
      last = range[0].empty? || range[1].empty? ? size - 1 : [range[1].to_i, size - 1].min
      last = [last, first + 2 * 1024 * 1024 - 1].min # отдаём кусками до 2 МБ — браузер дозапросит
      if first >= size || first > last
        res.status = 416
        res["Content-Range"] = "bytes */#{size}"
        return
      end
      res.status = 206
      res["Content-Range"] = "bytes #{first}-#{last}/#{size}"
      res.body = File.binread(path, last - first + 1, first)
    else
      res.status = 200
      res.body = File.binread(path)
    end
  end
  alias do_HEAD do_GET
end

server = WEBrick::HTTPServer.new(
  Port: PORT, BindAddress: "127.0.0.1", AccessLog: [],
  Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN)
)
server.mount("/", StaticServlet)
trap("INT") { server.shutdown }
trap("TERM") { server.shutdown }
puts "ugli-site: http://localhost:#{PORT}"
server.start
