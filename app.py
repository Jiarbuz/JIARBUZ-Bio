from flask import Flask, render_template, make_response, request, g
from security_headers import register_security_headers
from dotenv import load_dotenv
from datetime import datetime
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

# === Логгер визитов ===
@app.before_request
def log_visitor():
    path = request.path

    # Игнорируем служебные и статические запросы
    if path.startswith("/static") or path in ["/favicon.ico", "/robots.txt", "/sitemap.xml"]:
        return

    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    user_agent = request.headers.get('User-Agent', 'Неизвестно')
    now = time.time()
    visitor_id = request.cookies.get('visitor_id')

    # Проверяем — новый визит или нет
    is_new_visit = (
        not visitor_id or
        visitor_id not in active_visitors or
        now - active_visitors[visitor_id]['time'] > SESSION_TTL
    )

    if is_new_visit:
        visitor_id = str(uuid.uuid4())
        active_visitors[visitor_id] = {"ip": ip, "time": now}

        # Геолокация
        city, isp = 'Неизвестно', 'Неизвестно'
        try:
            geo = requests.get(f"http://ip-api.com/json/{ip}?lang=ru", timeout=2).json()
            city = geo.get('city', city)
            isp = geo.get('isp', isp)
        except Exception:
            pass

        # Парсим ОС и браузер
        parsed = httpagentparser.simple_detect(user_agent)
        os_name = parsed[0] if parsed and parsed[0] else "Неизвестно"
        browser_name = parsed[1] if parsed and parsed[1] else "Неизвестно"

        message = (
            f"🕒 Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"📡 IP: {ip}\n"
            f"🏙️ Город: {city}\n"
            f"🛜 Провайдер: {isp}\n"
            f"🖥 ОС: {os_name}\n"
            f"🌐 Браузер: {browser_name}\n"
            f"📍 Страница: {path}\n"
        )

        send_telegram_message(message)
        g.new_visitor_id = visitor_id
    else:
        # Обновляем время активности
        active_visitors[visitor_id]['time'] = now


@app.after_request
def set_cookie_and_remove_server_header(response):
    # Устанавливаем cookie если новый визит
    if hasattr(g, 'new_visitor_id'):
        response.set_cookie('visitor_id', g.new_visitor_id, max_age=SESSION_TTL)
    # Убираем заголовок Server
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
