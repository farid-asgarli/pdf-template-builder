namespace PdfBuilder.Api.DTOs.Html;

// ========================
// HTML Generation DTOs
// ========================

/// <summary>
/// Request to generate HTML with runtime variables.
/// </summary>
public record GenerateHtmlWithVariablesRequest(
    /// <summary>
    /// Variable values to substitute in the document.
    /// </summary>
    Dictionary<string, object>? Variables = null,
    /// <summary>
    /// If true, return HTML as a file download. Otherwise returns inline content.
    /// </summary>
    bool AsDownload = false,
    /// <summary>
    /// If true, includes print-optimized CSS styles.
    /// </summary>
    bool IncludePrintStyles = true,
    /// <summary>
    /// If true, inlines all CSS styles (useful for email compatibility).
    /// </summary>
    bool InlineStyles = false,
    /// <summary>
    /// Whether to include Google Fonts links. Defaults to true.
    /// </summary>
    bool IncludeFontLinks = true,
    /// <summary>
    /// Additional font families to include from Google Fonts.
    /// Example: ["Inter", "Roboto", "Open Sans"]
    /// </summary>
    List<string>? FontFamilies = null,
    /// <summary>
    /// Whether to auto-detect fonts used in the document. Defaults to true.
    /// </summary>
    bool AutoDetectFonts = true
);

/// <summary>
/// Request to generate HTML preview from content (without saving).
/// </summary>
public record GenerateHtmlPreviewRequest(
    /// <summary>
    /// The document JSON content.
    /// </summary>
    string Content,
    /// <summary>
    /// Optional document title for the HTML head.
    /// </summary>
    string? Title = null,
    /// <summary>
    /// Variable values to substitute.
    /// </summary>
    Dictionary<string, object>? Variables = null,
    /// <summary>
    /// If true, includes print-optimized CSS styles.
    /// </summary>
    bool? IncludePrintStyles = true,
    /// <summary>
    /// If true, inlines all CSS styles.
    /// </summary>
    bool? InlineStyles = false,
    /// <summary>
    /// Whether to include Google Fonts links. Defaults to true.
    /// </summary>
    bool? IncludeFontLinks = true,
    /// <summary>
    /// Additional font families to include from Google Fonts.
    /// </summary>
    List<string>? FontFamilies = null,
    /// <summary>
    /// Whether to auto-detect fonts used in the document. Defaults to true.
    /// </summary>
    bool? AutoDetectFonts = true
);
