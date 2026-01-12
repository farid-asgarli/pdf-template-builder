using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using static PdfBuilder.Api.Services.DocxImport.DocxConversionConstants;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing paragraph parsing and text styling methods.
/// </summary>
public partial class DocxImportService
{
    #region Paragraph Parsing

    /// <summary>
    /// Parses a Word paragraph element into a structured format.
    /// </summary>
    /// <param name="paragraph">The Word paragraph to parse</param>
    /// <param name="mainPart">The main document part for resolving relationships</param>
    /// <returns>Parsed paragraph or null if the paragraph is empty</returns>
    private ParsedDocxParagraph? ParseParagraph(Paragraph paragraph, MainDocumentPart mainPart)
    {
        var runs = paragraph.Elements<Run>().ToList();
        var text = GetParagraphText(paragraph);

        // Skip empty paragraphs that have no meaningful content
        if (string.IsNullOrWhiteSpace(text) && runs.Count == 0)
        {
            return null;
        }

        var parsed = new ParsedDocxParagraph
        {
            ElementType = "paragraph",
            Text = text,
            Style = GetParagraphTextStyle(paragraph),
            ParagraphStyle = GetParagraphStyleProperties(paragraph),
        };

        // Process list items
        ProcessListInfo(paragraph, parsed);

        // Process heading styles
        ProcessHeadingStyle(paragraph, parsed);

        // Parse individual runs for mixed formatting, including hyperlinks
        ParseParagraphRuns(paragraph, mainPart, parsed);

        return parsed;
    }

    /// <summary>
    /// Checks and sets list item information on the parsed paragraph.
    /// </summary>
    private void ProcessListInfo(Paragraph paragraph, ParsedDocxParagraph parsed)
    {
        var listInfo = GetListInfo(paragraph);
        if (listInfo != null)
        {
            parsed.IsListItem = true;
            parsed.ListInfo = listInfo;
        }
    }

    /// <summary>
    /// Checks and sets heading style information on the parsed paragraph.
    /// </summary>
    private static void ProcessHeadingStyle(Paragraph paragraph, ParsedDocxParagraph parsed)
    {
        var styleId = paragraph.ParagraphProperties?.ParagraphStyleId?.Val?.Value;
        if (string.IsNullOrEmpty(styleId))
            return;

        if (styleId.StartsWith("Heading", StringComparison.OrdinalIgnoreCase))
        {
            parsed.IsHeading = true;
            var levelStr = styleId.Replace("Heading", "", StringComparison.OrdinalIgnoreCase);
            if (int.TryParse(levelStr, out var level))
            {
                parsed.HeadingLevel = level;
                parsed.Style.FontSize = GetHeadingFontSize(level);
                parsed.Style.IsBold = true;
            }
        }
        else if (styleId.Equals("Title", StringComparison.OrdinalIgnoreCase))
        {
            parsed.IsHeading = true;
            parsed.HeadingLevel = 0;
            parsed.Style.FontSize = GetHeadingFontSize(0);
            parsed.Style.IsBold = true;
        }
    }

    /// <summary>
    /// Parses individual runs within a paragraph, handling text formatting and hyperlinks.
    /// </summary>
    private void ParseParagraphRuns(
        Paragraph paragraph,
        MainDocumentPart mainPart,
        ParsedDocxParagraph parsed
    )
    {
        var hyperlinkMap = mainPart.HyperlinkRelationships.ToDictionary(
            h => h.Id,
            h => h.Uri.ToString()
        );

        foreach (var child in paragraph.ChildElements)
        {
            switch (child)
            {
                case Run run:
                    ParseTextRun(run, parsed);
                    break;
                case Hyperlink hyperlink:
                    ParseHyperlinkRun(hyperlink, hyperlinkMap, parsed);
                    break;
            }
        }
    }

