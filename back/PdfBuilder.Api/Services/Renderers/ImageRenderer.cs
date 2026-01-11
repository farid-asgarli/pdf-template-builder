using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders image components supporting raster images (JPEG, PNG, BMP, WEBP) and SVG.
/// Implements proper QuestPDF image handling with fit modes, compression, and DPI settings.
/// </summary>
public static class ImageRenderer
{
    // Reusable HttpClient for downloading images from URLs
    private static readonly HttpClient HttpClient = new() { Timeout = TimeSpan.FromSeconds(30) };

    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var src = PropertyHelpers.GetString(properties, "src", "");
        var imageType = PropertyHelpers.GetString(properties, "imageType", "raster");
        var fitMode = PropertyHelpers.GetString(properties, "fitMode", "fitArea");
        var compressionQuality = PropertyHelpers.GetString(
            properties,
            "compressionQuality",
            "high"
        );
        var rasterDpi = PropertyHelpers.GetInt(properties, "rasterDpi", 288);
        var useOriginalImage = PropertyHelpers.GetBool(properties, "useOriginalImage", false);

        // If no source, render placeholder (warning style - missing optional content)
        if (string.IsNullOrEmpty(src))
        {
            PlaceholderRenderer.RenderWarning(container, "No image source");
            return;
        }

        try
        {
            if (imageType.Equals("svg", StringComparison.OrdinalIgnoreCase))
            {
                RenderSvgImage(container, src, fitMode);
            }
            else
            {
                RenderRasterImage(
                    container,
                    src,
                    fitMode,
                    compressionQuality,
                    rasterDpi,
                    useOriginalImage
                );
            }
        }
        catch (Exception ex)
        {
            // Log exception in real scenario
            PlaceholderRenderer.RenderError(container, $"Image Error: {ex.Message}");
        }
    }

    /// <summary>
    /// Renders SVG images with proper fit mode support.
    /// </summary>
    private static void RenderSvgImage(IContainer container, string src, string fitMode)
    {
        string svgContent;

        // Check if it's base64 encoded SVG
        if (src.StartsWith("data:image/svg+xml"))
        {
            svgContent = ExtractBase64SvgContent(src);
        }
        // Check if it's a URL
        else if (src.StartsWith("http://") || src.StartsWith("https://"))
        {
            svgContent = DownloadSvgContent(src);
        }
        // Assume it's SVG content directly or a file path
        else if (src.TrimStart().StartsWith("<") || src.TrimStart().StartsWith("<?xml"))
        {
            svgContent = src;
        }
        else if (File.Exists(src))
        {
            svgContent = File.ReadAllText(src);
        }
        else
        {
            PlaceholderRenderer.RenderWarning(container, "SVG not found");
            return;
        }

        var svgDescriptor = container.Svg(svgContent);
        ApplySvgFitMode(svgDescriptor, fitMode);
    }

    /// <summary>
    /// Renders raster images (JPEG, PNG, BMP, WEBP) with compression and DPI settings.
    /// </summary>
    private static void RenderRasterImage(
        IContainer container,
        string src,
        string fitMode,
        string compressionQuality,
        int rasterDpi,
        bool useOriginalImage
    )
    {
        byte[] imageBytes;

        // Determine image source and load bytes
        if (src.StartsWith("data:image"))
        {
            imageBytes = ExtractBase64ImageBytes(src);
        }
        else if (src.StartsWith("http://") || src.StartsWith("https://"))
        {
            imageBytes = DownloadImageBytes(src);
        }
        else if (File.Exists(src))
        {
            imageBytes = File.ReadAllBytes(src);
        }
        else
        {
            PlaceholderRenderer.RenderWarning(container, "Image not found");
            return;
        }

        // Render the image with QuestPDF settings
        var imageDescriptor = container.Image(imageBytes);

        // Apply fit mode
        ApplyImageFitMode(imageDescriptor, fitMode);

        // Apply quality settings (only if not using original)
        if (useOriginalImage)
        {
            imageDescriptor.UseOriginalImage();
        }
        else
        {
            // Apply compression quality
            var quality = ParseCompressionQuality(compressionQuality);
            imageDescriptor.WithCompressionQuality(quality);

            // Apply DPI setting
            if (rasterDpi > 0)
            {
                imageDescriptor.WithRasterDpi(rasterDpi);
            }
        }
    }

    /// <summary>
    /// Extracts image bytes from a base64 data URL.
    /// </summary>
    private static byte[] ExtractBase64ImageBytes(string dataUrl)
    {
        var base64Data = dataUrl.Contains(',') ? dataUrl.Split(',')[1] : dataUrl;
        return Convert.FromBase64String(base64Data);
    }

    /// <summary>
    /// Extracts SVG content from a base64 data URL.
    /// </summary>
    private static string ExtractBase64SvgContent(string dataUrl)
    {
        var base64Data = dataUrl.Contains(',') ? dataUrl.Split(',')[1] : dataUrl;
        var bytes = Convert.FromBase64String(base64Data);
        return System.Text.Encoding.UTF8.GetString(bytes);
    }

    /// <summary>
    /// Downloads image bytes from a URL.
    /// </summary>
    private static byte[] DownloadImageBytes(string url)
    {
        // Use synchronous call for simplicity in rendering context
        // In production, consider caching downloaded images
        var response = HttpClient.GetAsync(url).GetAwaiter().GetResult();
        response.EnsureSuccessStatusCode();
        return response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult();
    }

    /// <summary>
    /// Downloads SVG content from a URL.
    /// </summary>
    private static string DownloadSvgContent(string url)
    {
        var response = HttpClient.GetAsync(url).GetAwaiter().GetResult();
        response.EnsureSuccessStatusCode();
        return response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
    }

    /// <summary>
    /// Applies fit mode to raster image descriptor.
    /// Maps frontend fitMode values to QuestPDF methods.
    /// </summary>
    private static void ApplyImageFitMode(ImageDescriptor image, string fitMode)
    {
        switch (fitMode.ToLowerInvariant())
        {
            case "fitwidth":
                image.FitWidth();
                break;
            case "fitheight":
                image.FitHeight();
                break;
            case "fitunproportionally":
                image.FitUnproportionally();
                break;
            case "fitarea":
            default:
                image.FitArea();
                break;
        }
    }

    /// <summary>
    /// Applies fit mode to SVG image descriptor.
    /// SVG supports FitWidth, FitHeight, and FitArea.
    /// Note: FitUnproportionally is not supported for SVG, falls back to FitArea.
    /// </summary>
    private static void ApplySvgFitMode(SvgImageDescriptor svg, string fitMode)
    {
        switch (fitMode.ToLowerInvariant())
        {
            case "fitwidth":
                svg.FitWidth();
                break;
            case "fitheight":
                svg.FitHeight();
                break;
            case "fitunproportionally":
                // SVG doesn't support FitUnproportionally, fall back to FitArea
                svg.FitArea();
                break;
            case "fitarea":
            default:
                svg.FitArea();
                break;
        }
    }

    /// <summary>
    /// Parses compression quality string to QuestPDF enum.
    /// </summary>
    private static ImageCompressionQuality ParseCompressionQuality(string quality)
    {
        return quality.ToLowerInvariant() switch
        {
            "best" => ImageCompressionQuality.Best,
            "veryhigh" => ImageCompressionQuality.VeryHigh,
            "high" => ImageCompressionQuality.High,
            "medium" => ImageCompressionQuality.Medium,
            "low" => ImageCompressionQuality.Low,
            "verylow" => ImageCompressionQuality.VeryLow,
            _ => ImageCompressionQuality.High,
        };
    }
}
