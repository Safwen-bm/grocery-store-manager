using Microsoft.Extensions.Options;
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
    }

    public async Task InitializeAsync()
    {
        await Users.Indexes.CreateOneAsync(new CreateIndexModel<AdminUser>(
            Builders<AdminUser>.IndexKeys.Ascending(u => u.Username),
            new CreateIndexOptions { Unique = true }));

        await Products.Indexes.CreateOneAsync(new CreateIndexModel<Product>(
            Builders<Product>.IndexKeys.Ascending(p => p.Category)));
    }
}
