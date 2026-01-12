using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing section, page layout, and page break extraction logic.
/// </summary>
public partial class DocxImportService
{
    #region Page Settings Extraction

    /// <summary>
    /// Extracts page settings from the document's final section properties.
    /// This is the primary page settings extraction used for the document-level settings.
    /// </summary>
    private static DocxPageSettings ExtractPageSettings(MainDocumentPart mainPart)
    {
        var sectionProperties = mainPart
            .Document.Body?.Elements<SectionProperties>()
            .FirstOrDefault();

        return sectionProperties != null
            ? ExtractPageSettingsFromSectionProperties(sectionProperties)
            : new DocxPageSettings();
    }

    /// <summary>
    /// Extracts page settings from a specific section properties element.
    /// Shared logic used by both document-level and section-level extraction.
    /// </summary>
    private static DocxPageSettings ExtractPageSettingsFromSectionProperties(
        SectionProperties sectPr
    )
    {
        var settings = new DocxPageSettings();

        // Page size
        var pageSize = sectPr.GetFirstChild<PageSize>();
        if (pageSize != null)
        {
            if (pageSize.Width?.HasValue == true)
                settings.PageWidth = pageSize.Width.Value / TWIPS_PER_MM;
            if (pageSize.Height?.HasValue == true)
                settings.PageHeight = pageSize.Height.Value / TWIPS_PER_MM;

            settings.Orientation =
                pageSize.Orient?.Value == PageOrientationValues.Landscape
                    ? "landscape"
                    : "portrait";
        }

        // Page margins (including header/footer distances and gutter)
        var pageMargin = sectPr.GetFirstChild<PageMargin>();
        if (pageMargin != null)
        {
            if (pageMargin.Top?.HasValue == true)
                settings.MarginTop = Math.Abs(pageMargin.Top.Value) / TWIPS_PER_MM;
            if (pageMargin.Bottom?.HasValue == true)
                settings.MarginBottom = Math.Abs(pageMargin.Bottom.Value) / TWIPS_PER_MM;
            if (pageMargin.Left?.HasValue == true)
                settings.MarginLeft = pageMargin.Left.Value / TWIPS_PER_MM;
            if (pageMargin.Right?.HasValue == true)
                settings.MarginRight = pageMargin.Right.Value / TWIPS_PER_MM;
            if (pageMargin.Header?.HasValue == true)
                settings.HeaderDistance = pageMargin.Header.Value / TWIPS_PER_MM;
            if (pageMargin.Footer?.HasValue == true)
                settings.FooterDistance = pageMargin.Footer.Value / TWIPS_PER_MM;
            if (pageMargin.Gutter?.HasValue == true)
                settings.Gutter = pageMargin.Gutter.Value / TWIPS_PER_MM;
        }

        // Gutter position (from document settings - if available from sectPr context)
        var gutterAtTop = sectPr.GetFirstChild<GutterOnRight>();
        if (gutterAtTop != null)
        {
            settings.GutterPosition = "right";
        }

        // Title page (different first page header/footer)
        var titlePage = sectPr.GetFirstChild<TitlePage>();
        if (titlePage != null)
        {
            settings.DifferentFirstPage = titlePage.Val?.Value != false;
        }

        return settings;
    }

    #endregion

    #region Section Extraction

