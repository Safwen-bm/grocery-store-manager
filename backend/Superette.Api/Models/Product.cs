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
    public DateTime ExpiryDate { get; set; }

    /// <summary>Compressed image stored as a data URL (phase 1). Moves to object storage later.</summary>
    public string? Image { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AdminUser
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}

// What the public is allowed to see: no cost price, no profit margin.
public record PublicProductDto(
    string Id, string Name, decimal SellingPrice, int Stock,
    string Category, string Company, DateTime ExpiryDate, string? Image);

public record ProductRequest(
    string? Name, decimal? CostPrice, decimal? ProfitMargin, int? Stock,
    string? Category, string? Company, DateTime? ExpiryDate, string? Image);

public record LoginRequest(string? Username, string? Password);
