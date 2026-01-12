using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using static PdfBuilder.Api.Services.DocxImport.DocxConversionConstants;

namespace PdfBuilder.Api.Services;

// Note: EditorDocumentContent, EditorPage, EditorComponent and related DTOs
// are defined in DTOs/Documents/EditorFormatDtos.cs

/// <summary>
/// Partial class containing editor format conversion methods.
/// </summary>
public partial class DocxImportService
{
    private EditorDocumentContent ConvertToEditorFormat(ParsedDocxContent parsed)
    {
        var pageSettings = parsed.PageSettings;
        var contentWidth =
            pageSettings.PageWidth - pageSettings.MarginLeft - pageSettings.MarginRight;

        var components = new List<EditorComponent>();
        double currentY = 0;
        var imageIndex = 0;

        foreach (var element in parsed.Elements)
        {
            if (element is ParsedDocxParagraph para)
            {
                // Add space before if paragraph style specifies it
                if (para.ParagraphStyle.SpaceBefore > 0)
                {
                    currentY += para.ParagraphStyle.SpaceBefore * MmPerPoint;
                }

                var component = CreateParagraphComponent(para, currentY, contentWidth);
                components.Add(component);
                currentY += component.Size.Height;

                // Add space after
                if (para.ParagraphStyle.SpaceAfter > 0)
                {
                    currentY += para.ParagraphStyle.SpaceAfter * MmPerPoint;
                }
                else
                {
                    currentY += DefaultElementSpacingMm;
                }
            }
            else if (element is ParsedDocxTable table)
            {
                var component = CreateTableComponent(table, currentY, contentWidth);
                components.Add(component);
                currentY += component.Size.Height + DefaultTableSpacingMm;
            }
            else if (element is ParsedDocxPageBreak)
            {
                // Page breaks will be handled when creating pages
                // Add a marker component or just note the position
                currentY +=
                    pageSettings.PageHeight - pageSettings.MarginTop - pageSettings.MarginBottom;
            }
        }

        // Add images
        foreach (var image in parsed.Images)
        {
            var component = CreateImageComponent(image, currentY, imageIndex++);
            components.Add(component);
            currentY += component.Size.Height + DefaultImageSpacingMm;
        }

        // Add text boxes as positioned components
        foreach (var textBox in parsed.TextBoxes)
        {
            var textBoxComponents = CreateTextBoxComponents(textBox, pageSettings);
            components.AddRange(textBoxComponents);
        }

        // Add shapes as placeholder components (shapes are not fully supported in editor)
        foreach (var shape in parsed.Shapes)
        {
            var shapeComponent = CreateShapeComponent(shape);
            components.Add(shapeComponent);
        }

        // Create pages based on content height
        var pages = CreatePages(components, pageSettings);

        // Create header/footer from parsed content
        var headerFooter = CreateHeaderFooterFromParsed(parsed);

        return new EditorDocumentContent
        {
            Pages = pages,
            HeaderFooter = headerFooter,
            Variables = [],
            VariableDefinitions = [],
            Settings = new EditorGlobalSettings
            {
                PredefinedSize = DeterminePageSize(pageSettings),
                Orientation = pageSettings.Orientation,
                BackgroundColor = "#FFFFFF",
                ContentDirection = "ltr",
                Margins = new EditorMargins
                {
                    Top = pageSettings.MarginTop,
                    Right = pageSettings.MarginRight,
                    Bottom = pageSettings.MarginBottom,
                    Left = pageSettings.MarginLeft,
                },
            },
        };
    }

