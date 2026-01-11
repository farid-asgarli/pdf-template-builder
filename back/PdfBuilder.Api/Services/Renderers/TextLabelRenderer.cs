using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders text label components with full text styling support.
/// Based on QuestPDF Text API documentation.
///
/// Supports:
/// - Font styling: size, family, weight, italic, color, background
/// - Text alignment: left, center, right, justify, start, end
/// - Spacing: letter spacing, word spacing, line height
/// - Text decorations: underline, strikethrough, overline with styles and thickness
/// </summary>
public static class TextLabelRenderer
{
    /// <summary>
    /// Configuration record for text label styling.
    /// Groups all text-related properties for clean code organization.
    /// </summary>
    private record TextLabelConfig(
        // Content
        string Content,
        // Typography
        float FontSize,
        string FontFamily,
        string FontWeight,
        bool Italic,
        string Color,
        string? BackgroundColor,
        // Alignment
        string TextAlign,
        // Spacing
        float LetterSpacing,
        float WordSpacing,
        float LineHeight,
        // Decoration
        string Decoration,
        string DecorationStyle,
        string? DecorationColor,
        float DecorationThickness
    );

    /// <summary>
    /// Render a text label component.
    /// </summary>
    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var config = ExtractConfig(properties);
        RenderTextLabel(container, config);
    }

    /// <summary>
    /// Render a text label component with variable substitution.
    /// Supports variables: {{pageNumber}}, {{totalPages}}, {{date}}, {{year}}, and custom variables.
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables
    )
    {
        RenderWithVariables(container, properties, pageNumber, totalPages, variables, null);
    }

    /// <summary>
    /// Render a text label component with full variable substitution support.
    /// Supports: conditionals, loops, inline formatting.
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        var config = ExtractConfig(properties);

        // Substitute variables in content using the full template engine
        var content = TextHelpers.SubstituteVariables(
            config.Content,
            pageNumber,
            totalPages,
            variables,
            complexVariables
        );

        // Create new config with substituted content
        var configWithVars = config with
        {
            Content = content,
        };
        RenderTextLabel(container, configWithVars);
    }

    /// <summary>
    /// Extract all text label configuration from properties dictionary.
    /// </summary>
    private static TextLabelConfig ExtractConfig(Dictionary<string, JsonElement> properties)
    {
        return new TextLabelConfig(
            // Content
            Content: PropertyHelpers.GetString(properties, "content", "Text Label"),
            // Typography
            FontSize: PropertyHelpers.GetFloat(properties, "fontSize", 12),
            FontFamily: PropertyHelpers.GetString(properties, "fontFamily", "Inter"),
            FontWeight: PropertyHelpers.GetString(properties, "fontWeight", "normal"),
            Italic: PropertyHelpers.GetBool(properties, "italic", false),
            Color: PropertyHelpers.GetString(properties, "color", "#000000"),
            BackgroundColor: PropertyHelpers.GetString(properties, "backgroundColor", null!),
            // Alignment
            TextAlign: PropertyHelpers.GetString(properties, "textAlign", "left"),
            // Spacing
            LetterSpacing: PropertyHelpers.GetFloat(properties, "letterSpacing", 0),
            WordSpacing: PropertyHelpers.GetFloat(properties, "wordSpacing", 0),
            LineHeight: PropertyHelpers.GetFloat(properties, "lineHeight", 1),
            // Decoration
            Decoration: PropertyHelpers.GetString(properties, "decoration", "none"),
            DecorationStyle: PropertyHelpers.GetString(properties, "decorationStyle", "solid"),
            DecorationColor: PropertyHelpers.GetString(properties, "decorationColor", null!),
            DecorationThickness: PropertyHelpers.GetFloat(properties, "decorationThickness", 1)
        );
    }

    /// <summary>
    /// Render the text label with all configured styling using QuestPDF Text API.
    /// </summary>
    private static void RenderTextLabel(IContainer container, TextLabelConfig config)
    {
        container.Text(text =>
        {
            // Apply text alignment (paragraph-level setting)
            TextHelpers.ApplyTextAlignment(text, config.TextAlign);

            // Create and style the text span
            text.Span(config.Content)
                .FontSize(config.FontSize)
                .ApplyFontFamily(config.FontFamily)
                .ApplyFontColor(config.Color)
                .ApplyFontWeight(config.FontWeight)
                .ApplyItalic(config.Italic)
                .ApplyLetterSpacing(config.LetterSpacing)
                .ApplyWordSpacing(config.WordSpacing)
                .ApplyLineHeight(config.LineHeight)
                .ApplyBackgroundColor(config.BackgroundColor)
                .ApplyDecoration(
                    config.Decoration,
                    config.DecorationStyle,
                    config.DecorationColor,
                    config.DecorationThickness
                );
        });
    }
}
