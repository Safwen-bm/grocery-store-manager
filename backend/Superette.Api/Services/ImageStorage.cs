using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Superette.Api.Services;

/// <summary>Uploads product images to Cloudinary (keys come from user-secrets / env vars).</summary>
public class ImageStorage
{
    private readonly Cloudinary? _cloudinary;

    public bool Enabled => _cloudinary is not null;

    public ImageStorage(IConfiguration config)
    {
        var name = config["Cloudinary:CloudName"];
        var key = config["Cloudinary:ApiKey"];
        var secret = config["Cloudinary:ApiSecret"];

        if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(secret))
        {
            _cloudinary = new Cloudinary(new Account(name, key, secret));
            _cloudinary.Api.Secure = true;
        }
    }

    public async Task<(string Url, string PublicId)> UploadAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        var result = await _cloudinary!.UploadAsync(new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "superette/products",
            Transformation = new Transformation().Width(1000).Height(1000).Crop("limit").Quality("auto"),
        });

        if (result.Error is not null) throw new InvalidOperationException(result.Error.Message);
        return (result.SecureUrl.ToString(), result.PublicId);
    }

    public async Task DeleteAsync(string? publicId)
    {
        if (_cloudinary is null || string.IsNullOrEmpty(publicId)) return;
        await _cloudinary.DestroyAsync(new DeletionParams(publicId));
    }
}