    /// <summary>
    /// Parses a regular text run.
    /// </summary>
    private void ParseTextRun(Run run, ParsedDocxParagraph parsed)
    {
        var runText = run.InnerText;
        if (string.IsNullOrEmpty(runText))
            return;

        parsed.Runs.Add(
            new ParsedDocxTextRun { Text = runText, Style = GetRunStyle(run, parsed.Style) }
        );
    }

    /// <summary>
    /// Parses a hyperlink run with proper styling.
    /// </summary>
    private void ParseHyperlinkRun(
        Hyperlink hyperlink,
        Dictionary<string, string> hyperlinkMap,
        ParsedDocxParagraph parsed
    )
    {
        var hyperlinkRuns = hyperlink.Elements<Run>().ToList();
        var hyperlinkText = string.Join("", hyperlinkRuns.Select(r => r.InnerText));

        if (string.IsNullOrEmpty(hyperlinkText))
            return;

        // Resolve the hyperlink URL
        string? url = null;
        if (
            hyperlink.Id?.Value != null
            && hyperlinkMap.TryGetValue(hyperlink.Id.Value, out var linkUrl)
        )
        {
            url = linkUrl;
        }

        // Get style from first run or use parent style
        var firstRun = hyperlinkRuns.FirstOrDefault();
        var style =
            firstRun != null ? GetRunStyle(firstRun, parsed.Style) : CloneTextStyle(parsed.Style);

        // Apply default hyperlink styling
        ApplyHyperlinkStyle(style);

        parsed.Runs.Add(
            new ParsedDocxTextRun
            {
                Text = hyperlinkText,
                Style = style,
                HyperlinkUrl = url,
            }
        );
    }

    /// <summary>
    /// Applies default hyperlink styling (underline and blue color).
    /// </summary>
    private static void ApplyHyperlinkStyle(DocxTextStyle style)
    {
        if (!style.IsUnderline)
            style.IsUnderline = true;

        if (style.Color == DefaultBlack)
            style.Color = HyperlinkBlue;
    }

    /// <summary>
    /// Creates a shallow clone of a text style for modification.
    /// </summary>
    private static DocxTextStyle CloneTextStyle(DocxTextStyle source)
    {
        return new DocxTextStyle
        {
            FontFamily = source.FontFamily,
            FontSize = source.FontSize,
            IsBold = source.IsBold,
            IsItalic = source.IsItalic,
            IsUnderline = source.IsUnderline,
            IsStrikethrough = source.IsStrikethrough,
            IsDoubleStrikethrough = source.IsDoubleStrikethrough,
            Color = source.Color,
            BackgroundColor = source.BackgroundColor,
            TextAlign = source.TextAlign,
            UnderlineStyle = source.UnderlineStyle,
            DecorationColor = source.DecorationColor,
            VerticalAlign = source.VerticalAlign,
            LetterSpacing = source.LetterSpacing,
            FontScale = source.FontScale,
            IsAllCaps = source.IsAllCaps,
            IsSmallCaps = source.IsSmallCaps,
            IsHidden = source.IsHidden,
            IsOutline = source.IsOutline,
            HasShadow = source.HasShadow,
            IsEmbossed = source.IsEmbossed,
            IsImprinted = source.IsImprinted,
        };
    }

    /// <summary>
    /// Extracts plain text from a paragraph, including hyperlink text.
    /// </summary>
    private static string GetParagraphText(Paragraph paragraph)
    {
        var sb = new StringBuilder();

        foreach (var child in paragraph.ChildElements)
        {
            switch (child)
            {
                case Run run:
                    AppendRunText(run, sb);
                    break;
                case Hyperlink hyperlink:
                    AppendHyperlinkText(hyperlink, sb);
                    break;
            }
        }

        return sb.ToString();
    }

    /// <summary>
    /// Appends text from a run element, handling tabs and breaks.
    /// </summary>
    private static void AppendRunText(Run run, StringBuilder sb)
    {
        foreach (var text in run.Elements<Text>())
        {
            sb.Append(text.Text);
        }

        if (run.Elements<TabChar>().Any())
            sb.Append('\t');

        if (run.Elements<Break>().Any())
            sb.Append('\n');
    }

