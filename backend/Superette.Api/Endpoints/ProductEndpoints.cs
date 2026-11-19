using System.Security.Claims;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using Superette.Api.Data;
using Superette.Api.Models;
using Superette.Api.Services;

namespace Superette.Api.Endpoints;

public static class ProductEndpoints
{
    public static void MapProductEndpoints(this WebApplication app)
    {
        // ================= Public catalog (no cost price / margin) =================
        var pub = app.MapGroup("/api/products");

        pub.MapGet("/", async (MongoContext db, string? q, string? category, string? sort,
            bool? featured, bool? promo, int? page, int? pageSize) =>
        {
            var r = await Query(db, BuildFilter(q, category, true, featured, promo), sort, page, pageSize);
            return Results.Ok(new Paged<PublicProductDto>(r.Items.Select(ToPublic).ToList(), r.Total, r.Page, r.PageSize));
        });

        pub.MapGet("/categories", async (MongoContext db) =>
        {
            var today = DateTime.UtcNow.Date;
            var cats = await (await db.Products.DistinctAsync(p => p.Category, p => p.ExpiryDate >= today)).ToListAsync();
            return Results.Ok(cats.OrderBy(c => c));
        });

        pub.MapGet("/barcode/{code}", async (string code, MongoContext db) =>
        {
            var p = await db.Products.Find(x => x.Barcode == code.Trim()).FirstOrDefaultAsync();
            return p is null ? Results.NotFound() : Results.Ok(ToPublic(p));
        });

        pub.MapGet("/{id}", async (string id, MongoContext db) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            return p is null ? Results.NotFound() : Results.Ok(ToPublic(p));
        });

        // ================= Admin (cookie auth required) =================
        var admin = app.MapGroup("/api/admin/products").RequireAuthorization();

        admin.MapGet("/", async (MongoContext db, string? q, string? category, string? sort, int? page, int? pageSize) =>
        {
            var r = await Query(db, BuildFilter(q, category, false, null, null), sort, page, pageSize);
            return Results.Ok(new Paged<Product>(r.Items, r.Total, r.Page, r.PageSize));
        });

