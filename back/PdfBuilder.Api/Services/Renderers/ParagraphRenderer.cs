using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders paragraph components with full text styling support.
/// Based on QuestPDF Text API documentation.
///
/// Supports:
/// - Font styling: size, family, weight, italic, color, background
/// - Text alignment: left, center, right, justify
/// - Spacing: letter spacing, word spacing, line height
/// - Paragraph settings: paragraph spacing, first line indentation
/// - Line clamping with custom ellipsis
/// - Text decorations: underline, strikethrough, overline with styles
/// </summary>
public static class ParagraphRenderer
{
    /// <summary>
    /// Configuration record for paragraph styling.
    /// </summary>
    private record ParagraphConfig(
        // Content
        string Content,
        // Typography
        float FontSize,
        string FontFamily,
        string FontWeight,
        bool Italic,
        string Color,
        string? BackgroundColor,
        string TextAlign,
        // Spacing
        float LetterSpacing,
        float WordSpacing,
        float LineHeight,
        // Paragraph-specific
        float ParagraphSpacing,
        float FirstLineIndentation,
        // Line clamping
        int? ClampLines,
        string? ClampEllipsis,
        // Decoration
        string Decoration,
        string DecorationStyle,
        string? DecorationColor
    );

    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var config = ExtractConfig(properties);
        RenderParagraph(container, config);
    }

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
    /// Render a paragraph with full variable substitution support.
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
        RenderParagraph(container, configWithVars);
    }

    /// <summary>
    /// Extract all paragraph configuration from properties dictionary.
    /// </summary>
    private static ParagraphConfig ExtractConfig(Dictionary<string, JsonElement> properties)
    {
        return new ParagraphConfig(
            // Content
            Content: PropertyHelpers.GetString(properties, "content", "Paragraph text"),
            // Typography
            FontSize: PropertyHelpers.GetFloat(properties, "fontSize", 11),
            FontFamily: PropertyHelpers.GetString(properties, "fontFamily", "Inter"),
            FontWeight: PropertyHelpers.GetString(properties, "fontWeight", "normal"),
            Italic: PropertyHelpers.GetBool(properties, "italic", false),
            Color: PropertyHelpers.GetString(properties, "color", "#000000"),
            BackgroundColor: PropertyHelpers.GetString(properties, "backgroundColor", null!),
            TextAlign: PropertyHelpers.GetString(properties, "textAlign", "left"),
            // Spacing
            LetterSpacing: PropertyHelpers.GetFloat(properties, "letterSpacing", 0),
            WordSpacing: PropertyHelpers.GetFloat(properties, "wordSpacing", 0),
            LineHeight: PropertyHelpers.GetFloat(properties, "lineHeight", 1.5f),
            // Paragraph-specific
            ParagraphSpacing: PropertyHelpers.GetFloat(properties, "paragraphSpacing", 10),
            FirstLineIndentation: PropertyHelpers.GetFloat(properties, "firstLineIndentation", 0),
            // Line clamping
            ClampLines: PropertyHelpers.GetInt(properties, "clampLines", 0) > 0
                ? PropertyHelpers.GetInt(properties, "clampLines", 0)
                : null,
            ClampEllipsis: PropertyHelpers.GetString(properties, "clampEllipsis", null!),
            // Decoration
            Decoration: PropertyHelpers.GetString(properties, "decoration", "none"),
            DecorationStyle: PropertyHelpers.GetString(properties, "decorationStyle", "solid"),
            DecorationColor: PropertyHelpers.GetString(properties, "decorationColor", null!)
        );
    }

    /// <summary>
    /// Render the paragraph with all configured styling.
    /// </summary>
    private static void RenderParagraph(IContainer container, ParagraphConfig config)
    {
        container.Text(text =>
        {
            // Apply paragraph-level settings
            TextHelpers.ApplyTextAlignment(text, config.TextAlign);

            // Apply paragraph spacing (gap between paragraphs separated by line breaks)
            if (config.ParagraphSpacing > 0)
            {
                text.ParagraphSpacing(config.ParagraphSpacing);
            }

            // Apply first line indentation
            if (Math.Abs(config.FirstLineIndentation) > 0.001f)
            {
                text.ParagraphFirstLineIndentation(config.FirstLineIndentation);
            }

            // Apply line clamping if specified
            if (config.ClampLines.HasValue && config.ClampLines.Value > 0)
            {
                if (!string.IsNullOrEmpty(config.ClampEllipsis))
                {
                    text.ClampLines(config.ClampLines.Value, config.ClampEllipsis);
                }
                else
                {
                    text.ClampLines(config.ClampLines.Value);
                }
            }

            // Create the text span with all styling
            var span = text.Span(config.Content)
                .FontSize(config.FontSize)
                .ApplyFontFamily(config.FontFamily)
                .ApplyFontColor(config.Color)
                .ApplyFontWeight(config.FontWeight)
                .ApplyItalic(config.Italic)
                .ApplyLetterSpacing(config.LetterSpacing)
                .ApplyWordSpacing(config.WordSpacing)
                .ApplyLineHeight(config.LineHeight)
                .ApplyBackgroundColor(config.BackgroundColor)
                .ApplyDecoration(config.Decoration, config.DecorationStyle, config.DecorationColor);
        });
    }
}
