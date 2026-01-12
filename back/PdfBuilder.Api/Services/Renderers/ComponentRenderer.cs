using System.Text.Json;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Central dispatcher for rendering components by type.
/// </summary>
public static class ComponentRenderer
{
    /// <summary>
    /// Renders a component based on its type.
    /// </summary>
    public static void Render(IContainer container, ComponentData component)
    {
        switch (component.Type.ToLowerInvariant())
        {
            case "text-label":
                TextLabelRenderer.Render(container, component.Properties);
                break;
            case "text-field":
                TextFieldRenderer.Render(container, component.Properties);
                break;
            case "signature-box":
                SignatureBoxRenderer.Render(container, component.Properties);
                break;
            case "date-field":
                DateFieldRenderer.Render(container, component.Properties);
                break;
            case "checkbox":
                CheckboxRenderer.Render(container, component.Properties);
                break;
            case "paragraph":
                ParagraphRenderer.Render(container, component.Properties);
                break;
            case "divider":
                DividerRenderer.Render(container, component.Properties);
                break;
            case "table":
                TableRenderer.Render(container, component.Properties);
                break;
            case "image":
                ImageRenderer.Render(container, component.Properties);
                break;
            case "barcode":
                BarcodeRenderer.Render(container, component.Properties);
                break;
            case "placeholder":
                RenderPlaceholder(container, component.Properties);
                break;
            default:
                // Unknown component type - render info placeholder
                PlaceholderRenderer.RenderInfo(container, $"Unknown: {component.Type}");
                break;
        }
    }

    /// <summary>
    /// Renders a placeholder component with configurable variant.
    /// </summary>
    private static void RenderPlaceholder(
        IContainer container,
        Dictionary<string, JsonElement> properties
    )
    {
        var label = PropertyHelpers.GetString(properties, "label", "Placeholder");
        var variant = PropertyHelpers.GetString(properties, "variant", "default");

        switch (variant.ToLowerInvariant())
        {
            case "error":
                PlaceholderRenderer.RenderError(container, label);
                break;
            case "warning":
                PlaceholderRenderer.RenderWarning(container, label);
                break;
            case "info":
                PlaceholderRenderer.RenderInfo(container, label);
                break;
            default:
                PlaceholderRenderer.Render(container, label);
                break;
        }
    }

    /// <summary>
    /// Renders a header/footer component with variable substitution support.
    /// </summary>
    public static void RenderHeaderFooter(
        IContainer container,
        ComponentData component,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables
    )
    {
        // Delegate to the shared variable-aware renderer (no complex variables)
        RenderWithVariables(container, component, pageNumber, totalPages, variables, null);
    }

    /// <summary>
    /// Renders any component with variable substitution support (simple variables only).
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        ComponentData component,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables
    )
    {
        RenderWithVariables(container, component, pageNumber, totalPages, variables, null);
    }

    /// <summary>
    /// Renders any component with full variable substitution support.
    /// Variables like {{variableName}} are replaced with their values.
    /// Built-in variables: {{pageNumber}}, {{totalPages}}, {{date}}, {{year}}
    /// Supports: conditionals ({{#if}}), loops ({{#each}}), inline formatting ({{var:format}})
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        ComponentData component,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        switch (component.Type.ToLowerInvariant())
        {
            case "text-label":
                TextLabelRenderer.RenderWithVariables(
                    container,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "paragraph":
                ParagraphRenderer.RenderWithVariables(
                    container,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "text-field":
                TextFieldRenderer.RenderWithVariables(
                    container,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "table":
                TableRenderer.RenderWithVariables(
                    container,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            // Components that don't typically need variable substitution
            case "signature-box":
                SignatureBoxRenderer.Render(container, component.Properties);
                break;
            case "date-field":
                DateFieldRenderer.Render(container, component.Properties);
                break;
            case "checkbox":
                CheckboxRenderer.Render(container, component.Properties);
                break;
            case "divider":
                DividerRenderer.Render(container, component.Properties);
                break;
            case "image":
                ImageRenderer.Render(container, component.Properties);
                break;
            case "barcode":
                BarcodeRenderer.RenderWithVariables(
                    container,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "placeholder":
                RenderPlaceholder(container, component.Properties);
                break;
            default:
                // Unknown component type - render info placeholder
                PlaceholderRenderer.RenderInfo(container, $"Unknown: {component.Type}");
                break;
        }
    }
}
