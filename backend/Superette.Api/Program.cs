using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using Superette.Api.Data;
using Superette.Api.Endpoints;
using Superette.Api.Models;
using Superette.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MongoSettings>(builder.Configuration.GetSection("Mongo"));
builder.Services.AddSingleton<MongoContext>();
builder.Services.AddSingleton<ImageStorage>();
builder.Services.AddSingleton<IPasswordHasher<AdminUser>, PasswordHasher<AdminUser>>();

// Request size cap (images are compressed client-side before upload)
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 4_000_000);

// Cookie auth: HttpOnly + SameSite=Strict -> JS can't read it, other sites can't use it.
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "sf_auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Strict;
        o.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        o.ExpireTimeSpan = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
        o.Events.OnRedirectToLogin = c => { c.Response.StatusCode = 401; return Task.CompletedTask; };
        o.Events.OnRedirectToAccessDenied = c => { c.Response.StatusCode = 403; return Task.CompletedTask; };
    });
builder.Services.AddAuthorization();

// Brute-force protection on login: 5 attempts / minute / IP
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});

var app = builder.Build();

// ---------- Startup: indexes + first admin ----------
var db = app.Services.GetRequiredService<MongoContext>();
await db.InitializeAsync();

if (await db.Users.CountDocumentsAsync(Builders<AdminUser>.Filter.Empty) == 0)
{
    var username = app.Configuration["Admin:Username"]?.Trim().ToLowerInvariant();
    var password = app.Configuration["Admin:Password"];
    if (string.IsNullOrWhiteSpace(username) || password is null || password.Length < 10)
        throw new InvalidOperationException(
            "No admin exists yet. Set Admin:Username and Admin:Password (min 10 chars) to create the first one.");

    var hasher = app.Services.GetRequiredService<IPasswordHasher<AdminUser>>();
    var admin = new AdminUser { Username = username };
    admin.PasswordHash = hasher.HashPassword(admin, password);
    await db.Users.InsertOneAsync(admin);
    app.Logger.LogInformation("First admin '{User}' created.", username);
}

if (!app.Services.GetRequiredService<ImageStorage>().Enabled)
    app.Logger.LogWarning("Cloudinary is not configured: image uploads are disabled.");

// ---------- Pipeline ----------
if (!app.Environment.IsDevelopment()) app.UseHsts();

app.Use(async (ctx, next) =>
{
    var h = ctx.Response.Headers;
    h["X-Content-Type-Options"] = "nosniff";
    h["X-Frame-Options"] = "DENY";
    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
    h["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()"; // camera = barcode scanner
    h["Content-Security-Policy"] =
        "default-src 'self'; " +
        "img-src 'self' data: blob: https://res.cloudinary.com; " +
        "media-src 'self' blob:; worker-src 'self' blob:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; script-src 'self'; " +
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
    await next();
});

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));
app.MapAuthEndpoints();
app.MapProductEndpoints();
app.MapAdminEndpoints();
app.MapFallback("/api/{**rest}", () => Results.NotFound());

// Serve the built React app (wwwroot) from the same origin -> no CORS needed.
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = c =>
    {
        if (c.Context.Request.Path.StartsWithSegments("/assets"))
            c.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
    }
});
app.MapFallbackToFile("index.html");

app.Run();