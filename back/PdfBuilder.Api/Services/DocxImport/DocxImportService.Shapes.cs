using DocumentFormat.OpenXml.Drawing.Wordprocessing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using A = DocumentFormat.OpenXml.Drawing;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing text box and shape extraction methods
/// </summary>
public partial class DocxImportService
{
    #region Text Box and Shape Extraction

    private void ExtractTextBoxesAndShapes(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        // Find VML text boxes (older format)
        foreach (var pict in body.Descendants<Picture>())
        {
            try
            {
                var textBox = ParseVmlTextBox(pict, mainPart);
                if (textBox != null)
                {
                    content.TextBoxes.Add(textBox);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse VML text box");
            }
        }

        // Find DrawingML text boxes and shapes (newer format)
        foreach (var drawing in body.Descendants<Drawing>())
        {
            try
            {
                // Check for text box in anchor
                var anchor = drawing.Anchor;
                if (anchor != null)
                {
                    var textBox = ParseDrawingTextBox(anchor, mainPart);
                    if (textBox != null)
                    {
                        content.TextBoxes.Add(textBox);
                    }

                    var shape = ParseDrawingShape(anchor);
                    if (shape != null)
                    {
                        content.Shapes.Add(shape);
                    }
                }

                // Check inline for shapes
                var inline = drawing.Inline;
                if (inline != null)
                {
                    var shape = ParseInlineShape(inline);
                    if (shape != null)
                    {
                        content.Shapes.Add(shape);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse drawing element for text box/shape");
            }
        }
    }

    private ParsedDocxTextBox? ParseVmlTextBox(Picture pict, MainDocumentPart mainPart)
    {
        var shape = pict.Descendants<DocumentFormat.OpenXml.Vml.Shape>().FirstOrDefault();
        if (shape == null)
            return null;

        // Look for text box element
        var textBox = shape.Descendants<DocumentFormat.OpenXml.Vml.TextBox>().FirstOrDefault();
        if (textBox == null)
            return null;

        var parsed = new ParsedDocxTextBox
        {
            ElementType = "textBox",
            Id = shape.Id?.Value ?? Guid.NewGuid().ToString(),
            Name = null, // VML shapes don't have Alt property like DrawingML
        };

        // Parse position and size from style
        var style = shape.Style?.Value;
        if (!string.IsNullOrEmpty(style))
        {
            parsed.Position = ParseVmlStyle(style);
        }

        // Parse visual style from VML
        var fillColor = ExtractVmlFillColor(shape);
        var strokeColor = ExtractVmlStrokeColor(shape);
        var strokeWidth = ExtractVmlStrokeWidth(shape);

        parsed.Style = new DocxBoxStyle
        {
            BackgroundColor = fillColor,
            BorderColor = strokeColor ?? "#000000",
            BorderWidth = strokeWidth,
        };

        // Parse text content
        var txbxContent = textBox
            .Descendants<DocumentFormat.OpenXml.Wordprocessing.TextBoxContent>()
            .FirstOrDefault();
        if (txbxContent != null)
        {
            foreach (var para in txbxContent.Elements<Paragraph>())
            {
                var parsedPara = ParseParagraph(para, mainPart);
                if (parsedPara != null)
                {
                    parsed.Content.Add(parsedPara);
                }
            }
        }

        return parsed.Content.Count > 0 ? parsed : null;
    }

    private static string? ExtractVmlFillColor(DocumentFormat.OpenXml.Vml.Shape shape)
    {
        // Try to get fill color from fill child element
        var fill = shape.Descendants<DocumentFormat.OpenXml.Vml.Fill>().FirstOrDefault();
        if (fill?.Color?.Value != null)
        {
            return NormalizeColorValue(fill.Color.Value);
        }

        // Try to get from style attribute
        var style = shape.Style?.Value;
        if (!string.IsNullOrEmpty(style))
        {
            var color = ExtractStyleValue(style, "fill");
            if (!string.IsNullOrEmpty(color))
                return NormalizeColorValue(color);
        }

        return null;
    }

    private static string? ExtractVmlStrokeColor(DocumentFormat.OpenXml.Vml.Shape shape)
    {
        // Try to get stroke color from stroke child element
        var stroke = shape.Descendants<DocumentFormat.OpenXml.Vml.Stroke>().FirstOrDefault();
        if (stroke?.Color?.Value != null)
        {
            return NormalizeColorValue(stroke.Color.Value);
        }

        // Try from style
        var style = shape.Style?.Value;
        if (!string.IsNullOrEmpty(style))
        {
            var color = ExtractStyleValue(style, "stroke");
            if (!string.IsNullOrEmpty(color))
                return NormalizeColorValue(color);
        }

        return "#000000";
    }

    private static double ExtractVmlStrokeWidth(DocumentFormat.OpenXml.Vml.Shape shape)
    {
        var stroke = shape.Descendants<DocumentFormat.OpenXml.Vml.Stroke>().FirstOrDefault();
        if (stroke?.Weight?.Value != null)
        {
            return ParsePointValue(stroke.Weight.Value);
        }

        return 0.75;
    }

    private static string? ExtractStyleValue(string style, string key)
    {
        var parts = style.Split(';');
        foreach (var part in parts)
        {
            var trimmed = part.Trim();
            if (trimmed.StartsWith(key + ":", StringComparison.OrdinalIgnoreCase))
            {
                return trimmed.Substring(key.Length + 1).Trim();
            }
        }
        return null;
    }

    private static string NormalizeColorValue(string color)
    {
        if (string.IsNullOrEmpty(color))
            return "#000000";

        color = color.Trim();

        // Already has # prefix
        if (color.StartsWith("#"))
            return color;

        // Check if it's a valid hex color without #
        if (
            color.Length == 6
            && color.All(c => char.IsDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))
        )
        {
            return "#" + color;
        }

        // 3-digit hex shorthand
        if (
            color.Length == 3
            && color.All(c => char.IsDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))
        )
        {
            return "#" + string.Concat(color.Select(c => $"{c}{c}"));
        }

        // Map common named colors to hex values
        return color.ToLowerInvariant() switch
        {
            "black" => "#000000",
            "white" => "#FFFFFF",
            "red" => "#FF0000",
            "green" => "#00FF00",
            "blue" => "#0000FF",
            "yellow" => "#FFFF00",
            "cyan" or "aqua" => "#00FFFF",
            "magenta" or "fuchsia" => "#FF00FF",
            "gray" or "grey" => "#808080",
            "silver" => "#C0C0C0",
            "maroon" => "#800000",
            "olive" => "#808000",
            "navy" => "#000080",
            "purple" => "#800080",
            "teal" => "#008080",
            "lime" => "#00FF00",
            "orange" => "#FFA500",
            "pink" => "#FFC0CB",
            "brown" => "#A52A2A",
            "transparent" => null!,
            _ => "#000000", // Default to black for unknown colors
        };
    }

    private ParsedDocxTextBox? ParseDrawingTextBox(Anchor anchor, MainDocumentPart mainPart)
    {
        // Check if this anchor contains a text box (shape with text body)
        var textBody = anchor.Descendants<A.TextBody>().FirstOrDefault();
        if (textBody == null)
            return null;

        // Check if there's actual text content
        var hasText = textBody.Descendants<A.Text>().Any(t => !string.IsNullOrWhiteSpace(t.Text));
        if (!hasText)
            return null;

        var docProps = anchor.Descendants<DocProperties>().FirstOrDefault();

        var parsed = new ParsedDocxTextBox
        {
            ElementType = "textBox",
            Id = docProps?.Id?.Value.ToString() ?? Guid.NewGuid().ToString(),
            Name = docProps?.Name?.Value,
            // Parse position
            Position = ParseAnchorPosition(anchor),
        };

        // Parse visual style
        var spPr = anchor.Descendants<A.ShapeProperties>().FirstOrDefault();
        if (spPr != null)
        {
            parsed.Style = ParseShapeStyle(spPr);
        }

        // Parse text content from A.Paragraph elements
        foreach (var aPara in textBody.Elements<A.Paragraph>())
        {
            var paraText = string.Join("", aPara.Descendants<A.Text>().Select(t => t.Text));
            if (!string.IsNullOrWhiteSpace(paraText))
            {
                var parsedPara = new ParsedDocxParagraph
                {
                    ElementType = "paragraph",
                    Text = paraText,
                    Style = new DocxTextStyle(),
                    ParagraphStyle = new DocxParagraphStyle(),
                };

                // Parse text runs
                foreach (var aRun in aPara.Elements<A.Run>())
                {
                    var runText = string.Join("", aRun.Descendants<A.Text>().Select(t => t.Text));
                    var runStyle = ParseARunStyle(aRun);
                    parsedPara.Runs.Add(new ParsedDocxTextRun { Text = runText, Style = runStyle });
                }

                parsed.Content.Add(parsedPara);
            }
        }

        return parsed.Content.Count > 0 ? parsed : null;
    }

    private ParsedDocxShape? ParseDrawingShape(Anchor anchor)
    {
        // Check for shape preset geometry
        var prstGeom = anchor.Descendants<A.PresetGeometry>().FirstOrDefault();
        if (prstGeom == null)
            return null;

        // Skip if this is a text box (handled separately)
        var textBody = anchor.Descendants<A.TextBody>().FirstOrDefault();
        if (
            textBody != null
            && textBody.Descendants<A.Text>().Any(t => !string.IsNullOrWhiteSpace(t.Text))
        )
            return null;

        var shape = new ParsedDocxShape
        {
            ElementType = "shape",
            ShapeType = prstGeom.Preset?.Value.ToString() ?? "rectangle",
            Position = ParseAnchorPosition(anchor),
        };

        // Parse line properties
        var ln = anchor.Descendants<A.Outline>().FirstOrDefault();
        if (ln != null)
        {
            var solidFill = ln.GetFirstChild<A.SolidFill>();
            if (solidFill != null)
            {
                shape.StrokeColor = ExtractSolidFillColor(solidFill) ?? "#000000";
            }

            if (ln.Width?.HasValue == true)
            {
                shape.StrokeWidth = ln.Width.Value / EMU_PER_MM * 2.83465; // Convert to points
            }

            // Line style
            var prstDash = ln.GetFirstChild<A.PresetDash>();
            if (prstDash?.Val?.Value != null)
            {
                shape.StrokeStyle = prstDash.Val.Value.ToString().ToLower();
            }
        }

        // Parse fill
        var spPr = anchor.Descendants<A.ShapeProperties>().FirstOrDefault();
        if (spPr != null)
        {
            var fillSolid = spPr.GetFirstChild<A.SolidFill>();
            if (fillSolid != null)
            {
                shape.FillColor = ExtractSolidFillColor(fillSolid);
            }
        }

        return shape;
    }

    /// <summary>
    /// Extracts color from a SolidFill element, handling both RGB and scheme colors.
    /// </summary>
    private static string? ExtractSolidFillColor(A.SolidFill? solidFill)
    {
        if (solidFill == null)
            return null;

        // Check for RGB hex color
        var srgbClr = solidFill.GetFirstChild<A.RgbColorModelHex>();
        if (srgbClr?.Val?.Value != null)
        {
            return "#" + srgbClr.Val.Value;
        }

        // Check for scheme color (theme color reference)
        var schemeClr = solidFill.GetFirstChild<A.SchemeColor>();
        if (schemeClr?.Val?.Value != null)
        {
            // Map common scheme colors to reasonable defaults
            // In a more complete implementation, you'd look up the actual theme colors
            return schemeClr.Val.Value.ToString() switch
            {
                "tx1" or "dk1" => "#000000", // Dark text
                "tx2" or "dk2" => "#44546A", // Dark 2
                "bg1" or "lt1" => "#FFFFFF", // Light background
                "bg2" or "lt2" => "#E7E6E6", // Light 2
                "accent1" => "#4472C4",
                "accent2" => "#ED7D31",
                "accent3" => "#A5A5A5",
                "accent4" => "#FFC000",
                "accent5" => "#5B9BD5",
                "accent6" => "#70AD47",
                "hlink" => "#0563C1", // Hyperlink
                "folHlink" => "#954F72", // Followed hyperlink
                _ => "#000000",
            };
        }

        // Check for system color
        var sysClr = solidFill.GetFirstChild<A.SystemColor>();
        if (sysClr?.LastColor?.Value != null)
        {
            return "#" + sysClr.LastColor.Value;
        }

        // Check for preset color
        var prstClr = solidFill.GetFirstChild<A.PresetColor>();
        if (prstClr?.Val?.Value != null)
        {
            return NormalizeColorValue(prstClr.Val.Value.ToString());
        }

        return null;
    }

    private ParsedDocxShape? ParseInlineShape(Inline inline)
    {
        var prstGeom = inline.Descendants<A.PresetGeometry>().FirstOrDefault();
        if (prstGeom == null)
            return null;

        // Skip images
        if (inline.Descendants<A.Blip>().Any())
            return null;

        var extent = inline.Extent;
        var shape = new ParsedDocxShape
        {
            ElementType = "shape",
            ShapeType = prstGeom.Preset?.Value.ToString() ?? "rectangle",
            Position = new DocxBoxPosition
            {
                Width = extent?.Cx?.HasValue == true ? extent.Cx.Value / EMU_PER_MM : 100,
                Height = extent?.Cy?.HasValue == true ? extent.Cy.Value / EMU_PER_MM : 50,
            },
        };

        return shape;
    }

    private DocxBoxPosition ParseAnchorPosition(Anchor anchor)
    {
        var pos = new DocxBoxPosition();

        // Size
        var extent = anchor.Extent;
        if (extent != null)
        {
            if (extent.Cx?.HasValue == true)
                pos.Width = extent.Cx.Value / EMU_PER_MM;
            if (extent.Cy?.HasValue == true)
                pos.Height = extent.Cy.Value / EMU_PER_MM;
        }

        // Horizontal position
        var hPos = anchor.HorizontalPosition;
        if (hPos != null)
        {
            pos.HorizontalAnchor = hPos.RelativeFrom?.Value.ToString() ?? "margin";
            pos.HorizontalAlignment = hPos.GetFirstChild<HorizontalAlignment>()?.Text ?? "absolute";

            var posOffset = hPos.PositionOffset?.Text;
            if (!string.IsNullOrEmpty(posOffset) && long.TryParse(posOffset, out var hEmu))
            {
                pos.X = hEmu / EMU_PER_MM;
            }
        }

        // Vertical position
        var vPos = anchor.VerticalPosition;
        if (vPos != null)
        {
            pos.VerticalAnchor = vPos.RelativeFrom?.Value.ToString() ?? "paragraph";
            pos.VerticalAlignment = vPos.GetFirstChild<VerticalAlignment>()?.Text ?? "absolute";

            var posOffset = vPos.PositionOffset?.Text;
            if (!string.IsNullOrEmpty(posOffset) && long.TryParse(posOffset, out var vEmu))
            {
                pos.Y = vEmu / EMU_PER_MM;
            }
        }

        // Z-index
        if (anchor.RelativeHeight?.HasValue == true)
        {
            pos.ZIndex = (int)anchor.RelativeHeight.Value;
        }

        // Text wrap
        if (anchor.GetFirstChild<WrapNone>() != null)
            pos.TextWrap = "none";
        else if (anchor.GetFirstChild<WrapSquare>() != null)
            pos.TextWrap = "square";
        else if (anchor.GetFirstChild<WrapTight>() != null)
            pos.TextWrap = "tight";
        else if (anchor.GetFirstChild<WrapThrough>() != null)
            pos.TextWrap = "through";
        else if (anchor.GetFirstChild<WrapTopBottom>() != null)
            pos.TextWrap = "topAndBottom";

        return pos;
    }

    private DocxBoxPosition ParseVmlStyle(string style)
    {
        var pos = new DocxBoxPosition();

        var parts = style.Split(';');
        foreach (var part in parts)
        {
            var trimmed = part.Trim();
            if (string.IsNullOrEmpty(trimmed))
                continue;

            var colonIndex = trimmed.IndexOf(':');
            if (colonIndex <= 0)
                continue;

            var key = trimmed.Substring(0, colonIndex).Trim().ToLower();
            var value = trimmed.Substring(colonIndex + 1).Trim();

            switch (key)
            {
                case "width":
                    pos.Width = ParseDimension(value);
                    break;
                case "height":
                    pos.Height = ParseDimension(value);
                    break;
                case "left":
                case "margin-left":
                    pos.X = ParseDimension(value);
                    break;
                case "top":
                case "margin-top":
                    pos.Y = ParseDimension(value);
                    break;
                case "z-index":
                    if (int.TryParse(value, out var zIndex))
                        pos.ZIndex = zIndex;
                    break;
                case "rotation":
                    if (double.TryParse(value, out var rotation))
                        pos.Rotation = rotation;
                    break;
            }
        }

        return pos;
    }

    private static double ParseDimension(string value)
    {
        value = value.Trim().ToLower();

        if (value.EndsWith("pt"))
        {
            if (double.TryParse(value.Replace("pt", "").Trim(), out var pt))
                return pt * 0.352778; // Points to mm
        }
        else if (value.EndsWith("in"))
        {
            if (double.TryParse(value.Replace("in", "").Trim(), out var inches))
                return inches * 25.4; // Inches to mm
        }
        else if (value.EndsWith("cm"))
        {
            if (double.TryParse(value.Replace("cm", "").Trim(), out var cm))
                return cm * 10; // cm to mm
        }
        else if (value.EndsWith("mm"))
        {
            if (double.TryParse(value.Replace("mm", "").Trim(), out var mm))
                return mm;
        }
        else if (double.TryParse(value, out var raw))
        {
            return raw; // Assume points
        }

        return 0;
    }

    private static double ParsePointValue(string value)
    {
        value = value.Trim().ToLower();
        if (value.EndsWith("pt"))
        {
            if (double.TryParse(value.Replace("pt", "").Trim(), out var pt))
                return pt;
        }
        if (double.TryParse(value, out var raw))
            return raw;
        return 0.75;
    }

    private DocxBoxStyle ParseShapeStyle(A.ShapeProperties spPr)
    {
        var style = new DocxBoxStyle();

        // Fill
        var solidFill = spPr.GetFirstChild<A.SolidFill>();
        if (solidFill != null)
        {
            style.BackgroundColor = ExtractSolidFillColor(solidFill);
        }
        else if (spPr.GetFirstChild<A.NoFill>() != null)
        {
            style.BackgroundColor = null; // Transparent
        }

        // Outline
        var outline = spPr.GetFirstChild<A.Outline>();
        if (outline != null)
        {
            var outlineFill = outline.GetFirstChild<A.SolidFill>();
            if (outlineFill != null)
            {
                style.BorderColor = ExtractSolidFillColor(outlineFill) ?? "#000000";
            }

            if (outline.Width?.HasValue == true)
            {
                style.BorderWidth = outline.Width.Value / EMU_PER_MM * 2.83465;
            }

            if (outline.GetFirstChild<A.NoFill>() != null)
            {
                style.BorderStyle = "none";
            }
        }

        return style;
    }

    private DocxTextStyle ParseARunStyle(A.Run aRun)
    {
        var style = new DocxTextStyle();

        var rPr = aRun.RunProperties;
        if (rPr == null)
            return style;

        // Bold
        if (rPr.Bold?.Value == true)
            style.IsBold = true;

        // Italic
        if (rPr.Italic?.Value == true)
            style.IsItalic = true;

        // Underline
        if (rPr.Underline?.Value != null && rPr.Underline.Value != A.TextUnderlineValues.None)
            style.IsUnderline = true;

        // Strikethrough
        if (rPr.Strike?.Value != null && rPr.Strike.Value != A.TextStrikeValues.NoStrike)
            style.IsStrikethrough = true;

        // Font size (in hundredths of a point)
        if (rPr.FontSize?.HasValue == true)
        {
            style.FontSize = rPr.FontSize.Value / 100.0;
        }

        // Color
        var solidFill = rPr.GetFirstChild<A.SolidFill>();
        if (solidFill != null)
        {
            style.Color = ExtractSolidFillColor(solidFill) ?? "#000000";
        }

        // Font family
        var latin = rPr.GetFirstChild<A.LatinFont>();
        if (latin?.Typeface?.Value != null)
        {
            style.FontFamily = latin.Typeface.Value;
        }

        return style;
    }

    #endregion
}
