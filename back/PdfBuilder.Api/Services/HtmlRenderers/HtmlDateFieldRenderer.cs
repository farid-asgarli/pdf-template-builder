using System.Text;
using System.Text.Json;
using System.Web;
using PdfBuilder.Api.Services.Renderers;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders date field components to HTML.
/// </summary>
public static class HtmlDateFieldRenderer
{
    public static void Render(
        StringBuilder sb,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        var label = HtmlPropertyHelpers.GetString(properties, "label", "Date");
        var fieldName = HtmlPropertyHelpers.GetString(properties, "fieldName", "date_field");
        var format = HtmlPropertyHelpers.GetString(properties, "format", "MM/DD/YYYY");
        var required = HtmlPropertyHelpers.GetBool(properties, "required", false);

        // Label styling
        var labelFontSize = HtmlPropertyHelpers.GetFloat(properties, "labelFontSize", 11);
        var labelColor = HtmlPropertyHelpers.GetString(properties, "labelColor", "#374151");
        var labelFontWeight = HtmlPropertyHelpers.GetString(
            properties,
            "labelFontWeight",
            "medium"
        );

        // Input styling
        var fontSize = HtmlPropertyHelpers.GetFloat(properties, "fontSize", 12);
        var inputHeight = HtmlPropertyHelpers.GetFloat(properties, "inputHeight", 10);
        var inputPadding = HtmlPropertyHelpers.GetFloat(properties, "inputPadding", 8);

        // Border styling
        var borderWidth = HtmlPropertyHelpers.GetFloat(properties, "borderWidth", 1);
        var borderColor = HtmlPropertyHelpers.GetString(properties, "borderColor", "#d1d5db");
        var borderRadius = HtmlPropertyHelpers.GetFloat(properties, "borderRadius", 4);

        // Colors
        var backgroundColor = HtmlPropertyHelpers.GetString(
            properties,
            "backgroundColor",
            "#ffffff"
        );
        var placeholderColor = HtmlPropertyHelpers.GetString(
            properties,
            "placeholderColor",
            "#9ca3af"
        );

        // Icon
        var showIcon = HtmlPropertyHelpers.GetBool(properties, "showIcon", true);
        var iconColor = HtmlPropertyHelpers.GetString(properties, "iconColor", "#6b7280");

        // Substitute variables
        var processedLabel = TextHelpers.SubstituteVariables(
            label,
            pageNumber,
            totalPages,
            variables,
            complexVariables
        );

        sb.AppendLine("<div class=\"date-field-component\" style=\"width: 100%; height: 100%;\">");

        // Label
        var labelStyle =
            $"font-size: {labelFontSize}pt; color: {labelColor}; font-weight: {HtmlPropertyHelpers.GetCssFontWeight(labelFontWeight)}; margin-bottom: 4pt;";
        sb.AppendLine($"  <label style=\"{labelStyle}\">");
        sb.Append($"    {HttpUtility.HtmlEncode(processedLabel)}");
        if (required)
        {
            sb.Append(" <span style=\"color: #ef4444;\">*</span>");
        }
        sb.AppendLine();
        sb.AppendLine("  </label>");

        // Date input representation
        var inputStyle =
            $"min-height: {inputHeight}mm; padding: {inputPadding}pt; border: {borderWidth}px solid {borderColor}; border-radius: {borderRadius}px; background: {backgroundColor}; font-size: {fontSize}pt; display: flex; align-items: center; justify-content: space-between;";
        sb.AppendLine($"  <div class=\"date-field-input\" style=\"{inputStyle}\">");
        sb.AppendLine(
            $"    <span style=\"color: {placeholderColor};\">{HttpUtility.HtmlEncode(format)}</span>"
        );

        if (showIcon)
        {
            // Calendar icon SVG
            sb.AppendLine(
                $"    <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"{iconColor}\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">"
            );
            sb.AppendLine(
                "      <rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect>"
            );
            sb.AppendLine("      <line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"></line>");
            sb.AppendLine("      <line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"></line>");
            sb.AppendLine("      <line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"></line>");
            sb.AppendLine("    </svg>");
        }

        sb.AppendLine("  </div>");
        sb.AppendLine("</div>");
    }
}