    /// <summary>
    /// Extracts all sections from the document.
    /// Sections are defined by sectPr elements in paragraphs (section breaks) and at the end of body (final section).
    /// </summary>
    private List<ParsedDocxSection> ExtractSections(MainDocumentPart mainPart)
    {
        var sections = new List<ParsedDocxSection>();

        var body = mainPart.Document.Body;
        if (body == null)
            return sections;

        // Check for different odd/even headers at document settings level
        var evenAndOddHeaders =
            mainPart.DocumentSettingsPart?.Settings?.GetFirstChild<EvenAndOddHeaders>();
        var hasDifferentOddEven = evenAndOddHeaders != null;

        int elementIndex = 0;
        int sectionStartIndex = 0;

        foreach (var element in body.Elements())
        {
            if (element is Paragraph paragraph)
            {
                var sectPr = paragraph.ParagraphProperties?.GetFirstChild<SectionProperties>();
                if (sectPr != null)
                {
                    // This paragraph ends a section
                    var section = CreateSectionFromProperties(
                        sectPr,
                        sectionStartIndex,
                        elementIndex,
                        hasDifferentOddEven
                    );
                    sections.Add(section);
                    sectionStartIndex = elementIndex + 1;
                }
            }
            elementIndex++;
        }

        // Add final section from body's sectPr
        var finalSectPr = body.GetFirstChild<SectionProperties>();
        if (finalSectPr != null)
        {
            var finalSection = CreateSectionFromProperties(
                finalSectPr,
                sectionStartIndex,
                elementIndex - 1,
                hasDifferentOddEven
            );
            sections.Add(finalSection);
        }

        return sections;
    }

    /// <summary>
    /// Creates a parsed section from Word section properties.
    /// </summary>
    private static ParsedDocxSection CreateSectionFromProperties(
        SectionProperties sectPr,
        int startIndex,
        int endIndex,
        bool hasDifferentOddEven
    )
    {
        var section = new ParsedDocxSection
        {
            StartIndex = startIndex,
            EndIndex = endIndex,
            PageSettings = ExtractPageSettingsFromSectionProperties(sectPr),
        };

        // Apply document-level different odd/even setting
        if (section.PageSettings != null)
        {
            section.PageSettings.DifferentOddEven = hasDifferentOddEven;
        }

        // Section break type
        var sectType = sectPr.GetFirstChild<SectionType>();
        section.BreakType = MapSectionBreakType(sectType?.Val?.Value);

        // Column configuration
        var cols = sectPr.GetFirstChild<Columns>();
        if (cols != null)
        {
            section.Columns = ExtractColumnConfig(cols);
        }

        return section;
    }

    /// <summary>
    /// Maps Word section break values to string representation.
    /// </summary>
    private static string MapSectionBreakType(SectionMarkValues? sectionMarkValue)
    {
        if (sectionMarkValue == null)
            return "nextPage";

        var val = sectionMarkValue.Value;
        if (val == SectionMarkValues.Continuous)
            return "continuous";
        if (val == SectionMarkValues.EvenPage)
            return "evenPage";
        if (val == SectionMarkValues.OddPage)
            return "oddPage";
        if (val == SectionMarkValues.NextColumn)
            return "nextColumn";

        return "nextPage";
    }

    /// <summary>
    /// Extracts column configuration from section properties.
    /// </summary>
    private static DocxColumnConfig ExtractColumnConfig(Columns cols)
    {
        var config = new DocxColumnConfig();

        if (cols.ColumnCount?.HasValue == true)
            config.ColumnCount = (int)cols.ColumnCount.Value;

        if (cols.Space?.Value != null && double.TryParse(cols.Space.Value, out var colSpacing))
            config.ColumnSpacing = colSpacing / TWIPS_PER_MM;

        config.EqualWidth = cols.EqualWidth?.Value != false;
        config.SeparatorLine = cols.Separator?.Value == true;

        // Individual column definitions (when columns are not equal width)
        foreach (var col in cols.Elements<Column>())
        {
            if (col.Width?.Value != null && double.TryParse(col.Width.Value, out var colWidth))
            {
                config.ColumnWidths.Add(colWidth / TWIPS_PER_MM);
            }
        }

        return config;
    }

    #endregion

    #region Page Break Extraction

