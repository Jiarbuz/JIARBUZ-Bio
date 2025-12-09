def register_security_headers(app):
    @app.after_request
    def apply_headers(response):
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

        response.headers["X-Frame-Options"] = "SAMEORIGIN"

        response.headers["X-Content-Type-Options"] = "nosniff"

        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), fullscreen=(self)"
        )


        response.headers.pop("Server", None)

        for h in list(response.headers.keys()):
            if h.lower().startswith("x-powered-by") or h.lower().startswith("x-aspnet"):
                response.headers.pop(h, None)

        return response

    return app
