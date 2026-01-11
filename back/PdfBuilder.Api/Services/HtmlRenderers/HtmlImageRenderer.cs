using System.Text;
using System.Text.Json;
using System.Web;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders image components to HTML.
/// Supports raster images (via src) and SVG.
/// </summary>
public static class HtmlImageRenderer
{
    public static void Render(StringBuilder sb, Dictionary<string, JsonElement> properties)
    {
        var src = HtmlPropertyHelpers.GetString(properties, "src", "");
        var imageType = HtmlPropertyHelpers.GetString(properties, "imageType", "raster");
        var fitMode = HtmlPropertyHelpers.GetString(properties, "fitMode", "fitArea");
        var altText = HtmlPropertyHelpers.GetString(properties, "altText", "Image");

        if (string.IsNullOrEmpty(src))
        {
            // Render placeholder for missing image
            sb.AppendLine(
                "<div class=\"placeholder-component\" style=\"background: #fef3c7; border-color: #f59e0b; color: #d97706;\">"
            );
            sb.AppendLine("  No image source");
            sb.AppendLine("</div>");
            return;
        }

        // Determine object-fit based on fitMode
        var objectFit = fitMode.ToLowerInvariant() switch
        {
            "fitwidth" => "width: 100%; height: auto;",
            "fitheight" => "height: 100%; width: auto;",
            "fitarea" => "max-width: 100%; max-height: 100%; object-fit: contain;",
            "fillarea" => "width: 100%; height: 100%; object-fit: cover;",
            "fillwidth" => "width: 100%; height: 100%; object-fit: cover;",
            "fillheight" => "width: 100%; height: 100%; object-fit: cover;",
            _ => "max-width: 100%; max-height: 100%; object-fit: contain;",
        };

        sb.AppendLine(
            "<div class=\"image-component\" style=\"width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;\">"
        );

        if (imageType.Equals("svg", StringComparison.OrdinalIgnoreCase))
        {
            // For SVG, check if it's inline SVG content or a URL
            if (src.StartsWith("<") || src.StartsWith("<?xml"))
            {
                // Inline SVG - render directly
                sb.AppendLine($"  <div style=\"{objectFit}\">{src}</div>");
            }
            else if (src.StartsWith("data:image/svg+xml"))
            {
                // Base64 encoded SVG
                sb.AppendLine(
                    $"  <img src=\"{HttpUtility.HtmlAttributeEncode(src)}\" alt=\"{HttpUtility.HtmlAttributeEncode(altText)}\" style=\"{objectFit}\" />"
                );
            }
            else
            {
                // URL to SVG file
                sb.AppendLine(
                    $"  <img src=\"{HttpUtility.HtmlAttributeEncode(src)}\" alt=\"{HttpUtility.HtmlAttributeEncode(altText)}\" style=\"{objectFit}\" />"
                );
            }
        }
        else
        {
            // Raster image
            sb.AppendLine(
                $"  <img src=\"{HttpUtility.HtmlAttributeEncode(src)}\" alt=\"{HttpUtility.HtmlAttributeEncode(altText)}\" style=\"{objectFit}\" />"
            );
        }

        sb.AppendLine("</div>");
    }
}