    /// <summary>
    /// Appends text from a hyperlink element.
    /// </summary>
    private static void AppendHyperlinkText(Hyperlink hyperlink, StringBuilder sb)
    {
        foreach (var hyperlinkRun in hyperlink.Elements<Run>())
        {
            foreach (var text in hyperlinkRun.Elements<Text>())
            {
                sb.Append(text.Text);
            }
        }
    }

    #endregion

    #region Paragraph Style Properties

    /// <summary>
    /// Extracts paragraph-level style properties (spacing, indentation, borders, etc.)
    /// </summary>
    private static DocxParagraphStyle GetParagraphStyleProperties(Paragraph paragraph)
    {
        var style = new DocxParagraphStyle();
        var props = paragraph.ParagraphProperties;

        if (props == null)
            return style;

        // Parse each category of properties
        ParseSpacingProperties(props, style);
        ParseIndentationProperties(props, style);
        ParseKeepProperties(props, style);
        ParseMiscProperties(props, style);

        return style;
    }

    /// <summary>
    /// Parses spacing-related properties (before, after, line spacing).
    /// </summary>
    private static void ParseSpacingProperties(ParagraphProperties props, DocxParagraphStyle style)
    {
        var spacing = props.SpacingBetweenLines;
        if (spacing == null)
            return;

        // Space before (in twentieths of a point)
        if (
            spacing.Before?.Value != null
            && int.TryParse(spacing.Before.Value, out var beforeTwips)
        )
        {
            style.SpaceBefore = beforeTwips / TwentiethsPerPoint;
        }

        // Space after
        if (spacing.After?.Value != null && int.TryParse(spacing.After.Value, out var afterTwips))
        {
            style.SpaceAfter = afterTwips / TwentiethsPerPoint;
        }

        // Line spacing
        ParseLineSpacing(spacing, style);
    }

    /// <summary>
    /// Parses line spacing with proper rule handling.
    /// </summary>
    private static void ParseLineSpacing(SpacingBetweenLines spacing, DocxParagraphStyle style)
    {
        if (spacing.Line?.Value == null || !int.TryParse(spacing.Line.Value, out var lineValue))
            return;

        var lineRule = spacing.LineRule?.Value;

        if (lineRule == LineSpacingRuleValues.Auto)
        {
            // Line value is in 240ths of a line (240 = single space)
            style.LineSpacing = lineValue / LineSpacingUnits;
            style.LineSpacingRule = "auto";
        }
        else if (lineRule == LineSpacingRuleValues.Exact)
        {
            // Exact: value in twentieths of a point
            style.LineSpacing = lineValue / TwentiethsPerPoint;
            style.LineSpacingRule = "exact";
        }
        else if (lineRule == LineSpacingRuleValues.AtLeast)
        {
            style.LineSpacing = lineValue / TwentiethsPerPoint;
            style.LineSpacingRule = "atLeast";
        }
    }

    /// <summary>
    /// Parses indentation properties.
    /// </summary>
    private static void ParseIndentationProperties(
        ParagraphProperties props,
        DocxParagraphStyle style
    )
    {
        var indent = props.Indentation;
        if (indent == null)
            return;

        // Left indent (twips)
        if (indent.Left?.Value != null && int.TryParse(indent.Left.Value, out var leftTwips))
        {
            style.LeftIndent = leftTwips / TwipsPerMm;
        }

        // Right indent
        if (indent.Right?.Value != null && int.TryParse(indent.Right.Value, out var rightTwips))
        {
            style.RightIndent = rightTwips / TwipsPerMm;
        }

        // First line indent (can be negative for hanging)
        if (
            indent.FirstLine?.Value != null
            && int.TryParse(indent.FirstLine.Value, out var firstLineTwips)
        )
        {
            style.FirstLineIndent = firstLineTwips / TwipsPerMm;
        }
        else if (
            indent.Hanging?.Value != null
            && int.TryParse(indent.Hanging.Value, out var hangingTwips)
        )
        {
            style.FirstLineIndent = -hangingTwips / TwipsPerMm; // Negative for hanging
        }
    }

