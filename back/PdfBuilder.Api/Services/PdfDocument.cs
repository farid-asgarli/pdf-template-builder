using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services;

/// <summary>
/// QuestPDF document implementation that renders from DocumentData.
/// Follows QuestPDF IDocument pattern for clean document generation.
/// </summary>
public class PdfDocument(DocumentData data, PdfGenerationSettings? settings = null) : IDocument
{
    private readonly DocumentData _data = data ?? throw new ArgumentNullException(nameof(data));
    private readonly PdfGenerationSettings _settings = settings ?? new PdfGenerationSettings();

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

    private static void RenderContent(
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
                RenderComponentsWithAutoExpand(
                    container,
                    pageData.Components,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                )
            );
    }

    /// <summary>
    /// Renders components with support for auto-expansion.
    ///
    /// Strategy:
    /// - Separates components into auto-expand and fixed groups
    /// - Auto-expand components use MinHeight instead of fixed Height
    /// - Uses a Column layout to handle vertical flow for dependent components
    /// - Fixed components that don't depend on auto-expand use absolute positioning
    /// </summary>
    private static void RenderComponentsWithAutoExpand(
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
            container.Text("");
            return;
        }

        // Check if any component has auto-expand enabled
        var hasAutoExpand = components.Any(c => c.Layout?.AutoExpand == true);

        if (!hasAutoExpand)
        {
            // No auto-expand: use simple layer-based rendering
            RenderComponentsAsLayers(
                container,
                components,
                pageNumber,
                totalPages,
                variables,
                complexVariables
            );
            return;
        }

        // With auto-expand: use the layout engine approach
        RenderComponentsWithLayoutEngine(
            container,
            components,
            pageNumber,
            totalPages,
            variables,
            complexVariables
        );
    }

    /// <summary>
    /// Renders components using the layout engine for auto-expansion support.
    /// Uses a Column layout with positioned items to handle expansion and pushing.
    /// </summary>
    private static void RenderComponentsWithLayoutEngine(
        IContainer container,
        List<ComponentData> components,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        // Sort components by Y position, then X
        var sortedComponents = components
            .OrderBy(c => c.Position.Y)
            .ThenBy(c => c.Position.X)
            .ToList();

        // Build dependency graph: which components should be pushed when others expand
        var dependencyMap = BuildDependencyMap(sortedComponents);

        // Render using Layers but with dynamic height tracking
        // We use a combination of absolute positioning and shrink-to-fit
        container.Column(column =>
        {
            // We need to use an overlay approach
            // First, render non-expanding components as a base layer
            // Then, for each "expansion group", render in order

            // Group components by their dependency chains
            var groups = GroupComponentsByDependency(sortedComponents, dependencyMap);

            foreach (var group in groups)
            {
                if (group.Count == 1 && !(group[0].Layout?.AutoExpand ?? false))
                {
                    // Single non-expanding component: absolute position
                    column
                        .Item()
                        .Unconstrained()
                        .TranslateX((float)group[0].Position.X, Unit.Millimetre)
                        .TranslateY((float)group[0].Position.Y, Unit.Millimetre)
                        .Width((float)group[0].Size.Width, Unit.Millimetre)
                        .Height((float)group[0].Size.Height, Unit.Millimetre)
                        .Element(c =>
                            Renderers.ComponentRenderer.RenderWithVariables(
                                c,
                                group[0],
                                pageNumber,
                                totalPages,
                                variables,
                                complexVariables
                            )
                        );
                }
                else
                {
                    // Render the dependency chain
                    RenderDependencyChain(
                        column,
                        group,
                        pageNumber,
                        totalPages,
                        variables,
                        complexVariables
                    );
                }
            }
        });
    }

    /// <summary>
    /// Builds a map of component dependencies for auto-expansion.
    /// Key: component ID, Value: list of component IDs that should be pushed when key expands.
    /// </summary>
    private static Dictionary<string, List<string>> BuildDependencyMap(
        List<ComponentData> components
    )
    {
        var map = new Dictionary<string, List<string>>();

        foreach (var comp in components)
        {
            map[comp.Id] = [];

            // Only auto-expand components with push enabled affect others
            if (comp.Layout?.AutoExpand != true || comp.Layout?.PushSiblings != true)
            {
                continue;
            }

            // Find all components that should be pushed
            foreach (var other in components)
            {
                if (other.Id == comp.Id)
                    continue;

                if (LayoutEngine.ShouldPushDown(comp, other))
                {
                    map[comp.Id].Add(other.Id);
                }
            }
        }

        return map;
    }

    /// <summary>
    /// Groups components into dependency chains for proper rendering order.
    /// Components in the same chain are rendered together to handle expansion.
    /// </summary>
    private static List<List<ComponentData>> GroupComponentsByDependency(
        List<ComponentData> components,
        Dictionary<string, List<string>> dependencyMap
    )
    {
        var visited = new HashSet<string>();
        var groups = new List<List<ComponentData>>();
        var componentDict = components.ToDictionary(c => c.Id);

        foreach (var comp in components)
        {
            if (visited.Contains(comp.Id))
                continue;

            var group = new List<ComponentData>();
            CollectDependencyChain(comp, componentDict, dependencyMap, visited, group);

            if (group.Count > 0)
            {
                // Sort group by Y position
                group = group.OrderBy(c => c.Position.Y).ThenBy(c => c.Position.X).ToList();
                groups.Add(group);
            }
        }

        // Sort groups by the Y position of their first component
        return groups.OrderBy(g => g[0].Position.Y).ToList();
    }

    /// <summary>
    /// Recursively collects all components in a dependency chain.
    /// </summary>
    private static void CollectDependencyChain(
        ComponentData comp,
        Dictionary<string, ComponentData> componentDict,
        Dictionary<string, List<string>> dependencyMap,
        HashSet<string> visited,
        List<ComponentData> group
    )
    {
        if (visited.Contains(comp.Id))
            return;

        visited.Add(comp.Id);
        group.Add(comp);

        // Add all components that depend on this one
        if (dependencyMap.TryGetValue(comp.Id, out var dependents))
        {
            foreach (var depId in dependents)
            {
                if (componentDict.TryGetValue(depId, out var depComp))
                {
                    CollectDependencyChain(depComp, componentDict, dependencyMap, visited, group);
                }
            }
        }

        // Also check if any other component has this one as a dependent
        foreach (var kvp in dependencyMap)
        {
            if (
                kvp.Value.Contains(comp.Id)
                && componentDict.TryGetValue(kvp.Key, out var parentComp)
            )
            {
                CollectDependencyChain(parentComp, componentDict, dependencyMap, visited, group);
            }
        }
    }

    /// <summary>
    /// Renders a chain of dependent components.
    /// Auto-expand components use MinHeight, others use fixed Height.
    /// </summary>
    private static void RenderDependencyChain(
        ColumnDescriptor outerColumn,
        List<ComponentData> chain,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        // For a dependency chain, we need to render in a way that auto-expand
        // components can push down their dependents.

        // Use a layered approach within an unconstrained container
        // The first component positions the group, subsequent components
        // are positioned relative to the chain's anchor

        if (chain.Count == 0)
            return;

        var anchor = chain[0];
        var anchorBottom = anchor.Position.Y + anchor.Size.Height;

        outerColumn
            .Item()
            .Unconstrained()
            .TranslateX((float)anchor.Position.X, Unit.Millimetre)
            .TranslateY((float)anchor.Position.Y, Unit.Millimetre)
            .Column(chainColumn =>
            {
                double currentY = anchor.Position.Y;

                foreach (var comp in chain)
                {
                    // Calculate gap from previous component's expected bottom
                    var gap = comp.Position.Y - currentY;
                    if (gap > 0 && comp != anchor)
                    {
                        chainColumn.Item().Height((float)gap, Unit.Millimetre);
                    }

                    var isAutoExpand = comp.Layout?.AutoExpand == true;

                    if (isAutoExpand)
                    {
                        // Auto-expand: use MinHeight so content can grow
                        chainColumn
                            .Item()
                            .Width((float)comp.Size.Width, Unit.Millimetre)
                            .MinHeight((float)comp.Size.Height, Unit.Millimetre)
                            .TranslateX(
                                (float)(comp.Position.X - anchor.Position.X),
                                Unit.Millimetre
                            )
                            .Element(c =>
                                Renderers.ComponentRenderer.RenderWithVariables(
                                    c,
                                    comp,
                                    pageNumber,
                                    totalPages,
                                    variables,
                                    complexVariables
                                )
                            );
                    }
                    else
                    {
                        // Fixed height component
                        chainColumn
                            .Item()
                            .Width((float)comp.Size.Width, Unit.Millimetre)
                            .Height((float)comp.Size.Height, Unit.Millimetre)
                            .TranslateX(
                                (float)(comp.Position.X - anchor.Position.X),
                                Unit.Millimetre
                            )
                            .Element(c =>
                                Renderers.ComponentRenderer.RenderWithVariables(
                                    c,
                                    comp,
                                    pageNumber,
                                    totalPages,
                                    variables,
                                    complexVariables
                                )
                            );
                    }

                    // Update current Y for next component
                    currentY = comp.Position.Y + comp.Size.Height;
                }
            });
    }

    /// <summary>
    /// Original layer-based rendering for components without auto-expand.
    /// </summary>
    private static void RenderComponentsAsLayers(
        IContainer container,
        List<ComponentData> components,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
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
