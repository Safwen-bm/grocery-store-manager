using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;
using Superette.Api.Models;

namespace Superette.Api.Data;

public class MongoSettings
{
    public string ConnectionString { get; set; } = "";
    public string Database { get; set; } = "superette";
}

public class MongoContext
{
    public IMongoCollection<Product> Products { get; }
    public IMongoCollection<AdminUser> Users { get; }
    public IMongoCollection<StockMovement> Movements { get; }
    public IMongoCollection<Expense> Expenses { get; }

    static MongoContext()
    {
        // Keep field names camelCase in the database (costPrice, expiryDate, ...)
        ConventionRegistry.Register("superette", new ConventionPack
        {
            new CamelCaseElementNameConvention(),
            new IgnoreExtraElementsConvention(true),
        }, _ => true);
    }

    public MongoContext(IOptions<MongoSettings> options)
    {
        var s = options.Value;
        if (string.IsNullOrWhiteSpace(s.ConnectionString))
            throw new InvalidOperationException("Mongo:ConnectionString is not configured.");

        var db = new MongoClient(s.ConnectionString).GetDatabase(s.Database);
        Products = db.GetCollection<Product>("products");
        Users = db.GetCollection<AdminUser>("users");
        Movements = db.GetCollection<StockMovement>("stockMovements");
        Expenses = db.GetCollection<Expense>("expenses");
    }

    public async Task InitializeAsync()
    {
        await Users.Indexes.CreateOneAsync(new CreateIndexModel<AdminUser>(
            Builders<AdminUser>.IndexKeys.Ascending(u => u.Username),
            new CreateIndexOptions { Unique = true }));

        await Products.Indexes.CreateManyAsync([
            new CreateIndexModel<Product>(Builders<Product>.IndexKeys.Ascending(p => p.Category)),
            // One barcode = one product (products without barcode are ignored by the index)
            new CreateIndexModel<Product>(
                Builders<Product>.IndexKeys.Ascending(p => p.Barcode),
                new CreateIndexOptions<Product>
                {
                    Unique = true,
                    PartialFilterExpression = Builders<Product>.Filter.Type(p => p.Barcode, BsonType.String),
                }),
        ]);

        await Movements.Indexes.CreateManyAsync([
            new CreateIndexModel<StockMovement>(Builders<StockMovement>.IndexKeys.Descending(m => m.CreatedAt)),
            new CreateIndexModel<StockMovement>(Builders<StockMovement>.IndexKeys.Ascending(m => m.ProductId)),
        ]);

        await Expenses.Indexes.CreateOneAsync(new CreateIndexModel<Expense>(
            Builders<Expense>.IndexKeys.Descending(e => e.Date)));
    }
}