    /// <summary>
    /// Parses keep/pagination properties.
    /// </summary>
    private static void ParseKeepProperties(ParagraphProperties props, DocxParagraphStyle style)
    {
        style.KeepWithNext = props.KeepNext != null;
        style.KeepLinesTogether = props.KeepLines != null;
        style.PageBreakBefore = props.PageBreakBefore != null;
        style.WidowControl = props.WidowControl?.Val?.Value != false;
    }

    /// <summary>
    /// Parses miscellaneous paragraph properties.
    /// </summary>
    private static void ParseMiscProperties(ParagraphProperties props, DocxParagraphStyle style)
    {
        // Outline level for TOC
        if (props.OutlineLevel?.Val?.HasValue == true)
        {
            style.OutlineLevel = props.OutlineLevel.Val.Value;
        }

        // Tab stops
        style.TabStops = ExtractParagraphTabStops(props);

        // Text direction (RTL/LTR)
        var bidi = props.BiDi;
        if (bidi != null && (bidi.Val == null || bidi.Val.Value))
        {
            style.TextDirection = "rtl";
        }

        // Paragraph borders
        var pBdr = props.ParagraphBorders;
        if (pBdr != null)
        {
            style.Border = ParseParagraphBorders(pBdr);
        }

        // Paragraph shading
        var shading = props.Shading;
        if (shading != null)
        {
            style.Shading = ParseParagraphShading(shading);
        }

        // Drop cap
        var framePr = props.FrameProperties;
        if (framePr?.DropCap?.Value != null)
        {
            style.DropCap = ParseDropCap(framePr);
        }
    }

    /// <summary>
    /// Parses paragraph shading properties.
    /// </summary>
    private static DocxParagraphShading ParseParagraphShading(Shading shading)
    {
        return new DocxParagraphShading
        {
            Fill = shading.Fill?.Value != "auto" ? FormatColor(shading.Fill?.Value) : null,
            PatternColor =
                shading.Color?.Value != "auto" ? FormatColor(shading.Color?.Value) : null,
            Pattern = shading.Val?.Value.ToString() ?? "clear",
        };
    }

    /// <summary>
    /// Parses drop cap frame properties.
    /// </summary>
    private static DocxDropCap ParseDropCap(FrameProperties framePr)
    {
        var distance = 0.0;
        if (
            framePr.HorizontalSpace?.Value != null
            && int.TryParse(framePr.HorizontalSpace.Value, out var hSpaceTwips)
        )
        {
            distance = hSpaceTwips / TwipsPerMm;
        }

        return new DocxDropCap
        {
            Type = framePr.DropCap?.Value == DropCapLocationValues.Margin ? "margin" : "drop",
            Lines = framePr.Lines?.Value ?? 3,
            Distance = distance,
        };
    }

    #endregion

    #region Border Parsing

    /// <summary>
    /// Parses all paragraph borders.
    /// </summary>
    private static DocxParagraphBorder ParseParagraphBorders(ParagraphBorders pBdr)
    {
        var border = new DocxParagraphBorder();

        ParseBorderSide(pBdr.TopBorder, b => border.Top = b, s => border.OffsetTop = s);
        ParseBorderSide(pBdr.BottomBorder, b => border.Bottom = b, s => border.OffsetBottom = s);
        ParseBorderSide(pBdr.LeftBorder, b => border.Left = b, s => border.OffsetLeft = s);
        ParseBorderSide(pBdr.RightBorder, b => border.Right = b, s => border.OffsetRight = s);

        if (pBdr.BetweenBorder != null)
        {
            border.Between = ParseSingleBorder(pBdr.BetweenBorder);
        }

        return border;
    }

