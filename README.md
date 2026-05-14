
---


**Сайт-портфолио в стиле ретро-терминала / BIOS с интерактивным интерфейсом, системной информацией и нео-футуристическим дизайном.**

Сайт представляет собой креативную визитную карточку разработчика, оформленную как загрузка BIOS и терминал Linux. Посетитель может взаимодействовать с командной строкой, просматривать информацию о системе и переходить по социальным ссылкам.

---

## ✨ Особенности

### 🖥️ Интерфейс в стиле BIOS
- Анимация загрузки AMI BIOS (American Megatrends)
- Детекция и отображение реального железа пользователя (GPU, RAM через WebGL)
- "Press any key to continue..." с эффектом мигающего курсора
- Плавный переход от экрана загрузки к основному интерфейсу

### 🎛️ Интерактивный терминал
| Команда | Описание |
|---------|----------|
| `help` | Список всех доступных команд |
| `clear` | Очистка терминала |
| `exit` | "Выключение" системы с анимацией shutdown |
| `reboot` | Перезагрузка страницы |
| `date` | Текущая дата и время |
| `whoami` | Имя пользователя (jiarbuz) |
| `ping` | Измерение задержки до сервера |
| `games` | Список любимых игр |
| `devices` | Периферия ПК |
| `battery` | Уровень заряда батареи (Battery API) |
| `lshw -c video` | Детальная информация о GPU через WebGL |
| `browser` | Информация о браузере (User-Agent, платформа, язык) |
| `fps` | Измерение FPS через requestAnimationFrame |
| `ifconfig` | Публичный IP-адрес (через ipify.org) |
| `about` | Информация о сайте и разработчике |




### 🔍 Сбор системной информации (безопасно)
Через JavaScript и WebGL собирается анонимная информация о:
- Видеокарте (вендор, модель, возможности)
- Разрешении экрана и цветовой глубине
- Количестве ядер CPU и объёме RAM (Device Memory API)
- Временной зоне, языке, платформе
- **Данные отправляются на сервер через `POST /screen_info` для аналитики**

---

## 🚀 Быстрый старт

### 1️⃣ Установка зависимостей

```bash
# Клонируем репозиторий
git clone https://github.com/yourusername/jiarbuz-portfolio.git
cd jiarbuz-portfolio
```

### 2️⃣ Настройка бэкенда (Flask)

Установите Python-пакеты:

```bash
pip install flask
```

Создайте `app.py`:

```python
from flask import Flask, render_template, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    bio = {
        "nickname": "JIARBUZ",
        "links": [
            {"name": "GitHub", "url": "https://github.com/jiarbuz", "icon": "fab fa-github"},
            {"name": "Telegram", "url": "https://t.me/jiarbuz", "icon": "fab fa-telegram"},
            {"name": "Discord", "url": "https://discord.gg/jiarbuz", "icon": "fab fa-discord"},
            {"name": "Roblox Game", "url": "https://roblox.com/games/17065374590", "icon": "fas fa-gamepad"}
        ]
    }
    return render_template('index.html', bio=bio)

@app.route('/screen_info', methods=['POST'])
def screen_info():
    data = request.json
    # Сохраняем аналитику (опционально)
    with open('analytics.json', 'a') as f:
        f.write(json.dumps({
            "timestamp": datetime.now().isoformat(),
            "data": data
        }) + '\n')
    return jsonify({"status": "ok"})

@app.route('/ping')
def ping():
    return "pong"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### 3️⃣ Структура проекта

```
project/
├── app.py
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   ├── main.js
│   ├── sounds/
│   │   ├── background.mp3
│   │   ├── hover.mp3
│   │   ├── click.mp3
│   │   └── interface_appear.mp3
│   └── favicon.ico
```

### 4️⃣ Запуск

```bash
python app.py
```

Откройте `http://localhost:5000` в браузере.

---


## 🛠 Технические детали