    private EditorHeaderFooter CreateHeaderFooterFromParsed(ParsedDocxContent parsed)
    {
        var pageSettings = parsed.PageSettings;
        var contentWidth =
            pageSettings.PageWidth - pageSettings.MarginLeft - pageSettings.MarginRight;
        var headerHeight = Math.Max(pageSettings.HeaderDistance, 15);
        var footerHeight = Math.Max(pageSettings.FooterDistance, 10);

        var headerFooter = new EditorHeaderFooter
        {
            DefaultHeader = new EditorHeaderFooterContent
            {
                Height = headerHeight,
                Components = [],
            },
            DefaultFooter = new EditorHeaderFooterContent
            {
                Height = footerHeight,
                Components = [],
            },
        };

        // Process default headers - convert to components
        if (
            parsed.Headers.TryGetValue("default", out var defaultHeader)
            && defaultHeader.Elements.Count > 0
        )
        {
            headerFooter.DefaultHeader.Components = ConvertHeaderFooterElements(
                defaultHeader,
                contentWidth,
                headerHeight
            );
        }

        // Process first page headers
        if (
            parsed.Headers.TryGetValue("first", out var firstHeader)
            && firstHeader.Elements.Count > 0
        )
        {
            headerFooter.FirstPageHeader = new EditorHeaderFooterContent
            {
                Height = headerHeight,
                Components = ConvertHeaderFooterElements(firstHeader, contentWidth, headerHeight),
            };
        }

        // Process default footers - convert to components
        if (
            parsed.Footers.TryGetValue("default", out var defaultFooter)
            && defaultFooter.Elements.Count > 0
        )
        {
            headerFooter.DefaultFooter.Components = ConvertHeaderFooterElements(
                defaultFooter,
                contentWidth,
                footerHeight
            );
        }

        // Process first page footers
        if (
            parsed.Footers.TryGetValue("first", out var firstFooter)
            && firstFooter.Elements.Count > 0
        )
        {
            headerFooter.FirstPageFooter = new EditorHeaderFooterContent
            {
                Height = footerHeight,
                Components = ConvertHeaderFooterElements(firstFooter, contentWidth, footerHeight),
            };
        }

        return headerFooter;
    }

    private List<EditorComponent> ConvertHeaderFooterElements(
        ParsedDocxHeaderFooter headerFooter,
        double contentWidth,
        double height
    )
    {
        var components = new List<EditorComponent>();
        double currentY = 0;
        double elementHeight = Math.Max(height / Math.Max(headerFooter.Elements.Count, 1), 8);

        foreach (var element in headerFooter.Elements)
        {
            if (element is ParsedDocxParagraph para)
            {
                // Build the display text, inserting placeholders for field codes
                var text = BuildHeaderFooterText(para, headerFooter);

                // Skip empty paragraphs (but could be just spacing)
                if (
                    string.IsNullOrWhiteSpace(text)
                    && !headerFooter.HasPageNumber
                    && !headerFooter.HasTotalPages
                    && !headerFooter.HasDate
                )
                {
                    continue;
                }

                var component = new EditorComponent
                {
                    Id = $"hf-{Guid.NewGuid():N}",
                    Type = "text-label",
                    Position = new EditorPosition { X = 0, Y = currentY },
                    Size = new EditorSize { Width = contentWidth, Height = elementHeight },
                    Properties = CreateTextLabelPropertiesFromStyle(
                        text,
                        para.Style,
                        para.ParagraphStyle.LineSpacing
                    ),
                };

                // Add field indicators for future rendering
                if (headerFooter.HasPageNumber)
                {
                    component.Properties["hasPageNumber"] = true;
                }
                if (headerFooter.HasTotalPages)
                {
                    component.Properties["hasTotalPages"] = true;
                }
                if (headerFooter.HasDate)
                {
                    component.Properties["hasDate"] = true;
                }

                components.Add(component);
                currentY += elementHeight + 2; // Small gap between elements
            }
            else if (element is ParsedDocxTable table)
            {
                // Tables in headers/footers are often used for layout (e.g., left/center/right alignment)
                var tableComponent = CreateHeaderFooterTableComponent(
                    table,
                    currentY,
                    contentWidth
                );
                if (tableComponent != null)
                {
                    components.Add(tableComponent);
                    currentY += tableComponent.Size.Height + 2;
                }
            }
        }

        return components;
    }

