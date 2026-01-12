using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing header and footer extraction logic.
/// </summary>
public partial class DocxImportService
{
    #region Headers and Footers Extraction

    private void ExtractHeadersAndFooters(
        WordprocessingDocument wordDocument,
        ParsedDocxContent content
    )
    {
        var mainPart = wordDocument.MainDocumentPart;
        if (mainPart == null)
            return;

        // Check section properties for header/footer settings
        var sectionProps = mainPart.Document.Body?.Elements<SectionProperties>().LastOrDefault();
        if (sectionProps != null)
        {
            content.PageSettings.DifferentFirstPage =
                sectionProps.GetFirstChild<TitlePage>() != null;
        }

        // Check document settings for different odd/even pages
        var documentSettings = wordDocument.MainDocumentPart?.DocumentSettingsPart?.Settings;
        if (documentSettings != null)
        {
            var evenAndOddHeaders = documentSettings.GetFirstChild<EvenAndOddHeaders>();
            content.PageSettings.DifferentOddEven = evenAndOddHeaders != null;
        }

        // Extract headers
        foreach (var headerPart in mainPart.HeaderParts)
        {
            try
            {
                var headerRef = mainPart
                    .Document.Body?.Descendants<SectionProperties>()
                    .SelectMany(sp => sp.Elements<HeaderReference>())
                    .FirstOrDefault(hr => mainPart.GetIdOfPart(headerPart) == hr.Id?.Value);

                var headerTypeVal = headerRef?.Type?.Value;
                string headerType = "default";
                if (headerTypeVal == HeaderFooterValues.First)
                    headerType = "first";
                else if (headerTypeVal == HeaderFooterValues.Even)
                    headerType = "even";

                var parsedHeader = ParseHeaderFooterContent(headerPart.Header, mainPart);
                parsedHeader.Type = headerType;
                content.Headers[headerType] = parsedHeader;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse header part");
            }
        }

        // Extract footers
        foreach (var footerPart in mainPart.FooterParts)
        {
            try
            {
                var footerRef = mainPart
                    .Document.Body?.Descendants<SectionProperties>()
                    .SelectMany(sp => sp.Elements<FooterReference>())
                    .FirstOrDefault(fr => mainPart.GetIdOfPart(footerPart) == fr.Id?.Value);

                var footerTypeVal = footerRef?.Type?.Value;
                string footerType = "default";
                if (footerTypeVal == HeaderFooterValues.First)
                    footerType = "first";
                else if (footerTypeVal == HeaderFooterValues.Even)
                    footerType = "even";

                var parsedFooter = ParseHeaderFooterContent(footerPart.Footer, mainPart);
                parsedFooter.Type = footerType;
                content.Footers[footerType] = parsedFooter;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse footer part");
            }
        }
    }

    private ParsedDocxHeaderFooter ParseHeaderFooterContent(
        OpenXmlCompositeElement? headerFooter,
        MainDocumentPart mainPart
    )
    {
        var result = new ParsedDocxHeaderFooter();

        if (headerFooter == null)
            return result;

        foreach (var element in headerFooter.Elements())
        {
            if (element is Paragraph paragraph)
            {
                var parsedParagraph = ParseParagraph(paragraph, mainPart);
                if (parsedParagraph != null)
                {
                    result.Elements.Add(parsedParagraph);

                    // Check for field codes (page number, total pages, date)
                    foreach (var fieldCode in paragraph.Descendants<FieldCode>())
                    {
                        var code = fieldCode.Text?.ToUpperInvariant() ?? "";
                        if (code.Contains("PAGE"))
                            result.HasPageNumber = true;
                        if (code.Contains("NUMPAGES") || code.Contains("SECTIONPAGES"))
                            result.HasTotalPages = true;
                        if (code.Contains("DATE") || code.Contains("TIME"))
                            result.HasDate = true;
                    }

                    // Also check for simple fields
                    foreach (var simpleField in paragraph.Descendants<SimpleField>())
                    {
                        var instruction = simpleField.Instruction?.Value?.ToUpperInvariant() ?? "";
                        if (instruction.Contains("PAGE"))
                            result.HasPageNumber = true;
                        if (instruction.Contains("NUMPAGES"))
                            result.HasTotalPages = true;
                        if (instruction.Contains("DATE"))
                            result.HasDate = true;
                    }
                }
            }
            else if (element is Table table)
            {
                var parsedTable = ParseTableEnhanced(table, mainPart);
                if (parsedTable != null)
                {
                    result.Elements.Add(parsedTable);
                }
            }
        }

        return result;
    }

    #endregion
}
