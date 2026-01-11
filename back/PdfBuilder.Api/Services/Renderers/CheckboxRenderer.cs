using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders checkbox components with full customization support.
/// Uses proper QuestPDF Row layout and SVG for crisp checkmark rendering.
/// </summary>
public static class CheckboxRenderer
{
    /// <summary>
    /// Size presets for checkbox (in points).
    /// </summary>
    private static readonly Dictionary<string, float> SizePresets = new()
    {
        { "small", 10 },
        { "medium", 14 },
        { "large", 18 },
    };

    /// <summary>
    /// Configuration record for checkbox styling.
    /// </summary>
    private record CheckboxConfig(
        // Content
        string Label,
        string FieldName,
        bool IsChecked,
        // Checkbox box styling
        string Size,
        string CheckedColor,
        string UncheckedBackgroundColor,
        string BorderColor,
        float BorderWidth,
        float BorderRadius,
        // Checkmark styling
        string CheckmarkStyle,
        string CheckmarkColor,
        // Label styling
        float LabelFontSize,
        string LabelColor,
        string LabelFontWeight,
        // Layout
        float Spacing
    );

    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var config = ExtractConfig(properties);
        RenderCheckbox(container, config);
    }

    /// <summary>
    /// Extract checkbox configuration from properties dictionary.
    /// </summary>
    private static CheckboxConfig ExtractConfig(Dictionary<string, JsonElement> properties)
    {
        // Check both defaultChecked and checked for backward compatibility
        var isChecked = PropertyHelpers.GetBool(properties, "defaultChecked", false);
        if (!isChecked)
        {
            isChecked = PropertyHelpers.GetBool(properties, "checked", false);
        }

        return new CheckboxConfig(
            Label: PropertyHelpers.GetString(properties, "label", "Option"),
            FieldName: PropertyHelpers.GetString(properties, "fieldName", "checkbox_field"),
            IsChecked: isChecked,
            Size: PropertyHelpers.GetString(properties, "size", "medium"),
            CheckedColor: PropertyHelpers.GetString(properties, "checkedColor", "#6750a4"),
            UncheckedBackgroundColor: PropertyHelpers.GetString(
                properties,
                "uncheckedBackgroundColor",
                "#ffffff"
            ),
            BorderColor: PropertyHelpers.GetString(properties, "borderColor", "#79747e"),
            BorderWidth: PropertyHelpers.GetFloat(properties, "borderWidth", 1.5f),
            BorderRadius: PropertyHelpers.GetFloat(properties, "borderRadius", 2f),
            CheckmarkStyle: PropertyHelpers.GetString(properties, "checkmarkStyle", "check"),
            CheckmarkColor: PropertyHelpers.GetString(properties, "checkmarkColor", "#ffffff"),
            LabelFontSize: PropertyHelpers.GetFloat(properties, "labelFontSize", 11f),
            LabelColor: PropertyHelpers.GetString(properties, "labelColor", "#1c1b1f"),
            LabelFontWeight: PropertyHelpers.GetString(properties, "labelFontWeight", "normal"),
            Spacing: PropertyHelpers.GetFloat(properties, "spacing", 6f)
        );
    }

    /// <summary>
    /// Render the checkbox with the given configuration.
    /// </summary>
    private static void RenderCheckbox(IContainer container, CheckboxConfig config)
    {
        var boxSize = SizePresets.GetValueOrDefault(config.Size.ToLowerInvariant(), 14);

        container.Row(row =>
        {
            // Checkbox box
            row.ConstantItem(boxSize)
                .Height(boxSize)
                .Element(c => RenderCheckboxBox(c, config, boxSize));

            // Spacing between checkbox and label
            row.ConstantItem(config.Spacing);

            // Label - using RelativeItem allows text to take remaining space
            row.RelativeItem()
                .AlignMiddle()
                .Text(text =>
                {
                    text.Span(config.Label)
                        .FontSize(config.LabelFontSize)
                        .FontColor(config.LabelColor)
                        .ApplyFontWeight(config.LabelFontWeight);
                });
        });
    }

    /// <summary>
    /// Render the checkbox box (square with optional checkmark).
    /// </summary>
    private static void RenderCheckboxBox(
        IContainer container,
        CheckboxConfig config,
        float boxSize
    )
    {
        // Determine colors based on checked state
        var backgroundColor = config.IsChecked
            ? config.CheckedColor
            : config.UncheckedBackgroundColor;
        var borderColor = config.IsChecked ? config.CheckedColor : config.BorderColor;

        // Build the box with proper method chaining
        // Note: CornerRadius must come before Border in QuestPDF
        IContainer box = container;

        if (config.BorderRadius > 0)
        {
            box = box.CornerRadius(config.BorderRadius);
        }

        box = box.Border(config.BorderWidth).BorderColor(borderColor).Background(backgroundColor);

        // Render checkmark SVG only when checked
        if (config.IsChecked)
        {
            box.Svg(GenerateCheckmarkSvg(config.CheckmarkStyle, config.CheckmarkColor, boxSize));
        }
    }

    /// <summary>
    /// Generate SVG content for the checkmark based on style.
    /// </summary>
    private static string GenerateCheckmarkSvg(string style, string color, float size)
    {
        // Calculate padding for the checkmark (20% on each side)
        var padding = size * 0.2f;
        var innerSize = size - (padding * 2);

        return style.ToLowerInvariant() switch
        {
            "cross" => $@"<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 {size} {size}"">
                        <line x1=""{padding}"" y1=""{padding}"" x2=""{size - padding}"" y2=""{size - padding}"" 
                              stroke=""{color}"" stroke-width=""{Math.Max(1.5f, size * 0.12f)}"" stroke-linecap=""round""/>
                        <line x1=""{size - padding}"" y1=""{padding}"" x2=""{padding}"" y2=""{size - padding}"" 
                              stroke=""{color}"" stroke-width=""{Math.Max(1.5f, size * 0.12f)}"" stroke-linecap=""round""/>
                      </svg>",

            "circle" => $@"<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 {size} {size}"">
                        <circle cx=""{size / 2}"" cy=""{size / 2}"" r=""{innerSize * 0.35f}"" 
                                fill=""{color}""/>
                      </svg>",

            // Default: checkmark
            _ => $@"<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 {size} {size}"">
                        <polyline points=""{padding},{size * 0.5f} {size * 0.4f},{size - padding} {size - padding},{padding}"" 
                                  fill=""none"" stroke=""{color}"" stroke-width=""{Math.Max(1.5f, size * 0.12f)}"" 
                                  stroke-linecap=""round"" stroke-linejoin=""round""/>
                      </svg>",
        };
    }
}