        admin.MapGet("/{id}", async (string id, MongoContext db) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            return p is null ? Results.NotFound() : Results.Ok(p);
        });

        admin.MapPost("/", async (ProductRequest r, MongoContext db, ClaimsPrincipal user) =>
        {
            var errors = Validate(r);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var p = new Product();
            Apply(p, r);
            try { await db.Products.InsertOneAsync(p); }
            catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["barcode"] = ["هذا الباركود مستعمل لمنتج آخر"] });
            }

            // Initial stock counts as money spent on goods
            if (p.Stock > 0)
                await db.Movements.InsertOneAsync(StockMovement.Create(
                    p, "purchase", p.Stock, p.CostPrice, p.CostPrice, "مخزون أولي", user.Identity?.Name));

            return Results.Created($"/api/admin/products/{p.Id}", p);
        });

        admin.MapPut("/{id}", async (string id, ProductRequest r, MongoContext db, ImageStorage images, ClaimsPrincipal user) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var errors = Validate(r);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (p is null) return Results.NotFound();

            var oldStock = p.Stock;
            var oldImage = p.ImagePublicId;
            Apply(p, r);

            try { await db.Products.ReplaceOneAsync(x => x.Id == id, p); }
            catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["barcode"] = ["هذا الباركود مستعمل لمنتج آخر"] });
            }

            // Changing the stock by hand is recorded in the history
            if (p.Stock != oldStock)
                await db.Movements.InsertOneAsync(StockMovement.Create(
                    p, "adjustment", p.Stock - oldStock, 0, p.CostPrice, "تعديل يدوي", user.Identity?.Name));

            if (!string.IsNullOrEmpty(oldImage) && oldImage != p.ImagePublicId)
                await images.DeleteAsync(oldImage);

            return Results.Ok(p);
        });

        admin.MapDelete("/{id}", async (string id, MongoContext db, ImageStorage images) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (p is null) return Results.NotFound();

            await db.Products.DeleteOneAsync(x => x.Id == id);
            await images.DeleteAsync(p.ImagePublicId);
            return Results.NoContent();
        });
    }

    // ---------- helpers ----------
    static PublicProductDto ToPublic(Product p) => new(
        p.Id!, p.Name, p.SellingPrice, p.FinalPrice,
        p.PromoActive ? p.PromoPercent : 0, p.PromoActive ? p.PromoEndsAt : null,
        p.Stock, p.Category, p.Company, p.ExpiryDate, p.Barcode, p.ImageUrl, p.IsFeatured);

    static FilterDefinition<Product> BuildFilter(string? q, string? category, bool publicOnly, bool? featured, bool? promo)
    {
        var fb = Builders<Product>.Filter;
        var f = fb.Empty;

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            var re = new BsonRegularExpression(Regex.Escape(term), "i");
            f &= fb.Or(fb.Regex(p => p.Name, re), fb.Regex(p => p.Company, re), fb.Eq(p => p.Barcode, term));
        }
        if (!string.IsNullOrWhiteSpace(category)) f &= fb.Eq(p => p.Category, category);
        if (publicOnly) f &= fb.Gte(p => p.ExpiryDate, DateTime.UtcNow.Date); // hide expired products from the public
        if (featured == true) f &= fb.Eq(p => p.IsFeatured, true);
        if (promo == true)
            f &= fb.Gt(p => p.PromoPercent, 0m) &
                 (fb.Eq(p => p.PromoEndsAt, null) | fb.Gte(p => p.PromoEndsAt, DateTime.UtcNow.Date));
        return f;
    }

    static SortDefinition<Product> BuildSort(string? sort)
    {
        var sb = Builders<Product>.Sort;
        SortDefinition<Product> main = sort switch
        {
            "price_asc" => sb.Ascending(p => p.SellingPrice),
            "price_desc" => sb.Descending(p => p.SellingPrice),
            "newest" => sb.Descending(p => p.CreatedAt),
            _ => sb.Ascending(p => p.Name),
        };
        return sb.Combine(main, sb.Ascending(p => p.Id)); // stable pagination
    }

    static async Task<(List<Product> Items, long Total, int Page, int PageSize)> Query(
        MongoContext db, FilterDefinition<Product> filter, string? sort, int? page, int? pageSize)
    {
        var size = Math.Clamp(pageSize ?? 12, 1, 48);
        var pg = Math.Max(1, page ?? 1);
        var total = await db.Products.CountDocumentsAsync(filter);
        var items = await db.Products.Find(filter).Sort(BuildSort(sort))
            .Skip((pg - 1) * size).Limit(size).ToListAsync();
        return (items, total, pg, size);
    }

    static Dictionary<string, string[]> Validate(ProductRequest r)
    {
        var e = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(r.Name) || r.Name.Trim().Length > 120)
            e["name"] = ["اسم المنتج مطلوب (120 حرفًا كحد أقصى)"];
        if (r.CostPrice is null or < 0 or > 1_000_000)
            e["costPrice"] = ["سعر التكلفة غير صالح"];
        if (r.ProfitMargin is null or < 0 or > 1000)
            e["profitMargin"] = ["نسبة الربح غير صالحة"];
        if (r.Stock is null or < 0 or > 1_000_000)
            e["stock"] = ["الكمية غير صالحة"];
        if (string.IsNullOrWhiteSpace(r.Category) || r.Category.Trim().Length > 60)
            e["category"] = ["الصنف مطلوب (60 حرفًا كحد أقصى)"];
        if (string.IsNullOrWhiteSpace(r.Company) || r.Company.Trim().Length > 60)
            e["company"] = ["اسم الشركة مطلوب (60 حرفًا كحد أقصى)"];
        if (r.ExpiryDate is null)
            e["expiryDate"] = ["تاريخ الانتهاء مطلوب"];
        if (!string.IsNullOrWhiteSpace(r.Barcode) && !Regex.IsMatch(r.Barcode.Trim(), @"^[A-Za-z0-9\-]{4,40}$"))
            e["barcode"] = ["الباركود غير صالح (أرقام وحروف فقط)"];
        if (r.PromoPercent is < 0 or > 90)
            e["promoPercent"] = ["نسبة التخفيض بين 0 و 90"];
        if (!string.IsNullOrEmpty(r.ImageUrl) &&
            (!r.ImageUrl.StartsWith("https://res.cloudinary.com/") || r.ImageUrl.Length > 500 ||
             string.IsNullOrEmpty(r.ImagePublicId) || !r.ImagePublicId.StartsWith("superette/products/")))
            e["imageUrl"] = ["الصورة غير صالحة"];
        return e;
    }

    static void Apply(Product p, ProductRequest r)
    {
        p.Name = r.Name!.Trim();
        p.CostPrice = r.CostPrice!.Value;
        p.ProfitMargin = r.ProfitMargin!.Value;
        // The server is the source of truth for the price, never the browser.
        p.SellingPrice = Math.Round(p.CostPrice * (1 + p.ProfitMargin / 100), 2);
        p.Stock = r.Stock!.Value;
        p.Category = r.Category!.Trim();
        p.Company = r.Company!.Trim();
        p.ExpiryDate = DateTime.SpecifyKind(r.ExpiryDate!.Value.Date, DateTimeKind.Utc);
        p.Barcode = string.IsNullOrWhiteSpace(r.Barcode) ? null : r.Barcode.Trim();
        p.PromoPercent = r.PromoPercent ?? 0;
        p.PromoEndsAt = r.PromoEndsAt is null ? null : DateTime.SpecifyKind(r.PromoEndsAt.Value.Date, DateTimeKind.Utc);
        p.IsFeatured = r.IsFeatured ?? false;
        if (!string.IsNullOrEmpty(r.ImageUrl))
        {
            p.ImageUrl = r.ImageUrl;
            p.ImagePublicId = r.ImagePublicId;
        }
        p.UpdatedAt = DateTime.UtcNow;
    }
}