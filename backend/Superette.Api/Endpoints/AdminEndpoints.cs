using System.Security.Claims;
using MongoDB.Bson;
using MongoDB.Driver;
using Superette.Api.Data;
using Superette.Api.Models;
using Superette.Api.Services;

namespace Superette.Api.Endpoints;

public static class AdminEndpoints
{
    static readonly string[] ManualTypes = ["sale", "purchase", "waste"];

    public static void MapAdminEndpoints(this WebApplication app)
    {
        var admin = app.MapGroup("/api/admin").RequireAuthorization();

        // ---------- Image upload -> Cloudinary ----------
        admin.MapPost("/uploads", async (IFormFile file, ImageStorage images) =>
        {
            if (!images.Enabled)
                return Results.Json(new { message = "Cloudinary غير مُعدّ على الخادم" }, statusCode: 503);
            if (file.Length == 0 || file.Length > 2_500_000)
                return Results.Json(new { message = "حجم الصورة غير مقبول" }, statusCode: 400);
            if (file.ContentType is not ("image/jpeg" or "image/png" or "image/webp"))
                return Results.Json(new { message = "نوع الصورة غير مدعوم" }, statusCode: 400);

            try
            {
                var (url, publicId) = await images.UploadAsync(file);
                return Results.Ok(new { url, publicId });
            }
            catch (Exception ex)
            {
                return Results.Json(new { message = "فشل رفع الصورة: " + ex.Message }, statusCode: 502);
            }
        }).DisableAntiforgery(); // protected by the SameSite=Strict auth cookie

        // ---------- Stock movements ----------
        admin.MapPost("/movements", async (MovementRequest r, MongoContext db, ClaimsPrincipal user) =>
        {
            var errors = new Dictionary<string, string[]>();
            var type = (r.Type ?? "").ToLowerInvariant();
            if (r.ProductId is null || !ObjectId.TryParse(r.ProductId, out _)) errors["productId"] = ["اختر منتجاً"];
            if (!ManualTypes.Contains(type)) errors["type"] = ["نوع الحركة غير صالح"];
            if (r.Quantity is null or < 1 or > 1_000_000) errors["quantity"] = ["الكمية غير صالحة"];
            if (r.UnitPrice is < 0) errors["unitPrice"] = ["السعر غير صالح"];
            if (r.Note is { Length: > 200 }) errors["note"] = ["الملاحظة طويلة جداً"];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var id = r.ProductId!;
            var qty = r.Quantity!.Value;
            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (p is null) return Results.NotFound();

            var fb = Builders<Product>.Filter;
            var ub = Builders<Product>.Update;
            var filter = fb.Eq(x => x.Id, id);
            UpdateDefinition<Product> inc;
            if (type == "purchase")
            {
                inc = ub.Inc(x => x.Stock, qty);
            }
            else
            {
                filter &= fb.Gte(x => x.Stock, qty); // never go below zero
                inc = ub.Inc(x => x.Stock, -qty);
            }

            var updated = await db.Products.FindOneAndUpdateAsync(
                filter,
                ub.Combine(inc, ub.Set(x => x.UpdatedAt, DateTime.UtcNow)),
                new FindOneAndUpdateOptions<Product> { ReturnDocument = ReturnDocument.After });

            if (updated is null)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["quantity"] = ["الكمية المتوفرة غير كافية"] });

            var unitPrice = r.UnitPrice ?? (type == "sale" ? p.FinalPrice : p.CostPrice);
            var unitCost = type == "purchase" ? unitPrice : p.CostPrice;
            var movement = StockMovement.Create(p, type, qty, unitPrice, unitCost, r.Note?.Trim(), user.Identity?.Name);
            await db.Movements.InsertOneAsync(movement);

            return Results.Ok(new { movement, stock = updated.Stock });
        });

        admin.MapGet("/movements", async (MongoContext db, string? type, string? productId, int? page, int? pageSize) =>
        {
            var fb = Builders<StockMovement>.Filter;
            var f = fb.Empty;
            if (!string.IsNullOrEmpty(type)) f &= fb.Eq(m => m.Type, type);
            if (!string.IsNullOrEmpty(productId) && ObjectId.TryParse(productId, out _)) f &= fb.Eq(m => m.ProductId, productId);

            var size = Math.Clamp(pageSize ?? 15, 1, 50);
            var pg = Math.Max(1, page ?? 1);
            var total = await db.Movements.CountDocumentsAsync(f);
            var items = await db.Movements.Find(f).SortByDescending(m => m.CreatedAt)
                .Skip((pg - 1) * size).Limit(size).ToListAsync();
            return Results.Ok(new Paged<StockMovement>(items, total, pg, size));
        });

        // ---------- Dashboard ----------
        admin.MapGet("/dashboard", async (MongoContext db) =>
        {
            var all = await db.Products.Find(_ => true).ToListAsync();
            var today = DateTime.UtcNow.Date;
            var soon = today.AddDays(30);

            static object Slim(Product p) => new { p.Id, p.Name, p.Stock, p.Category, p.ExpiryDate };

            var todaySales = (await db.Movements.Find(m => m.Type == "sale" && m.CreatedAt >= today).ToListAsync())
                .Sum(m => m.Total);
            var recent = await db.Movements.Find(_ => true).SortByDescending(m => m.CreatedAt).Limit(8).ToListAsync();

            return Results.Ok(new
            {
                totalProducts = all.Count,
                stockValue = all.Sum(p => p.CostPrice * p.Stock),
                retailValue = all.Sum(p => p.SellingPrice * p.Stock),
                todaySales,
                expired = all.Where(p => p.ExpiryDate < today && p.Stock > 0).OrderBy(p => p.ExpiryDate).Select(Slim),
                expiringSoon = all.Where(p => p.ExpiryDate >= today && p.ExpiryDate <= soon && p.Stock > 0)
                                  .OrderBy(p => p.ExpiryDate).Select(Slim),
                outOfStock = all.Where(p => p.Stock == 0).OrderBy(p => p.Name).Select(Slim),
                lowStock = all.Where(p => p.Stock > 0 && p.Stock < 10).OrderBy(p => p.Stock).Select(Slim),
                recentMovements = recent,
            });
        });

        // ---------- Expenses ----------
        admin.MapGet("/expenses", async (MongoContext db, DateTime? dateFrom, DateTime? dateTo) =>
        {
            var (start, end) = Range(dateFrom, dateTo);
            var list = await db.Expenses.Find(e => e.Date >= start && e.Date < end)
                .SortByDescending(e => e.Date).ToListAsync();
            return Results.Ok(list);
        });

        admin.MapPost("/expenses", async (ExpenseRequest r, MongoContext db) =>
        {
            var errors = new Dictionary<string, string[]>();
            if (string.IsNullOrWhiteSpace(r.Title) || r.Title.Trim().Length > 100) errors["title"] = ["الوصف مطلوب"];
            if (string.IsNullOrWhiteSpace(r.Category) || r.Category.Trim().Length > 40) errors["category"] = ["النوع مطلوب"];
            if (r.Amount is null or <= 0 or > 10_000_000) errors["amount"] = ["المبلغ غير صالح"];
            if (r.Note is { Length: > 200 }) errors["note"] = ["الملاحظة طويلة جداً"];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var e = new Expense
            {
                Title = r.Title!.Trim(),
                Category = r.Category!.Trim(),
                Amount = Math.Round(r.Amount!.Value, 2),
                Date = DateTime.SpecifyKind((r.Date ?? DateTime.UtcNow).Date, DateTimeKind.Utc),
                Note = r.Note?.Trim(),
            };
            await db.Expenses.InsertOneAsync(e);
            return Results.Created($"/api/admin/expenses/{e.Id}", e);
        });

        admin.MapDelete("/expenses/{id}", async (string id, MongoContext db) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var res = await db.Expenses.DeleteOneAsync(e => e.Id == id);
            return res.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
        });

        // ---------- Finance summary ----------
        admin.MapGet("/finance/summary", async (MongoContext db, DateTime? dateFrom, DateTime? dateTo) =>
        {
            var (start, end) = Range(dateFrom, dateTo);
            var movements = await db.Movements.Find(m => m.CreatedAt >= start && m.CreatedAt < end).ToListAsync();
            var expenses = await db.Expenses.Find(e => e.Date >= start && e.Date < end).ToListAsync();

            var sales = movements.Where(m => m.Type == "sale").ToList();
            var revenue = sales.Sum(m => m.Total);
            var costOfGoods = sales.Sum(m => m.Quantity * m.UnitCost);
            var stockPurchases = movements.Where(m => m.Type == "purchase").Sum(m => m.Total);
            var waste = movements.Where(m => m.Type == "waste").Sum(m => m.Quantity * m.UnitCost);
            var expensesTotal = expenses.Sum(e => e.Amount);

            return Results.Ok(new
            {
                revenue,
                costOfGoods,
                stockPurchases,
                expenses = expensesTotal,
                waste,
                moneyOut = stockPurchases + expensesTotal,
                profit = revenue - costOfGoods - waste - expensesTotal,
                daily = sales.GroupBy(m => m.CreatedAt.Date).OrderBy(g => g.Key)
                    .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), revenue = g.Sum(m => m.Total) }),
            });
        });
    }

    // default period = from the 1st of this month until today (inclusive)
    static (DateTime Start, DateTime End) Range(DateTime? from, DateTime? to)
    {
        var now = DateTime.UtcNow;
        var start = DateTime.SpecifyKind((from ?? new DateTime(now.Year, now.Month, 1)).Date, DateTimeKind.Utc);
        var end = DateTime.SpecifyKind((to ?? now).Date.AddDays(1), DateTimeKind.Utc);
        return (start, end);
    }
}