    /// <summary>
    /// Builds display text for header/footer paragraph, inserting placeholders for field codes.
    /// </summary>
    private static string BuildHeaderFooterText(
        ParsedDocxParagraph para,
        ParsedDocxHeaderFooter headerFooter
    )
    {
        var text = para.Text ?? string.Empty;

        // If the text is empty but we have field codes, create placeholder text
        if (string.IsNullOrWhiteSpace(text))
        {
            var parts = new List<string>();
            if (headerFooter.HasPageNumber)
            {
                parts.Add(
                    headerFooter.HasTotalPages
                        ? "{{pageNumber}} / {{totalPages}}"
                        : "{{pageNumber}}"
                );
            }
            else if (headerFooter.HasTotalPages)
            {
                parts.Add("{{totalPages}}");
            }
            if (headerFooter.HasDate)
            {
                parts.Add("{{date}}");
            }
            return string.Join(" | ", parts);
        }

        return text;
    }

    /// <summary>
    /// Creates a simplified component for tables in header/footer (often used for layout).
    /// </summary>
    private EditorComponent? CreateHeaderFooterTableComponent(
        ParsedDocxTable table,
        double y,
        double contentWidth
    )
    {
        // Extract text content from the table for a simplified representation
        var textParts = new List<string>();
        foreach (var row in table.TableRows)
        {
            foreach (var cell in row.Cells)
            {
                if (!string.IsNullOrWhiteSpace(cell.Text))
                {
                    textParts.Add(cell.Text.Trim());
                }
            }
        }

        if (textParts.Count == 0)
        {
            return null;
        }

        // Join with separator - tables in headers often have left/center/right sections
        var displayText = string.Join(" | ", textParts);

        return new EditorComponent
        {
            Id = $"hf-table-{Guid.NewGuid():N}",
            Type = "text-label",
            Position = new EditorPosition { X = 0, Y = y },
            Size = new EditorSize { Width = contentWidth, Height = 10 },
            Properties = CreateDefaultTextLabelProperties(displayText, textAlign: "center"),
        };
    }

    private EditorComponent CreateParagraphComponent(
        ParsedDocxParagraph para,
        double y,
        double contentWidth
    )
    {
        // Account for list indentation
        var indentX = 0.0;
        var effectiveWidth = contentWidth;

        if (para.IsListItem && para.ListInfo != null)
        {
            indentX = para.ListInfo.IndentMm;
            effectiveWidth = contentWidth - indentX;
        }
        else if (para.ParagraphStyle.LeftIndent > 0)
        {
            indentX = para.ParagraphStyle.LeftIndent;
            effectiveWidth = contentWidth - indentX - para.ParagraphStyle.RightIndent;
        }

        // Estimate height based on content and line spacing
        var lineHeight =
            para.ParagraphStyle.LineSpacing > 0
                ? para.ParagraphStyle.LineSpacing
                : DefaultLineSpacing;
        var charsPerLine = Math.Max(1, effectiveWidth / (para.Style.FontSize * 0.35));
        var estimatedLines = Math.Ceiling(para.Text.Length / charsPerLine);
        var baseHeight = estimatedLines * para.Style.FontSize * 0.4 * lineHeight;

        // Add paragraph spacing (convert points to mm)
        var height = Math.Max(
            8,
            baseHeight
                + para.ParagraphStyle.SpaceBefore * MmPerPoint
                + para.ParagraphStyle.SpaceAfter * MmPerPoint
        );

        // Determine component type
        var componentType = para.IsHeading ? "text-label" : "paragraph";

        return new EditorComponent
        {
            Id = $"comp-{Guid.NewGuid():N}",
            Type = componentType,
            Position = new EditorPosition { X = indentX, Y = y },
            Size = new EditorSize { Width = effectiveWidth, Height = height },
            Properties =
                componentType == "text-label"
                    ? CreateTextLabelProperties(para)
                    : CreateParagraphProperties(para),
        };
    }

