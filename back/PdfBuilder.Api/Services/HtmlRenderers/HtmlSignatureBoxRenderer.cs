using System.Text;
using System.Text.Json;
using System.Web;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders signature box components to HTML.
/// </summary>
public static class HtmlSignatureBoxRenderer
{
    public static void Render(StringBuilder sb, Dictionary<string, JsonElement> properties)
    {
        var signerName = HtmlPropertyHelpers.GetString(properties, "signerName", "Signer Name");
        var signerTitle = HtmlPropertyHelpers.GetString(properties, "signerTitle", "");
        var showLine = HtmlPropertyHelpers.GetBool(properties, "showLine", true);
        var dateRequired = HtmlPropertyHelpers.GetBool(properties, "dateRequired", true);
        var lineThickness = HtmlPropertyHelpers.GetFloat(properties, "lineThickness", 1);
        var lineColor = HtmlPropertyHelpers.GetString(properties, "lineColor", "#000000");
        var signerNameFontSize = HtmlPropertyHelpers.GetFloat(properties, "signerNameFontSize", 10);
        var signerNameColor = HtmlPropertyHelpers.GetString(
            properties,
            "signerNameColor",
            "#000000"
        );
        var signerNameFontWeight = HtmlPropertyHelpers.GetString(
            properties,
            "signerNameFontWeight",
            "bold"
        );
        var signerTitleFontSize = HtmlPropertyHelpers.GetFloat(
            properties,
            "signerTitleFontSize",
            9
        );
        var signerTitleColor = HtmlPropertyHelpers.GetString(
            properties,
            "signerTitleColor",
            "#666666"
        );
        var dateLineWidth = HtmlPropertyHelpers.GetFloat(properties, "dateLineWidth", 50);
        var dateLabel = HtmlPropertyHelpers.GetString(properties, "dateLabel", "Date");
        var dateLabelFontSize = HtmlPropertyHelpers.GetFloat(properties, "dateLabelFontSize", 9);
        var dateLabelColor = HtmlPropertyHelpers.GetString(properties, "dateLabelColor", "#666666");
        var spacingBetweenElements = HtmlPropertyHelpers.GetFloat(
            properties,
            "spacingBetweenElements",
            2
        );
        var signatureAreaHeight = HtmlPropertyHelpers.GetFloat(
            properties,
            "signatureAreaHeight",
            20
        );

        sb.AppendLine(
            "<div class=\"signature-box\" style=\"display: flex; flex-direction: column; width: 100%; height: 100%;\">"
        );

        // Signature area with line
        if (showLine)
        {
            sb.AppendLine(
                $"  <div style=\"min-height: {signatureAreaHeight}mm; display: flex; align-items: flex-end;\">"
            );
            sb.AppendLine(
                $"    <div class=\"signature-line\" style=\"width: 100%; border-bottom: {lineThickness}px solid {lineColor};\"></div>"
            );
            sb.AppendLine("  </div>");
        }
        else
        {
            sb.AppendLine($"  <div style=\"min-height: {signatureAreaHeight}mm;\"></div>");
        }

        // Signer name
        var nameStyle =
            $"font-size: {signerNameFontSize}pt; color: {signerNameColor}; font-weight: {HtmlPropertyHelpers.GetCssFontWeight(signerNameFontWeight)}; margin-top: {spacingBetweenElements}pt;";
        sb.AppendLine($"  <div style=\"{nameStyle}\">{HttpUtility.HtmlEncode(signerName)}</div>");

        // Signer title
        if (!string.IsNullOrEmpty(signerTitle))
        {
            var titleStyle =
                $"font-size: {signerTitleFontSize}pt; color: {signerTitleColor}; margin-top: {spacingBetweenElements}pt;";
            sb.AppendLine(
                $"  <div style=\"{titleStyle}\">{HttpUtility.HtmlEncode(signerTitle)}</div>"
            );
        }

        // Date field
        if (dateRequired)
        {
            sb.AppendLine(
                $"  <div style=\"margin-top: {spacingBetweenElements * 2}pt; display: flex; align-items: flex-end; gap: 4pt;\">"
            );
            sb.AppendLine(
                $"    <span style=\"font-size: {dateLabelFontSize}pt; color: {dateLabelColor};\">{HttpUtility.HtmlEncode(dateLabel)}:</span>"
            );
            sb.AppendLine(
                $"    <div style=\"width: {dateLineWidth}pt; border-bottom: {lineThickness}px solid {lineColor};\"></div>"
            );
            sb.AppendLine("  </div>");
        }

        sb.AppendLine("</div>");
    }
}
