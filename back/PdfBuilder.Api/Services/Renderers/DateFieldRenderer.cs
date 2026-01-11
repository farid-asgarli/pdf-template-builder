using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders date field components with full styling support.
/// Supports label styling, input box customization, borders, colors, and optional calendar icon.
/// </summary>
public static class DateFieldRenderer
{
    /// <summary>
    /// Configuration record for date field styling.
    /// </summary>
    private record DateFieldConfig(
        // Field identification
        string Label,
        string FieldName,
        string Format,
        bool Required,
        // Label styling
        float LabelFontSize,
        string LabelColor,
        string LabelFontWeight,
        // Input styling
        float FontSize,
        float InputHeight,
        float InputPadding,
        // Border styling
        float BorderWidth,
        string BorderColor,
        float BorderRadius,
        // Colors
        string? BackgroundColor,
        string PlaceholderColor,
        // Icon
        bool ShowIcon,
        string IconColor
    );

    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var config = ExtractDateFieldConfig(properties);
        RenderDateField(container, config);
    }

    /// <summary>
    /// Extract all date field configuration from properties dictionary.
    /// </summary>
    private static DateFieldConfig ExtractDateFieldConfig(
        Dictionary<string, JsonElement> properties
    )
    {
        return new DateFieldConfig(
            Label: PropertyHelpers.GetString(properties, "label", "Date"),
            FieldName: PropertyHelpers.GetString(properties, "fieldName", "date_field"),
            Format: PropertyHelpers.GetString(properties, "format", "MM/DD/YYYY"),
            Required: PropertyHelpers.GetBool(properties, "required", false),
            LabelFontSize: PropertyHelpers.GetFloat(properties, "labelFontSize", 10),
            LabelColor: PropertyHelpers.GetString(properties, "labelColor", "#666666"),
            LabelFontWeight: PropertyHelpers.GetString(properties, "labelFontWeight", "normal"),
            FontSize: PropertyHelpers.GetFloat(properties, "fontSize", 12),
            InputHeight: PropertyHelpers.GetFloat(properties, "inputHeight", 8),
            InputPadding: PropertyHelpers.GetFloat(properties, "inputPadding", 4),
            BorderWidth: PropertyHelpers.GetFloat(properties, "borderWidth", 1),
            BorderColor: PropertyHelpers.GetString(properties, "borderColor", "#000000"),
            BorderRadius: PropertyHelpers.GetFloat(properties, "borderRadius", 0),
            BackgroundColor: PropertyHelpers.GetString(properties, "backgroundColor", null!),
            PlaceholderColor: PropertyHelpers.GetString(properties, "placeholderColor", "#999999"),
            ShowIcon: PropertyHelpers.GetBool(properties, "showIcon", true),
            IconColor: PropertyHelpers.GetString(properties, "iconColor", "#666666")
        );
    }

    /// <summary>
    /// Render the date field with the given configuration.
    /// </summary>
    private static void RenderDateField(IContainer container, DateFieldConfig config)
    {
        container.Column(column =>
        {
            column.Spacing(2);

            // Label row with optional required indicator
            column
                .Item()
                .Row(labelRow =>
                {
                    labelRow
                        .AutoItem()
                        .Text(text =>
                        {
                            text.Span(config.Label)
                                .FontSize(config.LabelFontSize)
                                .FontColor(config.LabelColor)
                                .ApplyFontWeight(config.LabelFontWeight);
                        });

                    if (config.Required)
                    {
                        labelRow
                            .AutoItem()
                            .PaddingLeft(2)
                            .Text(text =>
                            {
                                text.Span("*")
                                    .FontSize(config.LabelFontSize)
                                    .FontColor(Colors.Red.Medium);
                            });
                    }
                });

            // Input box with format placeholder and optional icon
            column
                .Item()
                .Element(inputContainer =>
                {
                    var box = inputContainer;

                    // Apply corner radius if specified (must come before border in QuestPDF)
                    if (config.BorderRadius > 0)
                    {
                        box = box.CornerRadius(config.BorderRadius);
                    }

                    // Apply border if width is greater than 0
                    if (config.BorderWidth > 0)
                    {
                        box = box.Border(config.BorderWidth).BorderColor(config.BorderColor);
                    }

                    // Apply background color if specified
                    if (!string.IsNullOrEmpty(config.BackgroundColor))
                    {
                        box = box.Background(config.BackgroundColor);
                    }

                    // Apply height and padding
                    box = box.MinHeight(config.InputHeight, Unit.Millimetre)
                        .Padding(config.InputPadding);

                    // Render input content with format placeholder and optional calendar icon
                    box.Row(row =>
                    {
                        // Date format placeholder text
                        row.RelativeItem()
                            .AlignMiddle()
                            .Text(text =>
                            {
                                text.Span(config.Format)
                                    .FontSize(config.FontSize)
                                    .FontColor(config.PlaceholderColor);
                            });

                        // Calendar icon (if enabled)
                        if (config.ShowIcon)
                        {
                            row.ConstantItem(config.FontSize + 2)
                                .AlignMiddle()
                                .AlignRight()
                                .Svg(GenerateCalendarIconSvg(config.IconColor, config.FontSize));
                        }
                    });
                });
        });
    }

    /// <summary>
    /// Generate SVG content for the calendar icon.
    /// </summary>
    private static string GenerateCalendarIconSvg(string color, float size)
    {
        // Calendar icon SVG - simple and clean design
        return $@"<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 24 24"" width=""{size}"" height=""{size}"" fill=""none"" stroke=""{color}"" stroke-width=""1.5"" stroke-linecap=""round"" stroke-linejoin=""round"">
            <rect x=""3"" y=""4"" width=""18"" height=""18"" rx=""2"" ry=""2""/>
            <line x1=""16"" y1=""2"" x2=""16"" y2=""6""/>
            <line x1=""8"" y1=""2"" x2=""8"" y2=""6""/>
            <line x1=""3"" y1=""10"" x2=""21"" y2=""10""/>
        </svg>";
    }
}
