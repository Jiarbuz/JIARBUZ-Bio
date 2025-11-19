from flask import Flask, render_template, make_response, request, g
from security_headers import register_security_headers
from dotenv import load_dotenv
import requests
import os
import time
import uuid
import httpagentparser

# === Загружаем .env ===
load_dotenv()

app = Flask(__name__)

# === Настройки Telegram ===
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# === Хранилище сессий ===
active_visitors = {}
SESSION_TTL = 1

# === Функция отправки в Telegram ===
def send_telegram_message(text: str):
    if not BOT_TOKEN or not CHAT_ID:
        print("⚠️ Telegram токен или chat_id не указаны в .env")
        return
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": CHAT_ID, "text": text}
    try:
        requests.post(url, data=payload, timeout=3)
    except Exception as e:
        print(f"Ошибка при отправке в Telegram: {e}")

# === Детектор ОС (краткие категории) ===
def detect_os(user_agent: str):
    ua = user_agent.lower()

    if "windows" in ua:
        return "Windows"
    if "mac os" in ua or "macintosh" in ua:
        return "macOS"
    if "android" in ua:
        return "Android"
    if "iphone" in ua or "ipad" in ua or "ios" in ua:
        return "iOS"
    if "linux" in ua and "android" not in ua:
        return "Linux"

    return "Unknown"


# === Получение языка браузера ===
def get_browser_language(accept_language_header: str):
    if not accept_language_header:
        return "Неизвестно"

    primary_language = accept_language_header.split(',')[0].split(';')[0].strip()
    return primary_language if primary_language else "Неизвестно"


# === Логгер визитов ===
@app.before_request
def log_visitor():
    path = request.path

    if path.startswith("/static") or path in ["/favicon.ico", "/robots.txt", "/sitemap.xml", "/log", "/screen_info"]:
        return

    ip_raw = request.headers.get('X-Forwarded-For', request.remote_addr)
    if ip_raw and "," in ip_raw:
        ip = ip_raw.split(",")[0].strip()
    else:
        ip = ip_raw

    user_agent = request.headers.get('User-Agent', 'Неизвестно')
    now = time.time()
    visitor_id = request.cookies.get('visitor_id')

    # Логика нового визита
    is_new_visit = False

    if not visitor_id:
        is_new_visit = True
        visitor_id = str(uuid.uuid4())
    elif visitor_id not in active_visitors:
        is_new_visit = True
    else:
        last_visit_time = active_visitors[visitor_id]['time']
        if now - last_visit_time > SESSION_TTL:
            is_new_visit = True
        else:
            if active_visitors[visitor_id].get('logged'):
                active_visitors[visitor_id]['time'] = now
                return
            active_visitors[visitor_id]['time'] = now

    if is_new_visit:
        visitor_id = str(uuid.uuid4())
        active_visitors[visitor_id] = {"ip": ip, "time": now, "logged": False}

    # Геолокация
    city, isp, country, country_emoji = 'Неизвестно', 'Неизвестно', 'Неизвестно', '🏳️'
    try:
        geo = requests.get(f"http://ip-api.com/json/{ip}?lang=ru", timeout=2).json()
        if geo.get('status') == 'success':
            city = geo.get('city', city)
            isp = geo.get('isp', isp)
            country = geo.get('country', country)
            country_code = geo.get('countryCode', '').upper()
            if country_code and len(country_code) == 2:
                country_emoji = chr(127397 + ord(country_code[0])) + chr(127397 + ord(country_code[1]))
    except Exception:
        pass

    os_name = detect_os(user_agent)
    parsed = httpagentparser.simple_detect(user_agent)
    browser_name = parsed[1] if parsed and parsed[1] else "Неизвестно"
    browser_language = get_browser_language(request.headers.get('Accept-Language'))
    protocol = "HTTPS" if request.is_secure else "HTTP"
    domain = request.headers.get('Host', 'Неизвестно')

    resolution = "Неизвестно"
    scale = "Неизвестно"

    message = (
        f"📡 IP: {ip}\n"
        f"🏙️ Город: {city}\n"
        f"🌍 Страна: {country_emoji} {country}\n"
        f"🛜 Провайдер: {isp}\n"
        f"🖥 ОС: {os_name}\n"
        f"🌐 Браузер: {browser_name}\n"
        f"🗣️ Язык браузера: {browser_language}\n"
        f"🔒 Протокол: {protocol}\n"
        f"🌐 Домен: {domain}\n"
        f"📺 Разрешение: {resolution}\n"
        f"⚖️ Масштаб: {scale}\n"
        f"📍 Страница: {path}\n"
    )

    send_telegram_message(message)
    active_visitors[visitor_id]['logged'] = True
    g.new_visitor_id = visitor_id


