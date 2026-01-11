using System.Text;
using System.Text.Json;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders divider/line components to HTML.
/// </summary>
public static class HtmlDividerRenderer
{
    public static void Render(StringBuilder sb, Dictionary<string, JsonElement> properties)
    {
        var thickness = HtmlPropertyHelpers.GetFloat(properties, "thickness", 1);
        var color = HtmlPropertyHelpers.GetString(properties, "color", "#000000");
        var orientation = HtmlPropertyHelpers.GetString(properties, "orientation", "horizontal");
        var dashPattern = HtmlPropertyHelpers.GetFloatArray(properties, "dashPattern");
        var gradientColors = HtmlPropertyHelpers.GetStringArray(properties, "gradientColors");

        // Determine border style based on dash pattern
        var borderStyle = "solid";
        if (dashPattern != null && dashPattern.Length >= 2)
        {
            // Approximate CSS dash styles based on pattern
            var ratio = dashPattern[0] / dashPattern[1];
            borderStyle = ratio > 2 ? "dashed" : "dotted";
        }

        // Build background/border color
        var colorValue = color;
        if (gradientColors != null && gradientColors.Count >= 2)
        {
            var direction = orientation == "vertical" ? "to bottom" : "to right";
            colorValue = $"linear-gradient({direction}, {string.Join(", ", gradientColors)})";
        }

        if (orientation == "vertical")
        {
            var style = $"height: 100%; width: {thickness}px; background: {colorValue};";
            if (dashPattern != null && dashPattern.Length >= 2)
            {
                style = $"height: 100%; border-left: {thickness}px {borderStyle} {color};";
            }
            sb.AppendLine($"<div class=\"divider-vertical\" style=\"{style}\"></div>");
        }
        else
        {
            var style = $"width: 100%; height: {thickness}px; background: {colorValue};";
            if (dashPattern != null && dashPattern.Length >= 2)
            {
                style = $"width: 100%; border-top: {thickness}px {borderStyle} {color};";
            }
            sb.AppendLine($"<div class=\"divider-horizontal\" style=\"{style}\"></div>");
        }
    }
}