### Frontend
| Технология | Применение |
|------------|------------|
| HTML5 | Структура страницы |
| CSS3 | Анимации, адаптивность, CRT-эффекты |
| JavaScript (ES6+) | Логика терминала, сбор данных, анимации |
| Font Awesome 6 | Иконки для ссылок и кнопок |
| Perfect DOS VGA 437 | Ретро-шрифт (через CDN) |

### API и браузерные возможности
- **WebGL** (`WEBGL_debug_renderer_info`) — определение видеокарты
- **Battery API** — уровень заряда батареи
- **Device Memory API** — объём RAM
- **Network Information API** — тип соединения (опционально)
- **Performance API** — метрики загрузки и FPS
- **Fetch API** — отправка аналитики и получение IP

### Backend (опционально)
- Flask для отдачи статики и приёма POST-запросов
- Эндпоинт `/ping` для измерения задержки
- Эндпоинт `/screen_info` для сохранения аналитики

---

## 📱 Адаптивность

| Устройство | Особенности |
|------------|-------------|
| Десктоп (>1200px) | Две колонки: терминал + ссылки |
| Планшет (768-1200px) | Одна колонка, вертикальный порядок |
| Мобильный (<768px) | Переключаемые секции через кнопки |
| Ландшафтный режим | Компактный просмотр с двумя колонками |

---

## ⚙️ Команды терминала (подробнее)

```bash
# Основные
help                    # Справка
clear                   # Очистка
exit                    # "Выключение" ПК
reboot                  # Перезагрузка страницы
date                    # Текущая дата/время
whoami                  # Имя пользователя

# Информационные
about                   # О сайте и разработчике
games                   # Список любимых игр
devices                 # Периферия
ping                    # Задержка до сервера
fps                     # Измерение FPS

# Системные
battery                 # Уровень заряда (Battery API)
lshw -c video           # Информация о GPU (WebGL)
browser                 # Детали браузера
ifconfig                # Публичный IP
```

---

## 🎨 Кастомизация

### Изменение ссылок
Отредактируйте `bio.links` в `app.py`:

```python
"links": [
    {"name": "Название", "url": "https://...", "icon": "fab fa-github"},
    # ... добавляйте сколько угодно
]
```

### Изменение ASCII-арта
Найдите в `index.html` блок с классом `ascii-art` и замените на свой арт.

### Настройка цветовой схемы
В `style.css` измените значение переменной `--green`:

```css
:root {
    --green: #00ff66;  /* Можете поменять на #0f0, #00ffcc и т.д. */
}
```

---

## 📊 Аналитика

Данные пользователя отправляются на `/screen_info` в формате JSON:

```json
{
  "width": 1920,
  "height": 1080,
  "scale": 2,
  "webgl_vendor": "NVIDIA Corporation",
  "webgl_renderer": "NVIDIA GeForce RTX 2060 SUPER",
  "hardwareConcurrency": 8,
  "deviceMemory": 16,
  "platform": "Win32",
  "timezone": "Europe/Moscow",
  "language": "ru-RU",
  "fingerprint": "a1b2c3... (SHA-256)"
}
```

**⚠️ Предупреждение:** Собирайте данные только с согласия пользователей и в соответствии с GDPR/152-ФЗ. Добавьте уведомление об аналитике при необходимости.

---

## 🐛 Известные ограничения

| Проблема | Решение |
|----------|---------|
| WebGL не работает в некоторых браузерах | GPU будет определена как "Unknown" |
| Battery API требует HTTPS | Для локальной разработки используйте localhost |
| Автовоспроизведение звука блокируется | Звук активируется после первого клика/тапа |
| Playwright не нужен (это не бот) | Весь функционал работает в браузере |


---

## 🔬 Источники

- [Flask](https://flask.palletsprojects.com/) 
- [Font Awesome](https://fontawesome.com/)
- [ipify.org](https://www.ipify.org/) 


---

