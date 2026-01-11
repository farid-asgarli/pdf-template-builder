using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services;

/// <summary>
/// QuestPDF document implementation that renders from DocumentData.
/// Follows QuestPDF IDocument pattern for clean document generation.
/// </summary>
public class PdfDocument : IDocument
{
    private readonly DocumentData _data;
    private readonly PdfGenerationSettings _settings;

    public PdfDocument(DocumentData data, PdfGenerationSettings? settings = null)
    {
        _data = data ?? throw new ArgumentNullException(nameof(data));
        _settings = settings ?? new PdfGenerationSettings();
    }

    public DocumentMetadata GetMetadata() =>
        new()
        {
            Title = _settings.Title,
            Author = _settings.Author,
            Subject = _settings.Subject,
            Keywords = _settings.Keywords,
            CreationDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
        };

    public DocumentSettings GetSettings() =>
        new()
        {
            CompressDocument = _settings.CompressDocument,
            ImageCompressionQuality = _settings.ImageCompressionQuality,
            ImageRasterDpi = _settings.ImageRasterDpi,
            ContentDirection = _settings.ContentDirection,
        };

    public void Compose(IDocumentContainer container)
    {
        var totalPages = _data.Pages.Count;
        var variables = _data.Variables ?? [];
        var complexVariables = _data.ComplexVariables ?? [];

        foreach (var pageData in _data.Pages.OrderBy(p => p.PageNumber))
        {
            container.Page(page =>
            {
                // Configure page settings
                ConfigurePageSettings(page, pageData);

                // Render header if configured
                RenderHeader(page, pageData, totalPages, variables, complexVariables);

                // Render footer if configured
                RenderFooter(page, pageData, totalPages, variables, complexVariables);

                // Render main content with components (with variable substitution)
                RenderContent(
                    page,
                    pageData,
                    pageData.PageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
            });
        }
    }

    #region Page Configuration

    private void ConfigurePageSettings(PageDescriptor page, PageData pageData)
    {
        // Apply page size and orientation
        var pageSize = GetPageSize(pageData.PageSettings);
        page.Size(pageSize);

        // Set page background color
        page.PageColor(pageData.PageSettings?.BackgroundColor ?? Colors.White);

        // Apply margins
        var margins = pageData.PageSettings?.Margins ?? new PageMargins();
        page.MarginLeft((float)margins.Left, Unit.Millimetre);
        page.MarginRight((float)margins.Right, Unit.Millimetre);
        page.MarginTop((float)margins.Top, Unit.Millimetre);
        page.MarginBottom((float)margins.Bottom, Unit.Millimetre);

        // Apply default text style
        page.DefaultTextStyle(x =>
            x.FontFamily(_settings.DefaultFontFamily).FontSize(_settings.DefaultFontSize)
        );

        // Apply content direction
        if (pageData.PageSettings?.ContentDirection == "rtl")
        {
            page.ContentFromRightToLeft();
        }
        else
        {
            page.ContentFromLeftToRight();
        }
    }

    private static PageSize GetPageSize(PageSettings? settings)
    {
        if (settings == null)
            return PageSizes.A4;

        // Get base page size
        PageSize pageSize;

        var isCustom =
            settings.PredefinedSize?.ToLowerInvariant() == "custom"
            && settings.Width > 0
            && settings.Height > 0;

        if (isCustom)
        {
            pageSize = new PageSize((float)settings.Width, (float)settings.Height, Unit.Millimetre);
        }
        else
        {
            pageSize = settings.PredefinedSize?.ToLowerInvariant() switch
            {
                "a3" => PageSizes.A3,
                "a5" => PageSizes.A5,
                "letter" => PageSizes.Letter,
                "legal" => PageSizes.Legal,
                "ledger" => PageSizes.Ledger,
                "tabloid" => PageSizes.Tabloid,
                "executive" => PageSizes.Executive,
                _ => PageSizes.A4, // Default to A4
            };
        }

        // Apply orientation
        return settings.Orientation?.ToLowerInvariant() == "landscape"
            ? pageSize.Landscape()
            : pageSize.Portrait();
    }

    #endregion

    #region Header/Footer Rendering

    private void RenderHeader(
        PageDescriptor page,
        PageData pageData,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        var headerContent = GetHeaderContent(pageData.HeaderType);

        if (headerContent == null || pageData.HeaderType == "none" || headerContent.Height <= 0)
            return;

        page.Header()
            .Height((float)headerContent.Height, Unit.Millimetre)
            .Element(container =>
                RenderHeaderFooterComponents(
                    container,
                    headerContent,
                    pageData.PageNumber,
                    totalPages,
                    variables,
                    complexVariables
                )
            );
    }

    private void RenderFooter(
        PageDescriptor page,
        PageData pageData,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        var footerContent = GetFooterContent(pageData.FooterType);

        if (footerContent == null || pageData.FooterType == "none" || footerContent.Height <= 0)
            return;

        page.Footer()
            .Height((float)footerContent.Height, Unit.Millimetre)
            .Element(container =>
                RenderHeaderFooterComponents(
                    container,
                    footerContent,
                    pageData.PageNumber,
                    totalPages,
                    variables,
                    complexVariables
                )
            );
    }

    private HeaderFooterContent? GetHeaderContent(string headerType)
    {
        return headerType.ToLowerInvariant() switch
        {
            "none" => null,
            "firstpage" => _data.HeaderFooter.FirstPageHeader ?? _data.HeaderFooter.DefaultHeader,
            "compact" => _data.HeaderFooter.CompactHeader ?? _data.HeaderFooter.DefaultHeader,
            _ => _data.HeaderFooter.DefaultHeader,
        };
    }

    private HeaderFooterContent? GetFooterContent(string footerType)
    {
        return footerType.ToLowerInvariant() switch
        {
            "none" => null,
            "firstpage" => _data.HeaderFooter.FirstPageFooter ?? _data.HeaderFooter.DefaultFooter,
            "compact" => _data.HeaderFooter.CompactFooter ?? _data.HeaderFooter.DefaultFooter,
            _ => _data.HeaderFooter.DefaultFooter,
        };
    }

    private static void RenderHeaderFooterComponents(
        IContainer container,
        HeaderFooterContent content,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        if (content.Components.Count == 0)
            return;

        container.Layers(layers =>
        {
            // Render each component as a layer with absolute positioning
            foreach (var component in content.Components)
            {
                layers
                    .Layer()
                    .TranslateX((float)component.Position.X, Unit.Millimetre)
                    .TranslateY((float)component.Position.Y, Unit.Millimetre)
                    .Width((float)component.Size.Width, Unit.Millimetre)
                    .Height((float)component.Size.Height, Unit.Millimetre)
                    .Element(c =>
                        Renderers.ComponentRenderer.RenderWithVariables(
                            c,
                            component,
                            pageNumber,
                            totalPages,
                            variables,
                            complexVariables
                        )
                    );
            }

            // Primary layer is required
            layers.PrimaryLayer();
        });
    }

    #endregion

    #region Content Rendering

    private void RenderContent(
        PageDescriptor page,
        PageData pageData,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        page.Content()
            .Element(container =>
                RenderComponents(
                    container,
                    pageData.Components,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                )
            );
    }

    private static void RenderComponents(
        IContainer container,
        List<ComponentData> components,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        if (components.Count == 0)
        {
            // Render empty placeholder for empty pages
            container.Text("");
            return;
        }

        container.Layers(layers =>
        {
            // Render each component as a layer with absolute positioning
            foreach (var component in components)
            {
                layers
                    .Layer()
                    .TranslateX((float)component.Position.X, Unit.Millimetre)
                    .TranslateY((float)component.Position.Y, Unit.Millimetre)
                    .Width((float)component.Size.Width, Unit.Millimetre)
                    .Height((float)component.Size.Height, Unit.Millimetre)
                    .Element(c =>
                        Renderers.ComponentRenderer.RenderWithVariables(
                            c,
                            component,
                            pageNumber,
                            totalPages,
                            variables,
                            complexVariables
                        )
                    );
            }

            // Primary layer is required by QuestPDF
            layers.PrimaryLayer();
        });
    }

    #endregion
}

/// <summary>
/// Settings for PDF generation.
/// </summary>
public class PdfGenerationSettings
{
    // Document metadata
    public string Title { get; set; } = "Generated Document";
    public string Author { get; set; } = "PDF Builder";
    public string Subject { get; set; } = "";
    public string Keywords { get; set; } = "";

    // Compression and quality
    public bool CompressDocument { get; set; } = true;
    public ImageCompressionQuality ImageCompressionQuality { get; set; } =
        ImageCompressionQuality.High;
    public int ImageRasterDpi { get; set; } = 288;

    // Content direction
    public ContentDirection ContentDirection { get; set; } = ContentDirection.LeftToRight;

    // Default text style
    public string DefaultFontFamily { get; set; } = "Inter";
    public float DefaultFontSize { get; set; } = 11;
}
