using System.Text.Json;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.DTOs.Documents;
using PdfBuilder.Api.Services.DocxImport;
using static PdfBuilder.Api.Services.DocxImport.DocxConversionConstants;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service for importing DOCX files and converting them to editor-compatible JSON format.
/// Provides comprehensive 1:1 conversion from Word documents to the PDF template builder format.
/// </summary>
public partial class DocxImportService(
    IDocumentRepository documentRepository,
    ILogger<DocxImportService> logger
) : IDocxImportService
{
    private readonly IDocumentRepository _documentRepository = documentRepository;
    private readonly ILogger<DocxImportService> _logger = logger;

    // Use constants from DocxConversionConstants via static import
    // Legacy aliases for backward compatibility within partial classes
    private const double TWIPS_PER_MM = TwipsPerMm;
    private const double EMU_PER_MM = EmuPerMm;
    private const double HALF_POINTS_PER_POINT = HalfPointsPerPoint;
    private const double EIGHTHS_PER_POINT = EighthsPerPoint;
    private const double TWIPS_PER_POINT = TwipsPerPoint;
    private const double TWENTIETHS_PER_POINT = TwentiethsPerPoint;

    // Cache for numbering definitions
    private Dictionary<int, NumberingDefinition>? _numberingCache;

    public async Task<DocxImportResponse> ImportAsync(
        Stream fileStream,
        string fileName,
        string? title = null,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var parsedContent = await ParseAsync(fileStream, cancellationToken);
            var documentTitle = title ?? Path.GetFileNameWithoutExtension(fileName);

            // Convert parsed content to editor JSON format
            var editorContent = ConvertToEditorFormat(parsedContent);
            var contentJson = JsonSerializer.Serialize(
                editorContent,
                new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = false,
                }
            );

            // Create document in database
            var document = new Entities.Document
            {
                Title = documentTitle,
                Content = contentJson,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            await _documentRepository.CreateAsync(document, cancellationToken);

            var listCount = parsedContent
                .Elements.OfType<ParsedDocxParagraph>()
                .Count(p => p.IsListItem);

            var pageBreakCount = parsedContent.Elements.OfType<ParsedDocxPageBreak>().Count();

            var mergedCellCount = parsedContent
                .Elements.OfType<ParsedDocxTable>()
                .SelectMany(t => t.TableRows)
                .SelectMany(r => r.Cells)
                .Count(c => c.ColumnSpan > 1 || c.RowSpan > 1);

            var textBoxCount = parsedContent.TextBoxes.Count;
            var shapeCount = parsedContent.Shapes.Count;

            var metadata = new DocxImportMetadata(
                ParagraphCount: parsedContent.Elements.OfType<ParsedDocxParagraph>().Count(),
                TableCount: parsedContent.Elements.OfType<ParsedDocxTable>().Count(),
                ImageCount: parsedContent.Images.Count,
                ListCount: listCount,
                HyperlinkCount: parsedContent.Hyperlinks.Count,
                TotalPages: Math.Max(1, parsedContent.Sections.Count),
                OriginalFileName: fileName,
                HasHeaders: parsedContent.Headers.Count > 0,
                HasFooters: parsedContent.Footers.Count > 0,
                PageBreakCount: pageBreakCount,
                SectionCount: Math.Max(1, parsedContent.Sections.Count),
                MergedCellCount: mergedCellCount,
                TextBoxCount: textBoxCount,
                FootnoteCount: parsedContent.Footnotes.Count,
                EndnoteCount: parsedContent.Endnotes.Count,
                BookmarkCount: parsedContent.Bookmarks.Count,
                CommentCount: parsedContent.Comments.Count,
                ShapeCount: shapeCount,
                HasWatermark: parsedContent.Watermark != null,
                DocumentProperties: parsedContent.DocumentProperties,
                // New advanced feature counts
                EquationCount: parsedContent.Equations.Count,
                ChartCount: parsedContent.Charts.Count,
                SmartArtCount: parsedContent.SmartArt.Count,
                FormFieldCount: parsedContent.FormFields.Count,
                ContentControlCount: parsedContent.ContentControls.Count,
                RevisionCount: parsedContent.Revisions.Count,
                StyleCount: parsedContent.Styles.Count,
                HasTableOfContents: parsedContent.TableOfContents != null,
                CitationCount: parsedContent.Citations.Count,
                BibliographySourceCount: parsedContent.Bibliography?.Sources.Count ?? 0,
                EmbeddedObjectCount: parsedContent.EmbeddedObjects.Count,
                HasCustomXml: parsedContent.CustomXmlData.Count > 0,
                Theme: parsedContent.Theme
            );

            return new DocxImportResponse(
                Success: true,
                Document: new DocumentResponse(
                    document.Id,
                    document.Title,
                    document.Content,
                    document.CreatedAt,
                    document.UpdatedAt
                ),
                Metadata: metadata
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to import DOCX file: {FileName}", fileName);
            return new DocxImportResponse(
                Success: false,
                ErrorMessage: $"Failed to import DOCX file: {ex.Message}"
            );
        }
    }

    public Task<ParsedDocxContent> ParseAsync(
        Stream fileStream,
        CancellationToken cancellationToken = default
    )
    {
        var content = new ParsedDocxContent();
        _numberingCache = null;

        using var wordDocument = WordprocessingDocument.Open(fileStream, false);
        var mainPart = wordDocument.MainDocumentPart;

        if (mainPart?.Document?.Body is null)
        {
            throw new InvalidOperationException("Invalid DOCX file: Document body not found.");
        }

        // Build numbering cache for list processing
        BuildNumberingCache(mainPart);

        // Extract hyperlinks
        content.Hyperlinks = ExtractHyperlinks(mainPart);

        // Extract page settings
        content.PageSettings = ExtractPageSettings(mainPart);

        // Extract images with dimensions
        content.Images = ExtractImagesWithDimensions(mainPart);

        // Extract headers and footers
        ExtractHeadersAndFooters(wordDocument, content);

        // Extract sections with page settings
        content.Sections = ExtractSections(mainPart);

        // Extract default tab stops
        content.DefaultTabStops = ExtractDefaultTabStops(mainPart);

        // Extract footnotes and endnotes
        ExtractFootnotesAndEndnotes(wordDocument, content);

        // Extract bookmarks
        ExtractBookmarks(mainPart, content);

        // Extract document properties
        content.DocumentProperties = ExtractDocumentProperties(wordDocument);

        // Extract watermark
        content.Watermark = ExtractWatermark(mainPart);

        // Extract comments
        ExtractComments(wordDocument, content);

        // Extract text boxes and shapes
        ExtractTextBoxesAndShapes(mainPart, content);

        // ========================
        // NEW ADVANCED EXTRACTIONS
        // ========================

        // Extract math equations
        ExtractMathEquations(mainPart, content);

        // Extract charts
        ExtractCharts(mainPart, content);

        // Extract SmartArt diagrams
        ExtractSmartArt(mainPart, content);

        // Extract form fields
        ExtractFormFields(mainPart, content);

        // Extract content controls (SDTs)
        ExtractContentControls(mainPart, content);

        // Extract tracked changes/revisions
        ExtractRevisions(mainPart, content);

        // Extract document theme
        ExtractTheme(wordDocument, content);

        // Extract styles
        ExtractStyles(mainPart, content);

        // Extract table of contents
        ExtractTableOfContents(mainPart, content);

        // Extract bibliography
        ExtractBibliography(wordDocument, content);

        // Extract custom XML
        ExtractCustomXml(wordDocument, content);

        // Extract embedded objects
        ExtractEmbeddedObjects(mainPart, content);

        // Process document body elements
        foreach (var element in mainPart.Document.Body.Elements())
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (element is Paragraph paragraph)
            {
                // Check for page break in paragraph
                var pageBreak = ExtractPageBreakFromParagraph(paragraph);
                if (pageBreak != null)
                {
                    content.Elements.Add(pageBreak);
                }

                var parsedParagraph = ParseParagraph(paragraph, mainPart);
                if (parsedParagraph != null)
                {
                    content.Elements.Add(parsedParagraph);
                }
            }
            else if (element is Table table)
            {
                var parsedTable = ParseTableEnhanced(table, mainPart);
                if (parsedTable != null)
                {
                    content.Elements.Add(parsedTable);
                }
            }
        }

        return Task.FromResult(content);
    }
}