    private Dictionary<string, object> CreateTextLabelProperties(ParsedDocxParagraph para)
    {
        // Map underline style to decoration style
        var decorationStyle = MapDecorationStyle(para.Style.UnderlineStyle);

        var props = new Dictionary<string, object>
        {
            ["content"] =
                para.IsListItem && para.ListInfo != null
                    ? $"{para.ListInfo.Marker} {para.Text}"
                    : para.Text,
            ["fontSize"] = para.Style.FontSize,
            ["fontFamily"] = para.Style.FontFamily,
            ["fontWeight"] = para.Style.IsBold ? "bold" : "normal",
            ["italic"] = para.Style.IsItalic,
            ["color"] = para.Style.Color,
            ["textAlign"] = para.Style.TextAlign,
            ["letterSpacing"] = para.Style.LetterSpacing / para.Style.FontSize, // Convert to proportional
            ["wordSpacing"] = 0,
            ["lineHeight"] =
                para.ParagraphStyle.LineSpacing > 0 ? para.ParagraphStyle.LineSpacing : 1,
            ["decoration"] = GetDecoration(para.Style),
            ["decorationStyle"] = decorationStyle,
            ["decorationThickness"] = 1,
        };

        // Only add optional properties if they have values
        if (para.Style.BackgroundColor != null)
            props["backgroundColor"] = para.Style.BackgroundColor;
        if (para.Style.DecorationColor != null)
            props["decorationColor"] = para.Style.DecorationColor;

        return props;
    }

    private Dictionary<string, object> CreateParagraphProperties(ParsedDocxParagraph para)
    {
        var decorationStyle = MapDecorationStyle(para.Style.UnderlineStyle);
        var lineHeight =
            para.ParagraphStyle.LineSpacing > 0
                ? para.ParagraphStyle.LineSpacing
                : DefaultLineSpacing;

        // Convert points to mm for paragraph spacing
        var paragraphSpacing = para.ParagraphStyle.SpaceAfter * MmPerPoint;
        var firstLineIndent = para.ParagraphStyle.FirstLineIndent;

        // Handle list items by prepending marker
        var content =
            para.IsListItem && para.ListInfo != null
                ? $"{para.ListInfo.Marker} {para.Text}"
                : para.Text;

        var props = new Dictionary<string, object>
        {
            ["content"] = content,
            ["fontSize"] = para.Style.FontSize,
            ["fontFamily"] = para.Style.FontFamily,
            ["fontWeight"] = para.Style.IsBold ? "bold" : "normal",
            ["italic"] = para.Style.IsItalic,
            ["color"] = para.Style.Color,
            ["textAlign"] = para.Style.TextAlign,
            ["letterSpacing"] = para.Style.LetterSpacing / para.Style.FontSize,
            ["wordSpacing"] = 0,
            ["lineHeight"] = lineHeight,
            ["paragraphSpacing"] = Math.Max(DefaultElementSpacingMm, paragraphSpacing),
            ["firstLineIndentation"] = firstLineIndent > 0 ? firstLineIndent : 0,
            ["decoration"] = GetDecoration(para.Style),
            ["decorationStyle"] = decorationStyle,
        };

        // Only add optional properties if they have values
        if (para.Style.BackgroundColor != null)
            props["backgroundColor"] = para.Style.BackgroundColor;
        if (para.Style.DecorationColor != null)
            props["decorationColor"] = para.Style.DecorationColor;

        return props;
    }

    private static string GetDecoration(DocxTextStyle style)
    {
        if (style.IsUnderline)
            return "underline";
        if (style.IsStrikethrough || style.IsDoubleStrikethrough)
            return "strikethrough";
        return "none";
    }

    private static string MapDecorationStyle(string underlineStyle)
    {
        return underlineStyle switch
        {
            "double" => "double",
            "wavy" => "wavy",
            "dotted" => "dotted",
            "dashed" => "dashed",
            _ => "solid",
        };
    }