    /// <summary>
    /// Parses a single border side with offset.
    /// </summary>
    private static void ParseBorderSide(
        BorderType? borderType,
        Action<DocxBorder?> setBorder,
        Action<double> setOffset
    )
    {
        if (borderType == null)
            return;

        setBorder(ParseSingleBorder(borderType));

        if (borderType.Space?.HasValue == true)
        {
            setOffset(borderType.Space.Value);
        }
    }

    /// <summary>
    /// Parses a single border definition.
    /// </summary>
    private static DocxBorder? ParseSingleBorder(BorderType borderType)
    {
        var borderValue = borderType.Val?.Value;
        if (borderValue == BorderValues.Nil || borderValue == BorderValues.None)
            return null;

        var border = new DocxBorder
        {
            Color = FormatColor(borderType.Color?.Value) ?? DefaultBlack,
            Width =
                borderType.Size?.HasValue == true
                    ? borderType.Size.Value / EighthsPerPoint
                    : DefaultBorderWidthPt,
            Style = MapBorderStyle(borderValue),
        };

        // Thick border style should increase width
        if (borderValue == BorderValues.Thick)
        {
            border.Width = Math.Max(border.Width, 2);
        }

        return border;
    }

    /// <summary>
    /// Maps Word border style to a simplified style string.
    /// </summary>
    private static string MapBorderStyle(BorderValues? val)
    {
        if (val == BorderValues.Double)
            return "double";
        if (val == BorderValues.Dashed || val == BorderValues.DashSmallGap)
            return "dashed";
        if (val == BorderValues.Dotted)
            return "dotted";
        return "single";
    }

    #endregion

    #region Color Formatting

    /// <summary>
    /// Formats a color value to a proper hex color string.
    /// </summary>
    private static string? FormatColor(string? color)
    {
        if (string.IsNullOrEmpty(color) || color == "auto")
            return null;

        color = color.Trim();

        // Already has # prefix
        if (color.StartsWith('#'))
            return color;

        // Check if it's a valid hex color (6 characters)
        if (color.Length == 6 && IsValidHexColor(color))
        {
            return $"#{color}";
        }

        // Map named colors
        return MapNamedColor(color);
    }

