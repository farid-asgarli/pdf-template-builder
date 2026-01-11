using System.Text;
using System.Text.Json;
using System.Web;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Central dispatcher for rendering components to HTML by type.
/// </summary>
public static class HtmlComponentRenderer
{
    /// <summary>
    /// Renders a component based on its type.
    /// </summary>
    public static void Render(
        StringBuilder sb,
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
                HtmlTextLabelRenderer.Render(
                    sb,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "text-field":
                HtmlTextFieldRenderer.Render(
                    sb,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "signature-box":
                HtmlSignatureBoxRenderer.Render(sb, component.Properties);
                break;
            case "date-field":
                HtmlDateFieldRenderer.Render(
                    sb,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "checkbox":
                HtmlCheckboxRenderer.Render(sb, component.Properties);
                break;
            case "paragraph":
                HtmlParagraphRenderer.Render(
                    sb,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "divider":
                HtmlDividerRenderer.Render(sb, component.Properties);
                break;
            case "table":
                HtmlTableRenderer.Render(
                    sb,
                    component.Properties,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                break;
            case "image":
                HtmlImageRenderer.Render(sb, component.Properties);
                break;
            case "barcode":
                HtmlBarcodeRenderer.Render(sb, component.Properties);
                break;
            case "placeholder":
                RenderPlaceholder(sb, component.Properties);
                break;
            default:
                sb.AppendLine(
                    $"<div class=\"placeholder-component\">Unknown: {HttpUtility.HtmlEncode(component.Type)}</div>"
                );
                break;
        }
    }

    /// <summary>
    /// Renders a placeholder component with configurable variant.
    /// </summary>
    private static void RenderPlaceholder(
        StringBuilder sb,
        Dictionary<string, JsonElement> properties
    )
    {
        var label = HtmlPropertyHelpers.GetString(properties, "label", "Placeholder");
        var variant = HtmlPropertyHelpers.GetString(properties, "variant", "default");

        var bgColor = variant.ToLowerInvariant() switch
        {
            "error" => "#fee2e2",
            "warning" => "#fef3c7",
            "info" => "#dbeafe",
            _ => "#f3f4f6",
        };

        var borderColor = variant.ToLowerInvariant() switch
        {
            "error" => "#ef4444",
            "warning" => "#f59e0b",
            "info" => "#3b82f6",
            _ => "#9ca3af",
        };

        var textColor = variant.ToLowerInvariant() switch
        {
            "error" => "#dc2626",
            "warning" => "#d97706",
            "info" => "#2563eb",
            _ => "#6b7280",
        };

        sb.AppendLine(
            $"<div class=\"placeholder-component\" style=\"background: {bgColor}; border-color: {borderColor}; color: {textColor};\">"
        );
        sb.AppendLine($"  {HttpUtility.HtmlEncode(label)}");
        sb.AppendLine("</div>");
    }
}