    /// <summary>
    /// Creates text label properties from a DocxTextStyle.
    /// Used for header/footer elements where we have parsed style information.
    /// </summary>
    private static Dictionary<string, object> CreateTextLabelPropertiesFromStyle(
        string content,
        DocxTextStyle style,
        double lineSpacing = 0
    )
    {
        var decorationStyle = MapDecorationStyle(style.UnderlineStyle);
        var effectiveLineSpacing = lineSpacing > 0 ? lineSpacing : DefaultLineSpacing;

        var props = new Dictionary<string, object>
        {
            ["content"] = content,
            ["fontSize"] = style.FontSize > 0 ? style.FontSize : 10,
            ["fontFamily"] = !string.IsNullOrEmpty(style.FontFamily)
                ? style.FontFamily
                : DefaultFontFamily,
            ["fontWeight"] = style.IsBold ? "bold" : "normal",
            ["italic"] = style.IsItalic,
            ["color"] = !string.IsNullOrEmpty(style.Color) ? style.Color : "#000000",
            ["textAlign"] = !string.IsNullOrEmpty(style.TextAlign) ? style.TextAlign : "left",
            ["letterSpacing"] = style.FontSize > 0 ? style.LetterSpacing / style.FontSize : 0,
            ["wordSpacing"] = 0,
            ["lineHeight"] = effectiveLineSpacing,
            ["decoration"] = GetDecoration(style),
            ["decorationStyle"] = decorationStyle,
            ["decorationThickness"] = 1,
        };

        if (style.BackgroundColor != null)
            props["backgroundColor"] = style.BackgroundColor;
        if (style.DecorationColor != null)
            props["decorationColor"] = style.DecorationColor;

        return props;
    }

    /// <summary>
    /// Creates default text label properties with minimal styling.
    /// Used for simple text elements like header/footer table content.
    /// </summary>
    private static Dictionary<string, object> CreateDefaultTextLabelProperties(
        string content,
        double fontSize = 10,
        string fontFamily = "Inter",
        string fontWeight = "normal",
        bool italic = false,
        string color = "#000000",
        string textAlign = "left"
    )
    {
        return new Dictionary<string, object>
        {
            ["content"] = content,
            ["fontSize"] = fontSize,
            ["fontFamily"] = fontFamily,
            ["fontWeight"] = fontWeight,
            ["italic"] = italic,
            ["color"] = color,
            ["textAlign"] = textAlign,
            ["letterSpacing"] = 0,
            ["wordSpacing"] = 0,
            ["lineHeight"] = DefaultLineSpacing,
            ["decoration"] = "none",
            ["decorationStyle"] = "solid",
            ["decorationThickness"] = 1,
        };
    }

    private static EditorComponent CreateTableComponent(
        ParsedDocxTable table,
        double y,
        double contentWidth
    )
    {
        var rowCount = table.Rows.Count + (table.HasHeaderRow ? 1 : 0);
        var height = Math.Max(50, rowCount * 25); // Estimate 25mm per row

        // Create column definitions from parsed data
        var columnDefinitions = new List<Dictionary<string, object>>();
        var totalFixedWidth = table
            .ColumnDefinitions.Where(c => c.WidthType == "fixed")
            .Sum(c => c.Width);

        foreach (var colDef in table.ColumnDefinitions)
        {
            if (colDef.WidthType == "fixed" && totalFixedWidth > 0)
            {
                // Convert to points for constant type
                columnDefinitions.Add(
                    new Dictionary<string, object>
                    {
                        ["type"] = "constant",
                        ["width"] = colDef.Width * 2.83, // mm to points
                        ["align"] = "left",
                    }
                );
            }
            else
            {
                columnDefinitions.Add(
                    new Dictionary<string, object>
                    {
                        ["type"] = "relative",
                        ["width"] = 1,
                        ["align"] = "left",
                    }
                );
            }
        }

        // Fallback if no column definitions
        if (columnDefinitions.Count == 0)
        {
            columnDefinitions =
            [
                .. Enumerable
                    .Range(0, table.ColumnCount)
                    .Select(_ => new Dictionary<string, object>
                    {
                        ["type"] = "relative",
                        ["width"] = 1,
                        ["align"] = "left",
                    }),
            ];
        }

        // Get header background from first header cell if available
        var headerBg = table.Style.HeaderBackground;
        if (
            table.HasHeaderRow
            && table.TableRows.FirstOrDefault()?.Cells.FirstOrDefault()?.Style.BackgroundColor
                != null
        )
        {
            headerBg = table.TableRows.First().Cells.First().Style.BackgroundColor!;
        }

        return new EditorComponent
        {
            Id = $"comp-{Guid.NewGuid():N}",
            Type = "table",
            Position = new EditorPosition { X = 0, Y = y },
            Size = new EditorSize { Width = contentWidth, Height = height },
            Properties = new Dictionary<string, object>
            {
                ["columnDefinitions"] = columnDefinitions,
                ["headers"] = table.HasHeaderRow
                    ? table.Headers
                    : [.. Enumerable.Repeat("", table.ColumnCount)],
                ["data"] = table.Rows,
                ["showHeader"] = table.HasHeaderRow,
                ["headerBackground"] = headerBg,
                ["headerTextColor"] = "#000000",
                ["headerFontSize"] = 10,
                ["headerFontWeight"] = "bold",
                ["headerPaddingVertical"] = 8,
                ["headerPaddingHorizontal"] = 10,
                ["headerVerticalAlign"] = "middle",
                ["headerBorderBottom"] = true,
                ["headerBorderBottomWidth"] =
                    table.Style.BorderWidth > 0 ? table.Style.BorderWidth : 1,
                ["headerBorderBottomColor"] = table.Style.BorderColor,
                ["cellTextColor"] = "#000000",
                ["cellFontSize"] = 10,
                ["cellFontWeight"] = "normal",
                ["cellPaddingVertical"] = 5,
                ["cellPaddingHorizontal"] = 10,
                ["cellVerticalAlign"] = "middle",
                ["alternateRowColors"] = table.Style.AlternateRowColors,
                ["evenRowBackground"] = table.Style.EvenRowBackground ?? "#ffffff",
                ["oddRowBackground"] = table.Style.OddRowBackground ?? "#f9f9f9",
                ["borderStyle"] = "all",
                ["borderWidth"] = table.Style.BorderWidth,
                ["borderColor"] = table.Style.BorderColor,
            },
        };
    }

