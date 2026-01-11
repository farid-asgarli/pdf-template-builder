using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders divider/line components using QuestPDF's Line API.
/// Supports horizontal and vertical lines with customizable thickness, color, gradient, and dash patterns.
/// </summary>
public static class DividerRenderer
{
    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var thickness = PropertyHelpers.GetFloat(properties, "thickness", 1);
        var color = PropertyHelpers.GetString(properties, "color", "#000000");
        var orientation = PropertyHelpers.GetString(properties, "orientation", "horizontal");
        var dashPattern = PropertyHelpers.GetFloatArray(properties, "dashPattern");
        var gradientColors = PropertyHelpers.GetStringArray(properties, "gradientColors");

        if (orientation == "vertical")
        {
            RenderVerticalLine(container, thickness, color, dashPattern, gradientColors);
        }
        else
        {
            RenderHorizontalLine(container, thickness, color, dashPattern, gradientColors);
        }
    }

    private static void RenderHorizontalLine(
        IContainer container,
        float thickness,
        string color,
        float[]? dashPattern,
        List<string>? gradientColors
    )
    {
        var lineDescriptor = container.LineHorizontal(thickness);

        // Apply gradient if multiple colors provided, otherwise use solid color
        if (gradientColors != null && gradientColors.Count >= 2)
        {
            // Convert string colors to Color array
            var colors = gradientColors.Select(c => (Color)c).ToArray();
            lineDescriptor.LineGradient(colors);
        }
        else
        {
            lineDescriptor.LineColor(color);
        }

        // Apply dash pattern if provided (must have even number of elements)
        if (dashPattern != null && dashPattern.Length >= 2 && dashPattern.Length % 2 == 0)
        {
            lineDescriptor.LineDashPattern(dashPattern);
        }
    }

    private static void RenderVerticalLine(
        IContainer container,
        float thickness,
        string color,
        float[]? dashPattern,
        List<string>? gradientColors
    )
    {
        var lineDescriptor = container.LineVertical(thickness);

        // Apply gradient if multiple colors provided, otherwise use solid color
        if (gradientColors != null && gradientColors.Count >= 2)
        {
            // Convert string colors to Color array
            var colors = gradientColors.Select(c => (Color)c).ToArray();
            lineDescriptor.LineGradient(colors);
        }
        else
        {
            lineDescriptor.LineColor(color);
        }

        // Apply dash pattern if provided (must have even number of elements)
        if (dashPattern != null && dashPattern.Length >= 2 && dashPattern.Length % 2 == 0)
        {
            lineDescriptor.LineDashPattern(dashPattern);
        }
    }
}
