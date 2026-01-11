using System.Text;
using System.Text.Json;
using PdfBuilder.Api.Services.HtmlRenderers;

namespace PdfBuilder.Api.Services;

/// <summary>
/// HTML generation service that converts document JSON content into HTML.
/// Mirrors the PdfGenerator structure for consistency.
/// </summary>
public static class HtmlGenerator
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Generate HTML from document JSON content with default settings.
    /// </summary>
    public static string Generate(string jsonContent)
    {
        return Generate(jsonContent, null, null);
    }

    /// <summary>
    /// Generate HTML from document JSON content with custom settings.
    /// </summary>
    public static string Generate(string jsonContent, HtmlGenerationSettings? settings)
    {
        return Generate(jsonContent, settings, null);
    }

    /// <summary>
    /// Generate HTML from document JSON content with custom settings and runtime variables.
    /// </summary>
    public static string Generate(
        string jsonContent,
        HtmlGenerationSettings? settings,
        Dictionary<string, object>? runtimeVariables
    )
    {
        var data = ParseDocumentData(jsonContent);

        if (data?.Pages == null || data.Pages.Count == 0)
        {
            return GenerateEmptyDocument(settings);
        }

        // Apply global settings to pages
        ApplyGlobalSettings(data);

        // Merge runtime variables with document variables
        if (runtimeVariables != null || data.VariableDefinitions.Count > 0)
        {
            data.Variables = VariableService.MergeVariables(
                data.VariableDefinitions,
                data.Variables,
                runtimeVariables
            );

            data.ComplexVariables = VariableService.ExtractComplexVariables(runtimeVariables);

            data.Variables = VariableService.EvaluateComputedVariables(
                data.VariableDefinitions,
                data.Variables,
                data.ComplexVariables
            );
        }

        return GenerateHtmlDocument(data, settings);
    }

    /// <summary>
    /// Generate a simple empty HTML document.
    /// </summary>
    private static string GenerateEmptyDocument(HtmlGenerationSettings? settings)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"en\">");
        sb.AppendLine("<head>");
        sb.AppendLine("  <meta charset=\"UTF-8\">");
        sb.AppendLine(
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
        );
        sb.AppendLine($"  <title>{settings?.Title ?? "Document"}</title>");
        sb.AppendLine(GenerateBaseStyles());
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("  <div class=\"document\">");
        sb.AppendLine("    <div class=\"page\">");
        sb.AppendLine("      <p>Empty document</p>");
        sb.AppendLine("    </div>");
        sb.AppendLine("  </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");
        return sb.ToString();
    }

    /// <summary>
    /// Generate the full HTML document from parsed data.
    /// </summary>
    private static string GenerateHtmlDocument(DocumentData data, HtmlGenerationSettings? settings)
    {
        var sb = new StringBuilder();

        // Document header
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"en\">");
        sb.AppendLine("<head>");
        sb.AppendLine("  <meta charset=\"UTF-8\">");
        sb.AppendLine(
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
        );
        sb.AppendLine($"  <title>{settings?.Title ?? "Document"}</title>");

        // Include embedded styles
        sb.AppendLine(GenerateBaseStyles());
        sb.AppendLine(GenerateComponentStyles());

        // Include print styles if requested
        if (settings?.IncludePrintStyles ?? true)
        {
            sb.AppendLine(GeneratePrintStyles());
        }

        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("  <div class=\"document\">");

        // Render each page
        var totalPages = data.Pages.Count;
        foreach (var page in data.Pages)
        {
            RenderPage(sb, page, data, totalPages, settings);
        }

        sb.AppendLine("  </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");

        return sb.ToString();
    }

    /// <summary>
    /// Render a single page with header, content, and footer.
    /// </summary>
    private static void RenderPage(
        StringBuilder sb,
        PageData page,
        DocumentData data,
        int totalPages,
        HtmlGenerationSettings? settings
    )
    {
        var pageSettings = page.PageSettings ?? new PageSettings();
        var pageSize = GetPageSize(pageSettings);

        sb.AppendLine(
            $"    <div class=\"page\" style=\"width: {pageSize.Width}mm; min-height: {pageSize.Height}mm; background-color: {pageSettings.BackgroundColor}; direction: {pageSettings.ContentDirection};\">"
        );

        // Page margins container
        var margins = pageSettings.Margins ?? new PageMargins();
        sb.AppendLine(
            $"      <div class=\"page-content\" style=\"padding: {margins.Top}mm {margins.Right}mm {margins.Bottom}mm {margins.Left}mm;\">"
        );

        // Render header
        var header = GetHeaderContent(page, data.HeaderFooter);
        if (header != null && header.Components.Count > 0)
        {
            sb.AppendLine(
                $"        <header class=\"page-header\" style=\"min-height: {header.Height}mm;\">"
            );
            RenderHeaderFooterComponents(
                sb,
                header.Components,
                page.PageNumber,
                totalPages,
                data.Variables,
                data.ComplexVariables
            );
            sb.AppendLine("        </header>");
        }

        // Render main content area
        sb.AppendLine("        <main class=\"page-main\">");
        RenderComponents(
            sb,
            page.Components,
            page.PageNumber,
            totalPages,
            data.Variables,
            data.ComplexVariables
        );
        sb.AppendLine("        </main>");

        // Render footer
        var footer = GetFooterContent(page, data.HeaderFooter);
        if (footer != null && footer.Components.Count > 0)
        {
            sb.AppendLine(
                $"        <footer class=\"page-footer\" style=\"min-height: {footer.Height}mm;\">"
            );
            RenderHeaderFooterComponents(
                sb,
                footer.Components,
                page.PageNumber,
                totalPages,
                data.Variables,
                data.ComplexVariables
            );
            sb.AppendLine("        </footer>");
        }

        sb.AppendLine("      </div>");
        sb.AppendLine("    </div>");
    }

    /// <summary>
    /// Render components within a page using absolute positioning.
    /// </summary>
    private static void RenderComponents(
        StringBuilder sb,
        List<ComponentData> components,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        foreach (var component in components)
        {
            var style =
                $"position: absolute; left: {component.Position.X}mm; top: {component.Position.Y}mm; width: {component.Size.Width}mm; height: {component.Size.Height}mm;";
            sb.AppendLine(
                $"          <div class=\"component component-{component.Type}\" style=\"{style}\">"
            );
            HtmlComponentRenderer.Render(
                sb,
                component,
                pageNumber,
                totalPages,
                variables,
                complexVariables
            );
            sb.AppendLine("          </div>");
        }
    }

    /// <summary>
    /// Render header/footer components.
    /// </summary>
    private static void RenderHeaderFooterComponents(
        StringBuilder sb,
        List<ComponentData> components,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        foreach (var component in components)
        {
            var style =
                $"position: absolute; left: {component.Position.X}mm; top: {component.Position.Y}mm; width: {component.Size.Width}mm; height: {component.Size.Height}mm;";
            sb.AppendLine(
                $"            <div class=\"component component-{component.Type}\" style=\"{style}\">"
            );
            HtmlComponentRenderer.Render(
                sb,
                component,
                pageNumber,
                totalPages,
                variables,
                complexVariables
            );
            sb.AppendLine("            </div>");
        }
    }

    /// <summary>
    /// Get the header content for a page based on its header type.
    /// </summary>
    private static HeaderFooterContent? GetHeaderContent(PageData page, HeaderFooterConfig config)
    {
        return page.HeaderType?.ToLowerInvariant() switch
        {
            "none" => null,
            "first-page" => config.FirstPageHeader ?? config.DefaultHeader,
            "compact" => config.CompactHeader ?? config.DefaultHeader,
            _ => config.DefaultHeader,
        };
    }

    /// <summary>
    /// Get the footer content for a page based on its footer type.
    /// </summary>
    private static HeaderFooterContent? GetFooterContent(PageData page, HeaderFooterConfig config)
    {
        return page.FooterType?.ToLowerInvariant() switch
        {
            "none" => null,
            "first-page" => config.FirstPageFooter ?? config.DefaultFooter,
            "compact" => config.CompactFooter ?? config.DefaultFooter,
            _ => config.DefaultFooter,
        };
    }

    /// <summary>
    /// Get page dimensions based on settings.
    /// </summary>
    private static (double Width, double Height) GetPageSize(PageSettings settings)
    {
        var size = settings.PredefinedSize?.ToLowerInvariant() switch
        {
            "a3" => (297.0, 420.0),
            "a4" => (210.0, 297.0),
            "a5" => (148.0, 210.0),
            "letter" => (215.9, 279.4),
            "legal" => (215.9, 355.6),
            "ledger" => (279.4, 431.8),
            "tabloid" => (279.4, 431.8),
            "executive" => (184.15, 266.7),
            "custom" when settings.Width > 0 && settings.Height > 0 => (
                settings.Width,
                settings.Height
            ),
            _ => (210.0, 297.0), // Default to A4
        };

        // Apply orientation
        if (settings.Orientation?.ToLowerInvariant() == "landscape")
        {
            return (size.Item2, size.Item1);
        }

        return size;
    }

    /// <summary>
    /// Generate base CSS styles for the HTML document.
    /// </summary>
    private static string GenerateBaseStyles()
    {
        return @"  <style>
    /* Reset and base styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #1c1b1f;
      background: #f5f5f5;
    }

    .document {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px;
    }

    .page {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: relative;
      page-break-after: always;
      overflow: hidden;
    }

    .page-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .page-header,
    .page-footer {
      position: relative;
      flex-shrink: 0;
    }

    .page-main {
      position: relative;
      flex-grow: 1;
    }

    .component {
      overflow: hidden;
    }
  </style>";
    }

    /// <summary>
    /// Generate component-specific CSS styles.
    /// </summary>
    private static string GenerateComponentStyles()
    {
        return @"  <style>
    /* Text components */
    .text-label, .paragraph {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Table styles */
    .table-component {
      width: 100%;
      border-collapse: collapse;
    }

    .table-component th,
    .table-component td {
      text-align: left;
    }

    /* Checkbox styles */
    .checkbox-component {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .checkbox-box {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* Signature box styles */
    .signature-box {
      display: flex;
      flex-direction: column;
    }

    .signature-line {
      border-bottom-style: solid;
    }

    /* Text field styles */
    .text-field-component {
      display: flex;
      flex-direction: column;
    }

    .text-field-input {
      border-style: solid;
    }

    /* Date field styles */
    .date-field-component {
      display: flex;
      flex-direction: column;
    }

    /* Divider styles */
    .divider-horizontal {
      width: 100%;
    }

    .divider-vertical {
      height: 100%;
    }

    /* Image styles */
    .image-component img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* Barcode styles */
    .barcode-component {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .barcode-component svg {
      max-width: 100%;
      max-height: 100%;
    }

    /* Placeholder styles */
    .placeholder-component {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed #ccc;
      background: #f9f9f9;
      color: #666;
      font-size: 12px;
    }
  </style>";
    }

    /// <summary>
    /// Generate print-specific CSS styles.
    /// </summary>
    private static string GeneratePrintStyles()
    {
        return @"  <style media=""print"">
    @page {
      margin: 0;
    }

    body {
      background: white;
    }

    .document {
      padding: 0;
      gap: 0;
    }

    .page {
      box-shadow: none;
      margin: 0;
      page-break-after: always;
      page-break-inside: avoid;
    }

    .page:last-child {
      page-break-after: auto;
    }
  </style>";
    }

    #region Parsing

    private static DocumentData? ParseDocumentData(string jsonContent)
    {
        try
        {
            return JsonSerializer.Deserialize<DocumentData>(jsonContent, JsonOptions);
        }
        catch
        {
            return TryParseLegacyFormat(jsonContent);
        }
    }

    private static DocumentData? TryParseLegacyFormat(string jsonContent)
    {
        try
        {
            var legacyDoc = JsonSerializer.Deserialize<LegacyDocument>(jsonContent, JsonOptions);
            if (legacyDoc?.Components != null && legacyDoc.Components.Count > 0)
            {
                return new DocumentData
                {
                    Pages =
                    [
                        new PageData
                        {
                            Id = "page-1",
                            PageNumber = 1,
                            Components = legacyDoc.Components,
                            PageSettings = new PageSettings
                            {
                                PredefinedSize = "a4",
                                Orientation = "portrait",
                            },
                        },
                    ],
                };
            }
        }
        catch
        {
            // Ignore parsing errors
        }

        return null;
    }

    private class LegacyDocument
    {
        public List<ComponentData> Components { get; set; } = [];
    }

    #endregion

    #region Settings Application

    private static void ApplyGlobalSettings(DocumentData data)
    {
        var globalSettings = data.Settings;

        foreach (var page in data.Pages)
        {
            page.PageSettings ??= new PageSettings();

            if (globalSettings != null)
            {
                page.PageSettings.PredefinedSize ??= globalSettings.PredefinedSize;
                page.PageSettings.Orientation ??= globalSettings.Orientation;

                if (string.IsNullOrEmpty(page.PageSettings.BackgroundColor))
                {
                    page.PageSettings.BackgroundColor = globalSettings.BackgroundColor;
                }

                if (string.IsNullOrEmpty(page.PageSettings.ContentDirection))
                {
                    page.PageSettings.ContentDirection = globalSettings.ContentDirection;
                }

                page.PageSettings.Margins ??= new PageMargins();
                if (page.PageSettings.Margins.Top == 0 && globalSettings.Margins?.Top > 0)
                {
                    page.PageSettings.Margins.Top = globalSettings.Margins.Top;
                }
                if (page.PageSettings.Margins.Right == 0 && globalSettings.Margins?.Right > 0)
                {
                    page.PageSettings.Margins.Right = globalSettings.Margins.Right;
                }
                if (page.PageSettings.Margins.Bottom == 0 && globalSettings.Margins?.Bottom > 0)
                {
                    page.PageSettings.Margins.Bottom = globalSettings.Margins.Bottom;
                }
                if (page.PageSettings.Margins.Left == 0 && globalSettings.Margins?.Left > 0)
                {
                    page.PageSettings.Margins.Left = globalSettings.Margins.Left;
                }
            }

            page.PageSettings.PredefinedSize ??= "a4";
            page.PageSettings.Orientation ??= "portrait";
            page.PageSettings.BackgroundColor ??= "#FFFFFF";
            page.PageSettings.ContentDirection ??= "ltr";
            page.PageSettings.Margins ??= new PageMargins();
        }
    }

    #endregion
}

/// <summary>
/// Settings for HTML generation.
/// </summary>
public class HtmlGenerationSettings
{
    /// <summary>
    /// Document title for the HTML head.
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Whether to include print-optimized styles.
    /// </summary>
    public bool IncludePrintStyles { get; set; } = true;

    /// <summary>
    /// Whether to inline all styles (for email compatibility).
    /// </summary>
    public bool InlineStyles { get; set; } = false;

    /// <summary>
    /// Whether to include external font links.
    /// </summary>
    public bool IncludeFontLinks { get; set; } = true;
}