@app.after_request
def set_cookie_and_remove_server_header(response):
    if hasattr(g, 'new_visitor_id'):
        response.set_cookie('visitor_id', g.new_visitor_id, max_age=SESSION_TTL)

    if "Server" in response.headers:
        response.headers.pop("Server")

    if hasattr(response, "environ") and "SERVER_SOFTWARE" in response.environ:
        response.environ["SERVER_SOFTWARE"] = ""

    return response


register_security_headers(app)


# === Основная страница ===
@app.route('/')
def index():
    bio = {
        "nickname": "JIARBUZ",
        "links": [
            {"name": "Telegram", "url": "tg://resolve?domain=JIARBUZ", "icon": "fa-brands fa-telegram"},
            {"name": "GitHub", "url": "https://github.com/jiarbuz", "icon": "fa-brands fa-github"},
            {"name": "Steam", "url": "https://steamcommunity.com/id/jiarbuz", "icon": "fa-brands fa-steam"},
            {"name": "LolzTeam", "url": "https://lolz.live/members/4265472/", "icon": "fa-solid fa-eye"},
            {"name": "Roblox", "url": "https://www.roblox.com/users/577295282/profile", "icon": "fa-solid fa-cube"},
            {"name": "VK", "url": "https://vk.com/arbuzji228", "icon": "fa-brands fa-vk"},
            {"name": "YouTube", "url": "https://www.youtube.com/@jiarbuz", "icon": "fa-brands fa-youtube"},
            {"name": "TikTok", "url": "https://www.tiktok.com/@jiarbuz", "icon": "fa-brands fa-tiktok"},
            {"name": "Discord", "url": "https://discord.com/users/971767339282497536", "icon": "fa-brands fa-discord"},
            {"name": "Twitch", "url": "https://www.twitch.tv/jiarbuz228", "icon": "fa-brands fa-twitch"},
            {"name": "Reddit", "url": "https://www.reddit.com/user/WatermelonJuicy2/", "icon": "fa-brands fa-reddit-alien"},
            {"name": "Donate", "url": "https://yoomoney.ru/fundraise/1B54G3B36G9.250627", "icon": "fa-solid fa-hand-holding-heart"},
        ]
    }
    response = make_response(render_template('index.html', bio=bio))
    return response


# === Приём логов от внешних сервисов ===
@app.route('/log', methods=['POST'])
def log():
    data = request.get_json(silent=True)
    message = data.get('message') if data else None

    if not message:
        return {"error": "No message provided"}, 400

    try:
        send_telegram_message(message)
        return {"status": "ok"}, 200
    except Exception as e:
        print(f"Ошибка при отправке: {e}")
        return {"error": "Internal error"}, 500


# === Новый эндпоинт для получения данных о разрешении экрана ===
@app.route('/screen_info', methods=['POST'])
def screen_info():
    try:
        data = request.get_json(silent=True)
        if not data:
            return {"error": "No data provided"}, 400

        width = data.get('width')
        height = data.get('height')
        scale = data.get('scale', 1.0)

        if width and height:
            screen_data = f"{width}x{height}"
            scale_data = f"{scale}"

            ip_raw = request.headers.get('X-Forwarded-For', request.remote_addr)
            if ip_raw and "," in ip_raw:
                ip = ip_raw.split(",")[0].strip()
            else:
                ip = ip_raw

            message = (
                f"📡 IP: {ip}\n"
                f"📺 Разрешение экрана: {screen_data}\n"
                f"⚖️ Масштаб: {scale_data}\n"
                f"🖥 Обновление данных о дисплее"
            )

            send_telegram_message(message)
            print(f"📺 Получены данные экрана: {screen_data}, масштаб: {scale_data}")
            return {"status": "success"}, 200
        else:
            return {"error": "Invalid screen data"}, 400

    except Exception as e:
        print(f"Ошибка при обработке screen_info: {e}")
        return {"error": "Internal error"}, 500


@app.route('/robots.txt')
def robots():
    resp = make_response("User-agent: *\nDisallow:\nSitemap: /sitemap.xml")
    resp.headers["Content-Type"] = "text/plain"
    return resp


@app.route('/sitemap.xml')
def sitemap():
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://127.0.0.1:5000/</loc></url>
</urlset>"""
    resp = make_response(xml)
    resp.headers["Content-Type"] = "application/xml"
    return resp


if __name__ == '__main__':
    cert_path = os.path.join(os.getcwd(), 'certs', 'cert.pem')
    key_path = os.path.join(os.getcwd(), 'certs', 'key.pem')

    if os.path.exists(cert_path) and os.path.exists(key_path):
        print("🔐 HTTPS включён (локальный сертификат).")
        app.run(host="0.0.0.0", port=5000, ssl_context=(cert_path, key_path), debug=True)
    else:
        print("⚠️ Сертификаты не найдены — запускаю HTTP.")
        app.run(host="0.0.0.0", port=5000, debug=True)