    /// <summary>
    /// Checks if a string is a valid 6-character hex color.
    /// </summary>
    private static bool IsValidHexColor(string color)
    {
        return color.All(c => char.IsDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'));
    }

    /// <summary>
    /// Maps named colors to hex values.
    /// </summary>
    private static string MapNamedColor(string color)
    {
        return color.ToLowerInvariant() switch
        {
            "black" => DefaultBlack,
            "white" => DefaultWhite,
            "red" => "#FF0000",
            "green" => "#00FF00",
            "blue" => "#0000FF",
            "yellow" => "#FFFF00",
            "cyan" => "#00FFFF",
            "magenta" => "#FF00FF",
            "gray" or "grey" => "#808080",
            "darkgray" or "darkgrey" => "#A9A9A9",
            "lightgray" or "lightgrey" => "#D3D3D3",
            "silver" => "#C0C0C0",
            "maroon" => "#800000",
            "olive" => "#808000",
            "navy" => "#000080",
            "purple" => "#800080",
            "teal" => "#008080",
            "orange" => "#FFA500",
            "brown" => "#A52A2A",
            "pink" => "#FFC0CB",
            _ => $"#{color}", // Try as hex anyway
        };
    }

    #endregion

    #region Text Style Parsing

    /// <summary>
    /// Gets the text style for a paragraph (from paragraph properties and first run).
    /// </summary>
    private DocxTextStyle GetParagraphTextStyle(Paragraph paragraph)
    {
        var style = new DocxTextStyle();
        var props = paragraph.ParagraphProperties;

        if (props != null)
        {
            // Text alignment
            var justification = props.Justification?.Val?.Value;
            if (justification.HasValue)
            {
                style.TextAlign = MapJustification(justification.Value);
            }
        }

        // Get run properties from first run as default
        var firstRun = paragraph.Elements<Run>().FirstOrDefault();
        if (firstRun != null)
        {
            var runStyle = GetRunStyle(firstRun, style);
            CopyRunStyleToParagraphStyle(runStyle, style);
        }

        return style;
    }

    /// <summary>
    /// Maps justification value to alignment string.
    /// </summary>
    private static string MapJustification(JustificationValues justification)
    {
        if (justification == JustificationValues.Center)
            return "center";
        if (justification == JustificationValues.Right)
            return "right";
        if (justification == JustificationValues.Both)
            return "justify";
        return "left";
    }

    /// <summary>
    /// Copies text style properties from run style to paragraph style.
    /// </summary>
    private static void CopyRunStyleToParagraphStyle(
        DocxTextStyle runStyle,
        DocxTextStyle paragraphStyle
    )
    {
        paragraphStyle.FontFamily = runStyle.FontFamily;
        paragraphStyle.FontSize = runStyle.FontSize;
        paragraphStyle.IsBold = runStyle.IsBold;
        paragraphStyle.IsItalic = runStyle.IsItalic;
        paragraphStyle.IsUnderline = runStyle.IsUnderline;
        paragraphStyle.IsStrikethrough = runStyle.IsStrikethrough;
        paragraphStyle.Color = runStyle.Color;
        paragraphStyle.LetterSpacing = runStyle.LetterSpacing;
        paragraphStyle.VerticalAlign = runStyle.VerticalAlign;
    }

    /// <summary>
    /// Gets the text style for a run, inheriting from parent style.
    /// </summary>
    private DocxTextStyle GetRunStyle(Run run, DocxTextStyle parentStyle)
    {
        var style = CloneTextStyle(parentStyle);

        var props = run.RunProperties;
        if (props == null)
            return style;

        // Parse font properties
        ParseFontProperties(props, style);

        // Parse text formatting
        ParseTextFormatting(props, style);

        // Parse text effects
        ParseTextEffects(props, style);

        // Parse colors
        ParseColorProperties(props, style);

        return style;
    }

    /// <summary>
    /// Parses font-related properties.
    /// </summary>
    private static void ParseFontProperties(RunProperties props, DocxTextStyle style)
    {
        // Font family
        var fonts = props.RunFonts;
        if (fonts?.Ascii?.HasValue == true && fonts.Ascii.Value != null)
        {
            style.FontFamily = MapFontFamily(fonts.Ascii.Value);
        }

        // Font size (in half-points)
        var fontSize = props.FontSize?.Val?.Value;
        if (!string.IsNullOrEmpty(fontSize) && double.TryParse(fontSize, out var sizeValue))
        {
            style.FontSize = sizeValue / HalfPointsPerPoint;
        }

        // Letter spacing (in twentieths of a point)
        var spacing = props.Spacing?.Val?.Value;
        if (spacing.HasValue)
        {
            style.LetterSpacing = spacing.Value / TwentiethsPerPoint;
        }

        // Font scale (width percentage)
        var fontScaleVal = props.CharacterScale?.Val?.Value;
        if (fontScaleVal.HasValue)
        {
            style.FontScale = fontScaleVal.Value;
        }
    }

    /// <summary>
    /// Parses text formatting properties (bold, italic, underline, etc.)
    /// </summary>
    private static void ParseTextFormatting(RunProperties props, DocxTextStyle style)
    {
        // Bold
        style.IsBold = IsBoolPropertySet(props.Bold);

        // Italic
        style.IsItalic = IsBoolPropertySet(props.Italic);

        // Underline with style
        var underline = props.Underline;
        if (underline != null && underline.Val?.Value != UnderlineValues.None)
        {
            style.IsUnderline = true;
            style.UnderlineStyle = MapUnderlineStyle(underline.Val?.Value);

            // Underline color
            if (underline.Color?.Value != null && underline.Color.Value != "auto")
            {
                var uColor = underline.Color.Value;
                style.DecorationColor = uColor.StartsWith('#') ? uColor : $"#{uColor}";
            }
        }

        // Strikethrough
        style.IsStrikethrough = IsBoolPropertySet(props.Strike);
        style.IsDoubleStrikethrough = IsBoolPropertySet(props.DoubleStrike);

        // Vertical alignment (superscript/subscript)
        var vertAlign = props.VerticalTextAlignment?.Val?.Value;
        if (vertAlign.HasValue)
        {
            if (vertAlign.Value == VerticalPositionValues.Superscript)
                style.VerticalAlign = "superscript";
            else if (vertAlign.Value == VerticalPositionValues.Subscript)
                style.VerticalAlign = "subscript";
            else
                style.VerticalAlign = "baseline";
        }
    }

    /// <summary>
    /// Parses text effect properties.
    /// </summary>
    private static void ParseTextEffects(RunProperties props, DocxTextStyle style)
    {
        style.IsAllCaps = IsBoolPropertySet(props.Caps);
        style.IsSmallCaps = IsBoolPropertySet(props.SmallCaps);
        style.IsHidden = IsBoolPropertySet(props.Vanish);
        style.IsOutline = IsBoolPropertySet(props.Outline);
        style.HasShadow = IsBoolPropertySet(props.Shadow);
        style.IsEmbossed = IsBoolPropertySet(props.Emboss);
        style.IsImprinted = IsBoolPropertySet(props.Imprint);
    }

    /// <summary>
    /// Parses color-related properties.
    /// </summary>
    private static void ParseColorProperties(RunProperties props, DocxTextStyle style)
    {
        // Text color
        var color = props.Color?.Val?.Value;
        if (!string.IsNullOrEmpty(color) && color != "auto")
        {
            style.Color = color.StartsWith('#') ? color : $"#{color}";
        }

        // Highlight/Background color
        var highlight = props.Highlight?.Val?.Value;
        if (highlight.HasValue && highlight.Value != HighlightColorValues.None)
        {
            style.BackgroundColor = MapHighlightColor(highlight.Value);
        }

        // Shading (alternative to highlight)
        var shading = props.Shading;
        if (shading?.Fill?.Value != null && shading.Fill.Value != "auto")
        {
            style.BackgroundColor = shading.Fill.Value.StartsWith('#')
                ? shading.Fill.Value
                : $"#{shading.Fill.Value}";
        }
    }

    /// <summary>
    /// Helper to check if a boolean property element is set to true.
    /// In OOXML, presence without Val means true, Val=false means false.
    /// </summary>
    private static bool IsBoolPropertySet(OnOffType? property)
    {
        return property != null && (property.Val == null || property.Val.Value);
    }

    #endregion

    #region Style Mapping Helpers

    /// <summary>
    /// Maps Word underline style to a simplified style string.
    /// </summary>
    private static string MapUnderlineStyle(UnderlineValues? value)
    {
        if (!value.HasValue)
            return "single";

        var v = value.Value;

        if (v == UnderlineValues.Single)
            return "single";
        if (v == UnderlineValues.Double)
            return "double";
        if (v == UnderlineValues.Thick)
            return "thick";
        if (v == UnderlineValues.Dotted || v == UnderlineValues.DottedHeavy)
            return "dotted";
        if (
            v == UnderlineValues.Dash
            || v == UnderlineValues.DashedHeavy
            || v == UnderlineValues.DashLong
            || v == UnderlineValues.DashLongHeavy
            || v == UnderlineValues.DotDash
            || v == UnderlineValues.DashDotHeavy
            || v == UnderlineValues.DotDotDash
            || v == UnderlineValues.DashDotDotHeavy
        )
            return "dashed";
        if (
            v == UnderlineValues.Wave
            || v == UnderlineValues.WavyHeavy
            || v == UnderlineValues.WavyDouble
        )
            return "wavy";
        if (v == UnderlineValues.Words)
            return "single";

        return "single";
    }

    #endregion
}
