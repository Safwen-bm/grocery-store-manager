using MongoDB.Bson;
using MongoDB.Driver;
using Superette.Api.Data;
using Superette.Api.Models;

namespace Superette.Api.Endpoints;

public static class ProductEndpoints
{
    const int MaxImageChars = 1_500_000; // ~1.1 MB of base64

    public static void MapProductEndpoints(this WebApplication app)
    {
        // ---------- Public catalog (no cost price / margin) ----------
        var pub = app.MapGroup("/api/products");

        pub.MapGet("/", async (MongoContext db) =>
        {
            var items = await db.Products.Find(_ => true)
                .SortBy(p => p.Name).ToListAsync();
            return Results.Ok(items.Select(ToPublic));
        });

        pub.MapGet("/{id}", async (string id, MongoContext db) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            return p is null ? Results.NotFound() : Results.Ok(ToPublic(p));
        });

        // ---------- Admin (cookie auth required) ----------
        var admin = app.MapGroup("/api/admin/products").RequireAuthorization();

        admin.MapGet("/", async (MongoContext db) =>
            Results.Ok(await db.Products.Find(_ => true).SortBy(p => p.Name).ToListAsync()));

        admin.MapGet("/{id}", async (string id, MongoContext db) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            return p is null ? Results.NotFound() : Results.Ok(p);
        });

        admin.MapPost("/", async (ProductRequest r, MongoContext db) =>
        {
            var errors = Validate(r);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var p = new Product();
            Apply(p, r);
            await db.Products.InsertOneAsync(p);
            return Results.Created($"/api/admin/products/{p.Id}", p);
        });

        admin.MapPut("/{id}", async (string id, ProductRequest r, MongoContext db) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var errors = Validate(r);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var p = await db.Products.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (p is null) return Results.NotFound();

            Apply(p, r);
            await db.Products.ReplaceOneAsync(x => x.Id == id, p);
            return Results.Ok(p);
        });

        admin.MapDelete("/{id}", async (string id, MongoContext db) =>
        {
            if (!ObjectId.TryParse(id, out _)) return Results.NotFound();
            var res = await db.Products.DeleteOneAsync(x => x.Id == id);
            return res.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
        });
    }

    static PublicProductDto ToPublic(Product p) =>
        new(p.Id!, p.Name, p.SellingPrice, p.Stock, p.Category, p.Company, p.ExpiryDate, p.Image);

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
        if (!string.IsNullOrEmpty(r.Image) &&
            (!r.Image.StartsWith("data:image/") || r.Image.Length > MaxImageChars))
            e["image"] = ["الصورة غير صالحة أو كبيرة جدًا"];
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
        if (!string.IsNullOrEmpty(r.Image)) p.Image = r.Image;
        p.UpdatedAt = DateTime.UtcNow;
    }
}