    private static EditorComponent CreateImageComponent(ParsedDocxImage image, double y, int index)
    {
        var width = image.Width ?? 50;
        var height = image.Height ?? 50;

        // Use horizontal position if available (for anchored images)
        var x = image.HorizontalPosition ?? 0;

        // Convert image data to base64 data URI
        var base64 = Convert.ToBase64String(image.Data);
        var dataUri = $"data:{image.ContentType};base64,{base64}";

        return new EditorComponent
        {
            Id = $"comp-{Guid.NewGuid():N}",
            Type = "image",
            Position = new EditorPosition { X = x, Y = y },
            Size = new EditorSize { Width = width, Height = height },
            Properties = new Dictionary<string, object>
            {
                ["src"] = dataUri,
                ["alt"] = image.AltText ?? image.Title ?? $"Image {index + 1}",
                ["imageType"] = image.ContentType.Contains("svg") ? "svg" : "raster",
                ["fitMode"] = "fitArea",
                ["compressionQuality"] = "high",
                ["rasterDpi"] = 288,
                ["useOriginalImage"] = false,
            },
        };
    }

    private static List<EditorPage> CreatePages(
        List<EditorComponent> components,
        DocxPageSettings settings
    )
    {
        var pageHeight = settings.PageHeight - settings.MarginTop - settings.MarginBottom;
        var pages = new List<EditorPage>();

        var currentPage = new EditorPage
        {
            Id = $"page-{Guid.NewGuid():N}",
            PageNumber = 1,
            HeaderType = "default",
            FooterType = "default",
            Components = [],
        };

        double currentY = 0;

        foreach (var component in components)
        {
            // Check if component fits on current page
            if (currentY + component.Size.Height > pageHeight && currentPage.Components.Count != 0)
            {
                // Start new page
                pages.Add(currentPage);
                currentPage = new EditorPage
                {
                    Id = $"page-{Guid.NewGuid():N}",
                    PageNumber = pages.Count + 1,
                    HeaderType = "default",
                    FooterType = "default",
                    Components = [],
                };
                currentY = 0;
            }

            // Adjust component position for current page
            var pageComponent = new EditorComponent
            {
                Id = component.Id,
                Type = component.Type,
                Position = new EditorPosition { X = component.Position.X, Y = currentY },
                Size = component.Size,
                Properties = component.Properties,
            };

            currentPage.Components.Add(pageComponent);
            currentY += component.Size.Height + 2;
        }

        if (currentPage.Components.Count != 0 || pages.Count == 0)
        {
            pages.Add(currentPage);
        }

        return pages;
    }

