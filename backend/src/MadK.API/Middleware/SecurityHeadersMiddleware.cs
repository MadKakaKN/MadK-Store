namespace MadK.API.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _env;

    public SecurityHeadersMiddleware(RequestDelegate _next, IWebHostEnvironment env)
    {
        this._next = _next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // 1. Chống MIME-sniffing
            headers["X-Content-Type-Options"] = "nosniff";

            // 2. Chống Clickjacking
            headers["X-Frame-Options"] = "DENY";

            // 3. Tắt bộ lọc XSS cũ lỗi thời của trình duyệt để tránh lỗ hổng bảo mật mới theo khuyến nghị OWASP
            headers["X-XSS-Protection"] = "0";

            // 4. Bảo vệ thông tin điều hướng Referrer
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // 5. Khóa các quyền phần cứng nhạy cảm không cần thiết
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(self)";

            // 6. Content Security Policy (CSP) linh hoạt, hỗ trợ 3D Canvas WebGL & Google Fonts
            headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com data:; " +
                "img-src 'self' data: https: blob:; " +
                "connect-src 'self' https: http: ws: wss:; " +
                "frame-ancestors 'none';";

            // 7. HSTS (HTTP Strict Transport Security) áp dụng trên HTTPS / Môi trường Production
            if (context.Request.IsHttps || _env.IsProduction())
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
            }

            // 8. Ẩn thông tin công nghệ máy chủ (Information Disclosure)
            headers.Remove("Server");
            headers.Remove("X-Powered-By");

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
