# security_headers.py
# Добавляет безопасные HTTP-заголовки ко всем ответам Flask

def register_security_headers(app):
    @app.after_request
    def apply_headers(response):
        # === Content Security Policy (CSP) ===
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' https://cdnjs.cloudflare.com https://fonts.cdnfonts.com; "
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.cdnfonts.com; "
            "font-src 'self' https://cdnjs.cloudflare.com https://fonts.cdnfonts.com data:; "
            "img-src 'self' data: https:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )

        # === Clickjacking защита ===
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

        # === Предотвращает MIME sniffing ===
        response.headers["X-Content-Type-Options"] = "nosniff"

        # === Защита от утечки реферера ===
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # === Ограничение API браузера ===
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), fullscreen=(self)"
        )

        # === HTTPS только (включить при деплое на HTTPS) ===
        # response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        # === Убираем заголовок "Server" ===
        response.headers.pop("Server", None)

        # === Убираем возможные утечки через "X-Powered-By" или ASP.NET ===
        for h in list(response.headers.keys()):
            if h.lower().startswith("x-powered-by") or h.lower().startswith("x-aspnet"):
                response.headers.pop(h, None)

        return response

    return app
