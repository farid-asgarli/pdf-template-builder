using System.Text;
using System.Text.Json;
using System.Web;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders checkbox components to HTML.
/// </summary>
public static class HtmlCheckboxRenderer
{
    private static readonly Dictionary<string, float> SizePresets = new()
    {
        { "small", 10 },
        { "medium", 14 },
        { "large", 18 },
    };

    public static void Render(StringBuilder sb, Dictionary<string, JsonElement> properties)
    {
        var label = HtmlPropertyHelpers.GetString(properties, "label", "Option");
        var isChecked = HtmlPropertyHelpers.GetBool(properties, "defaultChecked", false);
        if (!isChecked)
        {
            isChecked = HtmlPropertyHelpers.GetBool(properties, "checked", false);
        }

        var size = HtmlPropertyHelpers.GetString(properties, "size", "medium");
        var checkedColor = HtmlPropertyHelpers.GetString(properties, "checkedColor", "#6750a4");
        var uncheckedBackgroundColor = HtmlPropertyHelpers.GetString(
            properties,
            "uncheckedBackgroundColor",
            "#ffffff"
        );
        var borderColor = HtmlPropertyHelpers.GetString(properties, "borderColor", "#79747e");
        var borderWidth = HtmlPropertyHelpers.GetFloat(properties, "borderWidth", 1.5f);
        var borderRadius = HtmlPropertyHelpers.GetFloat(properties, "borderRadius", 2);
        var checkmarkStyle = HtmlPropertyHelpers.GetString(properties, "checkmarkStyle", "check");
        var checkmarkColor = HtmlPropertyHelpers.GetString(properties, "checkmarkColor", "#ffffff");
        var labelFontSize = HtmlPropertyHelpers.GetFloat(properties, "labelFontSize", 11);
        var labelColor = HtmlPropertyHelpers.GetString(properties, "labelColor", "#1c1b1f");
        var labelFontWeight = HtmlPropertyHelpers.GetString(
            properties,
            "labelFontWeight",
            "normal"
        );
        var spacing = HtmlPropertyHelpers.GetFloat(properties, "spacing", 6);

        var boxSize = SizePresets.GetValueOrDefault(size.ToLowerInvariant(), 14);

        sb.AppendLine(
            $"<div class=\"checkbox-component\" style=\"display: flex; align-items: center; gap: {spacing}pt;\">"
        );

        // Checkbox box
        var boxBg = isChecked ? checkedColor : uncheckedBackgroundColor;
        var boxStyle =
            $"width: {boxSize}pt; height: {boxSize}pt; border: {borderWidth}px solid {borderColor}; border-radius: {borderRadius}px; background: {boxBg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;";
        sb.AppendLine($"  <div class=\"checkbox-box\" style=\"{boxStyle}\">");

        if (isChecked)
        {
            // Render checkmark based on style
            var checkmarkSvg = checkmarkStyle switch
            {
                "cross" =>
                    $"<svg width=\"{boxSize * 0.6}\" height=\"{boxSize * 0.6}\" viewBox=\"0 0 10 10\" fill=\"none\" stroke=\"{checkmarkColor}\" stroke-width=\"2\" stroke-linecap=\"round\"><line x1=\"2\" y1=\"2\" x2=\"8\" y2=\"8\"/><line x1=\"8\" y1=\"2\" x2=\"2\" y2=\"8\"/></svg>",
                "circle" =>
                    $"<svg width=\"{boxSize * 0.5}\" height=\"{boxSize * 0.5}\" viewBox=\"0 0 10 10\"><circle cx=\"5\" cy=\"5\" r=\"4\" fill=\"{checkmarkColor}\"/></svg>",
                _ =>
                    $"<svg width=\"{boxSize * 0.7}\" height=\"{boxSize * 0.7}\" viewBox=\"0 0 12 12\" fill=\"none\" stroke=\"{checkmarkColor}\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"2,6 5,9 10,3\"/></svg>",
            };
            sb.AppendLine($"    {checkmarkSvg}");
        }

        sb.AppendLine("  </div>");

        // Label
        var labelStyle =
            $"font-size: {labelFontSize}pt; color: {labelColor}; font-weight: {HtmlPropertyHelpers.GetCssFontWeight(labelFontWeight)};";
        sb.AppendLine($"  <span style=\"{labelStyle}\">{HttpUtility.HtmlEncode(label)}</span>");

        sb.AppendLine("</div>");
    }
}