    /// <summary>
    /// Extracts page break information from a paragraph.
    /// Checks for explicit page/column breaks in runs and page-break-before in paragraph properties.
    /// </summary>
    private static ParsedDocxPageBreak? ExtractPageBreakFromParagraph(Paragraph paragraph)
    {
        // Check for explicit page break in runs
        foreach (var run in paragraph.Descendants<Run>())
        {
            foreach (var br in run.Descendants<Break>())
            {
                if (br.Type?.Value == BreakValues.Page)
                {
                    return new ParsedDocxPageBreak
                    {
                        ElementType = "pageBreak",
                        BreakType = "page",
                    };
                }
                if (br.Type?.Value == BreakValues.Column)
                {
                    return new ParsedDocxPageBreak
                    {
                        ElementType = "pageBreak",
                        BreakType = "column",
                    };
                }
            }
        }

        // Check for page break before in paragraph properties
        var pageBreakBefore = paragraph.ParagraphProperties?.PageBreakBefore;
        if (pageBreakBefore != null && pageBreakBefore.Val?.Value != false)
        {
            return new ParsedDocxPageBreak { ElementType = "pageBreak", BreakType = "page" };
        }

        return null;
    }

    #endregion

    #region Tab Stop Extraction

    /// <summary>
    /// Extracts default tab stops from document settings.
    /// Creates tab stops at regular intervals based on the document's default tab stop setting.
    /// </summary>
    private static List<DocxTabStop> ExtractDefaultTabStops(MainDocumentPart mainPart)
    {
        var tabStops = new List<DocxTabStop>();

        var settings = mainPart.DocumentSettingsPart?.Settings;
        var defaultTabStop = settings?.GetFirstChild<DefaultTabStop>();

        if (defaultTabStop?.Val?.HasValue != true)
            return tabStops;

        // Create default tab stops at regular intervals (up to 20)
        double intervalMm = defaultTabStop.Val.Value / TWIPS_PER_MM;
        for (int i = 1; i <= 20; i++)
        {
            tabStops.Add(
                new DocxTabStop
                {
                    Position = intervalMm * i,
                    Alignment = "left",
                    Leader = "none",
                }
            );
        }

        return tabStops;
    }

    /// <summary>
    /// Extracts tab stops defined in paragraph properties.
    /// </summary>
    private static List<DocxTabStop> ExtractParagraphTabStops(ParagraphProperties? pProps)
    {
        var tabStops = new List<DocxTabStop>();

        var tabs = pProps?.GetFirstChild<Tabs>();
        if (tabs == null)
            return tabStops;

        foreach (var tab in tabs.Elements<TabStop>())
        {
            if (tab.Position?.HasValue != true)
                continue;

            var tabStop = new DocxTabStop
            {
                Position = tab.Position.Value / TWIPS_PER_MM,
                Alignment = MapTabAlignment(tab.Val?.Value),
                Leader = MapTabLeader(tab.Leader?.Value),
            };

            tabStops.Add(tabStop);
        }

        return tabStops;
    }

    /// <summary>
    /// Maps Word tab alignment values to string representation.
    /// </summary>
    private static string MapTabAlignment(TabStopValues? tabValue)
    {
        if (tabValue == null)
            return "left";

        var val = tabValue.Value;
        if (val == TabStopValues.Center)
            return "center";
        if (val == TabStopValues.Right)
            return "right";
        if (val == TabStopValues.Decimal)
            return "decimal";
        if (val == TabStopValues.Bar)
            return "bar";
        if (val == TabStopValues.Clear)
            return "clear";

        return "left";
    }

    /// <summary>
    /// Maps Word tab leader character values to string representation.
    /// </summary>
    private static string MapTabLeader(TabStopLeaderCharValues? leaderValue)
    {
        if (leaderValue == null)
            return "none";

        var val = leaderValue.Value;
        if (val == TabStopLeaderCharValues.Dot)
            return "dot";
        if (val == TabStopLeaderCharValues.Hyphen)
            return "hyphen";
        if (val == TabStopLeaderCharValues.Underscore)
            return "underscore";
        if (val == TabStopLeaderCharValues.MiddleDot)
            return "middleDot";
        if (val == TabStopLeaderCharValues.Heavy)
            return "heavy";

        return "none";
    }

    #endregion
}
