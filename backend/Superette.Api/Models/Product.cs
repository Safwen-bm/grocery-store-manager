using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Superette.Api.Models;

public class Product
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = "";

    [BsonRepresentation(BsonType.Decimal128)] public decimal CostPrice { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal ProfitMargin { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal SellingPrice { get; set; }

    public int Stock { get; set; }
    public string Category { get; set; } = "";
    public string Company { get; set; } = "";

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ExpiryDate { get; set; }

    [BsonIgnoreIfNull] public string? Barcode { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImagePublicId { get; set; }

    [BsonRepresentation(BsonType.Decimal128)] public decimal PromoPercent { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PromoEndsAt { get; set; }

    public bool IsFeatured { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonIgnore]
    public bool PromoActive =>
        PromoPercent > 0 && (PromoEndsAt is null || PromoEndsAt.Value.Date >= DateTime.UtcNow.Date);

    [BsonIgnore]
    public decimal FinalPrice =>
        PromoActive ? Math.Round(SellingPrice * (1 - PromoPercent / 100), 2) : SellingPrice;
}

public class AdminUser
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}

/// <summary>Every change of stock: sale, purchase, waste, or manual adjustment.</summary>
public class StockMovement
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = "";
    public string ProductName { get; set; } = "";

    /// <summary>sale | purchase | waste | adjustment</summary>
    public string Type { get; set; } = "";
    public int Quantity { get; set; }

    [BsonRepresentation(BsonType.Decimal128)] public decimal UnitPrice { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal UnitCost { get; set; }
    [BsonRepresentation(BsonType.Decimal128)] public decimal Total { get; set; }

    public string? Note { get; set; }
    public string? Supplier { get; set; }
    public string? CreatedBy { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public static StockMovement Create(Product p, string type, int qty, decimal unitPrice,
        decimal unitCost, string? note, string? by) => new()
        {
            ProductId = p.Id!,
            ProductName = p.Name,
            Type = type,
            Quantity = qty,
            UnitPrice = unitPrice,
            UnitCost = unitCost,
            Total = type == "adjustment" ? 0 : Math.Round(qty * unitPrice, 2),
            Note = note,
            CreatedBy = by,
        };
}

public class Expense
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Title { get; set; } = "";
    public string Category { get; set; } = "";

    [BsonRepresentation(BsonType.Decimal128)] public decimal Amount { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime Date { get; set; }

    public string? Note { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// What the public is allowed to see: no cost price, no profit margin.
public record PublicProductDto(
    string Id, string Name, decimal SellingPrice, decimal FinalPrice, decimal PromoPercent,
    DateTime? PromoEndsAt, int Stock, string Category, string Company, DateTime? ExpiryDate,
    string? Barcode, string? ImageUrl, bool IsFeatured);

public record ProductRequest(
    string? Name, decimal? CostPrice, decimal? ProfitMargin, int? Stock,
    string? Category, string? Company, DateTime? ExpiryDate, string? Barcode,
    string? ImageUrl, string? ImagePublicId, decimal? PromoPercent, DateTime? PromoEndsAt,
    bool? IsFeatured, decimal? SellingPrice);

public record MovementRequest(string? ProductId, string? Type, int? Quantity, decimal? UnitPrice, string? Note, string? Supplier);
public record ExpenseRequest(string? Title, string? Category, decimal? Amount, DateTime? Date, string? Note);
public record LoginRequest(string? Username, string? Password);
public record Paged<T>(IReadOnlyList<T> Items, long Total, int Page, int PageSize);