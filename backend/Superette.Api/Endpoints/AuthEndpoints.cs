using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using Superette.Api.Data;
using Superette.Api.Models;

namespace Superette.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var g = app.MapGroup("/api/auth");

        g.MapPost("/login", async (LoginRequest r, MongoContext db,
            IPasswordHasher<AdminUser> hasher, HttpContext http) =>
        {
            var username = (r.Username ?? "").Trim().ToLowerInvariant();
            var user = username.Length == 0
                ? null
                : await db.Users.Find(u => u.Username == username).FirstOrDefaultAsync();

            var ok = user is not null &&
                     hasher.VerifyHashedPassword(user, user.PasswordHash, r.Password ?? "")
                         != PasswordVerificationResult.Failed;

            // Same answer whether the user or the password is wrong.
            if (!ok)
                return Results.Json(new { message = "اسم المستخدم أو كلمة المرور غير صحيحة" }, statusCode: 401);

            var identity = new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, user!.Id!), new Claim(ClaimTypes.Name, user.Username)],
                CookieAuthenticationDefaults.AuthenticationScheme);

            await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties { IsPersistent = true });

            return Results.Ok(new { username = user.Username });
        }).RequireRateLimiting("login");

        g.MapPost("/logout", async (HttpContext http) =>
        {
            await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        g.MapGet("/me", (ClaimsPrincipal user) => Results.Ok(new { username = user.Identity!.Name }))
            .RequireAuthorization();
    }
}
