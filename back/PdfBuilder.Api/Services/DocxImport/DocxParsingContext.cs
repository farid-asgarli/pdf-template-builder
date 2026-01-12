using DocumentFormat.OpenXml.Packaging;
using PdfBuilder.Api.DTOs.Documents;

namespace PdfBuilder.Api.Services.DocxImport;

/// <summary>
/// Context object that holds state during DOCX parsing.
/// Provides access to the document parts and caches.
/// </summary>
public class DocxParsingContext
{
    /// <summary>The main document part being parsed</summary>
    public required MainDocumentPart MainPart { get; init; }

    /// <summary>The word document being parsed</summary>
    public required WordprocessingDocument WordDocument { get; init; }

    /// <summary>Cache of numbering definitions indexed by numId</summary>
    public Dictionary<int, NumberingDefinition> NumberingCache { get; set; } = [];

    /// <summary>Tracks the current state of list numbering for sequential markers</summary>
    public NumberingState NumberingState { get; set; } = new();

    /// <summary>Map of hyperlink relationship IDs to URLs</summary>
    public Dictionary<string, ParsedDocxHyperlink> HyperlinkMap { get; set; } = [];

    /// <summary>Map of image relationship IDs to image parts</summary>
    public Dictionary<string, ImagePart> ImagePartsMap { get; set; } = [];

    /// <summary>The parsed content being built</summary>
    public ParsedDocxContent Content { get; } = new();
}