    private static EditorHeaderFooter CreateDefaultHeaderFooter()
    {
        return new EditorHeaderFooter
        {
            DefaultHeader = new EditorHeaderFooterContent { Height = 25, Components = [] },
            DefaultFooter = new EditorHeaderFooterContent { Height = 15, Components = [] },
        };
    }

    private static string DeterminePageSize(DocxPageSettings settings)
    {
        // Check common page sizes using constants
        // A4: 210 x 297 mm
        if (
            IsPageSize(settings, A4WidthMm, A4HeightMm)
            || IsPageSize(settings, A4HeightMm, A4WidthMm)
        )
            return "a4";

        // Letter: 215.9 x 279.4 mm
        if (
            IsPageSize(settings, LetterWidthMm, LetterHeightMm)
            || IsPageSize(settings, LetterHeightMm, LetterWidthMm)
        )
            return "letter";

        // A3: 297 x 420 mm
        if (
            IsPageSize(settings, A3WidthMm, A3HeightMm)
            || IsPageSize(settings, A3HeightMm, A3WidthMm)
        )
            return "a3";

        // Legal: 215.9 x 355.6 mm
        if (
            IsPageSize(settings, LegalWidthMm, LegalHeightMm)
            || IsPageSize(settings, LegalHeightMm, LegalWidthMm)
        )
            return "legal";

        return "a4"; // Default to A4
    }

    /// <summary>
    /// Helper to check if page dimensions match a standard size within tolerance.
    /// </summary>
    private static bool IsPageSize(DocxPageSettings settings, double width, double height)
    {
        return Math.Abs(settings.PageWidth - width) < PageSizeTolerance
            && Math.Abs(settings.PageHeight - height) < PageSizeTolerance;
    }

    /// <summary>
    /// Maps common Word fonts to web-safe alternatives.
    /// </summary>
    private static string MapFontFamily(string docxFont)
    {
        return docxFont.ToLowerInvariant() switch
        {
            "calibri" => DefaultFontFamily,
            "arial" => DefaultFontFamily,
            "times new roman" => "Times New Roman",
            "courier new" => "Courier New",
            "georgia" => "Georgia",
            "verdana" => "Verdana",
            "tahoma" => "Tahoma",
            "trebuchet ms" => "Trebuchet MS",
            "comic sans ms" => "Comic Sans MS",
            "impact" => "Impact",
            _ => DefaultFontFamily,
        };
    }

    private static string? MapHighlightColor(HighlightColorValues highlight)
    {
        if (highlight == HighlightColorValues.Yellow)
            return "#FFFF00";
        if (highlight == HighlightColorValues.Green)
            return "#00FF00";
        if (highlight == HighlightColorValues.Cyan)
            return "#00FFFF";
        if (highlight == HighlightColorValues.Magenta)
            return "#FF00FF";
        if (highlight == HighlightColorValues.Blue)
            return "#0000FF";
        if (highlight == HighlightColorValues.Red)
            return "#FF0000";
        if (highlight == HighlightColorValues.DarkBlue)
            return "#000080";
        if (highlight == HighlightColorValues.DarkCyan)
            return "#008080";
        if (highlight == HighlightColorValues.DarkGreen)
            return "#008000";
        if (highlight == HighlightColorValues.DarkMagenta)
            return "#800080";
        if (highlight == HighlightColorValues.DarkRed)
            return "#800000";
        if (highlight == HighlightColorValues.DarkYellow)
            return "#808000";
        if (highlight == HighlightColorValues.DarkGray)
            return "#808080";
        if (highlight == HighlightColorValues.LightGray)
            return "#C0C0C0";
        if (highlight == HighlightColorValues.Black)
            return "#000000";
        if (highlight == HighlightColorValues.White)
            return "#FFFFFF";
        return null;
    }

