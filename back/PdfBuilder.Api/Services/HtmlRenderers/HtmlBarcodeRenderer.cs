using System.Text;
using System.Text.Json;
using System.Web;
using PdfBuilder.Api.Services.Renderers;
using ZXing;
using ZXing.Common;
using ZXing.Rendering;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders barcode components to HTML using ZXing.Net library.
/// Generates SVG barcodes for crisp rendering at any scale.
/// </summary>
public static class HtmlBarcodeRenderer
{
    private static readonly Dictionary<string, BarcodeFormat> BarcodeFormats = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        // 1D Product codes
        ["ean-13"] = BarcodeFormat.EAN_13,
        ["ean-8"] = BarcodeFormat.EAN_8,
        ["upc-a"] = BarcodeFormat.UPC_A,
        ["upc-e"] = BarcodeFormat.UPC_E,

        // 1D Industrial codes
        ["code-128"] = BarcodeFormat.CODE_128,
        ["code-39"] = BarcodeFormat.CODE_39,
        ["code-93"] = BarcodeFormat.CODE_93,
        ["codabar"] = BarcodeFormat.CODABAR,
        ["itf"] = BarcodeFormat.ITF,

        // 2D codes
        ["qr-code"] = BarcodeFormat.QR_CODE,
        ["data-matrix"] = BarcodeFormat.DATA_MATRIX,
        ["aztec"] = BarcodeFormat.AZTEC,
        ["pdf-417"] = BarcodeFormat.PDF_417,
    };

    /// <summary>
    /// Renders a barcode with variable substitution support.
    /// </summary>
    public static void Render(
        StringBuilder sb,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        // Get the value and process variable substitutions
        var rawValue = HtmlPropertyHelpers.GetString(properties, "value", "");
        var value = TextHelpers.SubstituteVariables(
            rawValue,
            pageNumber,
            totalPages,
            variables,
            complexVariables
        );

        var barcodeType = HtmlPropertyHelpers.GetString(properties, "barcodeType", "qr-code");
        var showValue = HtmlPropertyHelpers.GetBool(properties, "showValue", true);
        var foregroundColor = HtmlPropertyHelpers.GetString(
            properties,
            "foregroundColor",
            "#000000"
        );
        var backgroundColor = HtmlPropertyHelpers.GetString(
            properties,
            "backgroundColor",
            "#FFFFFF"
        );
        var quietZone = HtmlPropertyHelpers.GetInt(properties, "quietZone", 2);
        var valueFontSize = HtmlPropertyHelpers.GetFloat(properties, "valueFontSize", 10f);
        var valueFontFamily = HtmlPropertyHelpers.GetString(properties, "valueFontFamily", "Inter");

        // Validate barcode type
        if (!BarcodeFormats.TryGetValue(barcodeType, out var format))
        {
            sb.AppendLine(
                $"<div class=\"placeholder-component\" style=\"background: #fef3c7; border-color: #f59e0b; color: #d97706;\">Unknown barcode: {HttpUtility.HtmlEncode(barcodeType)}</div>"
            );
            return;
        }

        // Validate value
        if (string.IsNullOrWhiteSpace(value))
        {
            sb.AppendLine(
                "<div class=\"placeholder-component\" style=\"background: #dbeafe; border-color: #3b82f6; color: #2563eb;\">Enter barcode value</div>"
            );
            return;
        }

        try
        {
            // Determine size based on barcode type
            var is2D =
                format == BarcodeFormat.QR_CODE
                || format == BarcodeFormat.DATA_MATRIX
                || format == BarcodeFormat.AZTEC
                || format == BarcodeFormat.PDF_417;
            var width = is2D ? 150 : 200;
            var height = is2D ? 150 : 80;

            var svgContent = GenerateBarcodeSvg(
                value,
                format,
                width,
                height,
                foregroundColor,
                backgroundColor
            );

            sb.AppendLine(
                $"<div class=\"barcode-component\" style=\"background: {backgroundColor}; padding: {quietZone}px; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;\">"
            );
            sb.AppendLine($"  {svgContent}");

            if (showValue && !is2D)
            {
                var textStyle =
                    $"font-size: {valueFontSize}pt; font-family: '{valueFontFamily}', monospace; color: {foregroundColor}; margin-top: 4px; text-align: center;";
                sb.AppendLine(
                    $"  <div style=\"{textStyle}\">{HttpUtility.HtmlEncode(value)}</div>"
                );
            }

            sb.AppendLine("</div>");
        }
        catch (Exception ex)
        {
            sb.AppendLine(
                $"<div class=\"placeholder-component\" style=\"background: #fee2e2; border-color: #ef4444; color: #dc2626;\">Barcode error: {HttpUtility.HtmlEncode(ex.Message)}</div>"
            );
        }
    }

    private static string GenerateBarcodeSvg(
        string value,
        BarcodeFormat format,
        int width,
        int height,
        string foregroundColor,
        string backgroundColor
    )
    {
        var writer = new ZXing.BarcodeWriterSvg
        {
            Format = format,
            Options = new EncodingOptions
            {
                Width = width,
                Height = height,
                Margin = 0,
                PureBarcode = false,
            },
        };

        // Set format-specific options
        if (format == BarcodeFormat.QR_CODE)
        {
            writer.Options.Hints[EncodeHintType.ERROR_CORRECTION] = ZXing
                .QrCode
                .Internal
                .ErrorCorrectionLevel
                .M;
        }

        var svgImage = writer.Write(value);

        // Replace default colors with custom colors
        var svgContent = svgImage.Content;
        svgContent = svgContent.Replace("fill=\"#000000\"", $"fill=\"{foregroundColor}\"");
        svgContent = svgContent.Replace("fill=\"#FFFFFF\"", $"fill=\"{backgroundColor}\"");
        svgContent = svgContent.Replace("fill:#000000", $"fill:{foregroundColor}");
        svgContent = svgContent.Replace("fill:#FFFFFF", $"fill:{backgroundColor}");

        // Make SVG responsive
        svgContent = System.Text.RegularExpressions.Regex.Replace(
            svgContent,
            @"width=""\d+""",
            "width=\"100%\""
        );
        svgContent = System.Text.RegularExpressions.Regex.Replace(
            svgContent,
            @"height=""\d+""",
            "height=\"auto\""
        );

        return svgContent;
    }
}
