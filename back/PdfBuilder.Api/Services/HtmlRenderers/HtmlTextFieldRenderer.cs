using System.Text;
using System.Text.Json;
using System.Web;
using PdfBuilder.Api.Services.Renderers;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders text field (input) components to HTML.
/// </summary>
public static class HtmlTextFieldRenderer
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
        var label = HtmlPropertyHelpers.GetString(properties, "label", "Field");
        var fieldName = HtmlPropertyHelpers.GetString(properties, "fieldName", "field");
        var placeholder = HtmlPropertyHelpers.GetString(properties, "placeholder", "");
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
        var fontFamily = HtmlPropertyHelpers.GetString(properties, "fontFamily", "Inter");
        var inputHeight = HtmlPropertyHelpers.GetFloat(properties, "inputHeight", 10);
        var inputPaddingVertical = HtmlPropertyHelpers.GetFloat(
            properties,
            "inputPaddingVertical",
            8
        );
        var inputPaddingHorizontal = HtmlPropertyHelpers.GetFloat(
            properties,
            "inputPaddingHorizontal",
            12
        );

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

        // Layout
        var labelSpacing = HtmlPropertyHelpers.GetFloat(properties, "labelSpacing", 4);

        // Substitute variables
        var processedLabel = TextHelpers.SubstituteVariables(
            label,
            pageNumber,
            totalPages,
            variables,
            complexVariables
        );
        var processedPlaceholder = TextHelpers.SubstituteVariables(
            placeholder,
            pageNumber,
            totalPages,
            variables,
            complexVariables
        );

        sb.AppendLine("<div class=\"text-field-component\" style=\"width: 100%; height: 100%;\">");

        // Label
        var labelStyle =
            $"font-size: {labelFontSize}pt; color: {labelColor}; font-weight: {HtmlPropertyHelpers.GetCssFontWeight(labelFontWeight)}; margin-bottom: {labelSpacing}pt;";
        sb.AppendLine($"  <label style=\"{labelStyle}\">");
        sb.Append($"    {HttpUtility.HtmlEncode(processedLabel)}");
        if (required)
        {
            sb.Append(" <span style=\"color: #ef4444;\">*</span>");
        }
        sb.AppendLine();
        sb.AppendLine("  </label>");

        // Input field representation (as a styled div for print)
        var inputStyle =
            $"min-height: {inputHeight}mm; padding: {inputPaddingVertical}pt {inputPaddingHorizontal}pt; border: {borderWidth}px solid {borderColor}; border-radius: {borderRadius}px; background: {backgroundColor}; font-size: {fontSize}pt; font-family: '{fontFamily}', sans-serif;";
        sb.AppendLine($"  <div class=\"text-field-input\" style=\"{inputStyle}\">");
        if (!string.IsNullOrEmpty(processedPlaceholder))
        {
            sb.AppendLine(
                $"    <span style=\"color: {placeholderColor};\">{HttpUtility.HtmlEncode(processedPlaceholder)}</span>"
            );
        }
        else
        {
            sb.AppendLine("    &nbsp;"); // Ensure the box has content for height
        }
        sb.AppendLine("  </div>");

        sb.AppendLine("</div>");
    }
}