    /// <summary>
    /// Creates editor components from a text box.
    /// Text boxes are converted to positioned text-label components.
    /// </summary>
    private List<EditorComponent> CreateTextBoxComponents(
        ParsedDocxTextBox textBox,
        DocxPageSettings pageSettings
    )
    {
        var components = new List<EditorComponent>();

        // Calculate position relative to page margins
        var x = textBox.Position.X;
        var y = textBox.Position.Y;

        // Adjust based on anchor type
        if (textBox.Position.HorizontalAnchor == "margin")
        {
            x += pageSettings.MarginLeft;
        }
        if (textBox.Position.VerticalAnchor == "margin")
        {
            y += pageSettings.MarginTop;
        }

        // For each paragraph in the text box, create a text component
        double contentY = 0;
        foreach (var element in textBox.Content)
        {
            if (element is ParsedDocxParagraph para)
            {
                // Combine all runs into content text
                var content =
                    para.Runs.Count > 0
                        ? string.Join("", para.Runs.Select(r => r.Text))
                        : para.Text;

                if (string.IsNullOrWhiteSpace(content))
                    continue;

                // Get style from first run or paragraph
                var style = para.Runs.FirstOrDefault()?.Style ?? para.Style;
                var effectiveWidth = Math.Max(
                    50,
                    textBox.Position.Width - textBox.Style.PaddingLeft - textBox.Style.PaddingRight
                );
                var estimatedHeight = Math.Max(
                    10,
                    style.FontSize
                        * 0.4
                        * (1 + content.Length / (effectiveWidth / (style.FontSize * 0.35)))
                );

                var componentProps = new Dictionary<string, object>
                {
                    ["content"] = content,
                    ["fontSize"] = style.FontSize,
                    ["fontFamily"] = style.FontFamily,
                    ["fontWeight"] = style.IsBold ? "bold" : "normal",
                    ["italic"] = style.IsItalic,
                    ["color"] = style.Color ?? DefaultBlack,
                    ["textAlign"] = style.TextAlign ?? "left",
                    ["letterSpacing"] = 0,
                    ["wordSpacing"] = 0,
                    ["lineHeight"] = DefaultLineSpacing,
                    ["decoration"] = GetDecoration(style),
                    ["decorationStyle"] = "solid",
                    ["decorationThickness"] = 1,
                };

                // Only add optional properties if they have values
                if (textBox.Style.BackgroundColor != null)
                    componentProps["backgroundColor"] = textBox.Style.BackgroundColor;

                var component = new EditorComponent
                {
                    Id = $"comp-{Guid.NewGuid():N}",
                    Type = "text-label",
                    Position = new EditorPosition
                    {
                        X = x + textBox.Style.PaddingLeft,
                        Y = y + textBox.Style.PaddingTop + contentY,
                    },
                    Size = new EditorSize { Width = effectiveWidth, Height = estimatedHeight },
                    Properties = componentProps,
                };

                components.Add(component);
                contentY += estimatedHeight + DefaultElementSpacingMm;
            }
        }

        return components;
    }

    /// <summary>
    /// Creates an editor component for a shape.
    /// Shapes are converted to placeholder components since the editor doesn't have native shape support.
    /// </summary>
    private static EditorComponent CreateShapeComponent(ParsedDocxShape shape)
    {
        // Map shape type to a display-friendly label
        var shapeLabel = shape.ShapeType switch
        {
            "rect" or "rectangle" => "Rectangle",
            "roundRect" => "Rounded Rectangle",
            "ellipse" or "oval" => "Ellipse",
            "line" => "Line",
            "straightConnector1" => "Connector",
            "triangle" => "Triangle",
            "rightArrow" or "leftArrow" or "upArrow" or "downArrow" => "Arrow",
            _ => $"Shape ({shape.ShapeType})",
        };

        return new EditorComponent
        {
            Id = $"comp-{Guid.NewGuid():N}",
            Type = "placeholder",
            Position = new EditorPosition { X = shape.Position.X, Y = shape.Position.Y },
            Size = new EditorSize
            {
                Width = Math.Max(20, shape.Position.Width),
                Height = Math.Max(10, shape.Position.Height),
            },
            Properties = new Dictionary<string, object>
            {
                ["label"] = shapeLabel,
                ["variant"] = "info",
                ["showIcon"] = true,
            },
        };
    }
}
