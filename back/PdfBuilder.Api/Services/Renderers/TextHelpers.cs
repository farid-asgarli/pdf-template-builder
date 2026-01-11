using System.Text.Json;
using QuestPDF.Fluent;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Helper methods for text rendering operations.
/// Based on QuestPDF Text API documentation.
/// </summary>
public static class TextHelpers
{
    /// <summary>
    /// Apply text alignment to a TextDescriptor.
    /// Supports: left, center, right, justify, start, end
    /// Start/End are direction-aware (LTR vs RTL).
    /// </summary>
    public static void ApplyTextAlignment(TextDescriptor text, string textAlign)
    {
        switch (textAlign.ToLowerInvariant())
        {
            case "center":
                text.AlignCenter();
                break;
            case "right":
                text.AlignRight();
                break;
            case "justify":
                text.Justify();
                break;
            case "start":
                text.AlignStart();
                break;
            case "end":
                text.AlignEnd();
                break;
            case "left":
            default:
                text.AlignLeft();
                break;
        }
    }

    /// <summary>
    /// Simple variable substitution for basic use cases.
    /// For advanced templating (conditionals, loops), use TemplateEngine.Process().
    /// </summary>
    public static string SubstituteVariables(
        string text,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables
    )
    {
        return SubstituteVariables(text, pageNumber, totalPages, variables, null);
    }

    /// <summary>
    /// Full variable substitution with support for complex variables (arrays, objects).
    /// Supports: conditionals, loops, inline formatting.
    /// </summary>
    public static string SubstituteVariables(
        string text,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        return TemplateEngine.Process(text, pageNumber, totalPages, variables, complexVariables);
    }

    /// <summary>
    /// Apply font weight to a text span descriptor.
    /// Supports full range of QuestPDF font weights (100-1000).
    /// </summary>
    public static TextSpanDescriptor ApplyFontWeight(
        this TextSpanDescriptor text,
        string fontWeight
    )
    {
        return fontWeight.ToLowerInvariant() switch
        {
            "thin" => text.Thin(),
            "extralight" => text.ExtraLight(),
            "light" => text.Light(),
            "medium" => text.Medium(),
            "semibold" => text.SemiBold(),
            "bold" => text.Bold(),
            "extrabold" => text.ExtraBold(),
            "black" => text.Black(),
            "normal" or _ => text.NormalWeight(),
        };
    }

    /// <summary>
    /// Apply italic style to a text span descriptor if enabled.
    /// </summary>
    public static TextSpanDescriptor ApplyItalic(this TextSpanDescriptor text, bool italic)
    {
        return italic ? text.Italic() : text;
    }

    /// <summary>
    /// Apply text decoration (underline, strikethrough, overline) with style, color and thickness.
    /// Based on QuestPDF Text Decoration API:
    /// - Positions: Underline, Strikethrough, Overline
    /// - Styles: DecorationSolid, DecorationDouble, DecorationWavy, DecorationDotted, DecorationDashed
    /// - DecorationColor: Custom color for the decoration line
    /// - DecorationThickness: Custom thickness for the decoration line
    /// </summary>
    public static TextSpanDescriptor ApplyDecoration(
        this TextSpanDescriptor text,
        string decoration,
        string decorationStyle,
        string? decorationColor = null,
        float decorationThickness = 1f
    )
    {
        if (string.IsNullOrEmpty(decoration) || decoration.ToLowerInvariant() == "none")
            return text;

        // Apply decoration position
        text = decoration.ToLowerInvariant() switch
        {
            "underline" => text.Underline(),
            "strikethrough" => text.Strikethrough(),
            "overline" => text.Overline(),
            _ => text,
        };

        // Apply decoration style
        text = decorationStyle.ToLowerInvariant() switch
        {
            "double" => text.DecorationDouble(),
            "wavy" => text.DecorationWavy(),
            "dotted" => text.DecorationDotted(),
            "dashed" => text.DecorationDashed(),
            "solid" or _ => text.DecorationSolid(),
        };

        // Apply decoration color if specified
        if (!string.IsNullOrEmpty(decorationColor))
        {
            text = text.DecorationColor(decorationColor);
        }

        // Apply decoration thickness if different from default
        if (Math.Abs(decorationThickness - 1f) > 0.001f)
        {
            text = text.DecorationThickness(decorationThickness);
        }

        return text;
    }

    /// <summary>
    /// Apply letter spacing to a text span descriptor.
    /// Value is proportional to font size (0 = normal, 0.1 = 10% wider).
    /// </summary>
    public static TextSpanDescriptor ApplyLetterSpacing(
        this TextSpanDescriptor text,
        float letterSpacing
    )
    {
        // Only apply if non-zero to avoid unnecessary operations
        if (Math.Abs(letterSpacing) > 0.001f)
        {
            return text.LetterSpacing(letterSpacing);
        }
        return text;
    }

    /// <summary>
    /// Apply line height to a text span descriptor.
    /// Value is a multiplier (1 = normal, 1.5 = 150% line height).
    /// </summary>
    public static TextSpanDescriptor ApplyLineHeight(this TextSpanDescriptor text, float lineHeight)
    {
        // Only apply if different from default (1.0)
        if (Math.Abs(lineHeight - 1.0f) > 0.001f)
        {
            return text.LineHeight(lineHeight);
        }
        return text;
    }

    /// <summary>
    /// Apply background color to a text span descriptor.
    /// </summary>
    public static TextSpanDescriptor ApplyBackgroundColor(
        this TextSpanDescriptor text,
        string? backgroundColor
    )
    {
        if (!string.IsNullOrEmpty(backgroundColor))
        {
            return text.BackgroundColor(backgroundColor);
        }
        return text;
    }

    /// <summary>
    /// Apply word spacing to a text span descriptor.
    /// Value is proportional to font size (0 = normal, 0.2 = 20% wider).
    /// </summary>
    public static TextSpanDescriptor ApplyWordSpacing(
        this TextSpanDescriptor text,
        float wordSpacing
    )
    {
        // Only apply if non-zero to avoid unnecessary operations
        if (Math.Abs(wordSpacing) > 0.001f)
        {
            return text.WordSpacing(wordSpacing);
        }
        return text;
    }

    /// <summary>
    /// Apply font family to a text span descriptor.
    /// </summary>
    public static TextSpanDescriptor ApplyFontFamily(
        this TextSpanDescriptor text,
        string? fontFamily
    )
    {
        if (!string.IsNullOrEmpty(fontFamily))
        {
            return text.FontFamily(fontFamily);
        }
        return text;
    }

    /// <summary>
    /// Apply font color to a text span descriptor.
    /// </summary>
    public static TextSpanDescriptor ApplyFontColor(this TextSpanDescriptor text, string? color)
    {
        if (!string.IsNullOrEmpty(color))
        {
            return text.FontColor(color);
        }
        return text;
    }
}
