using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using ZXing;
using ZXing.Aztec;
using ZXing.Datamatrix;
using ZXing.OneD;
using ZXing.PDF417;
using ZXing.QrCode;
using ZXing.Rendering;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders barcode components using ZXing.Net library.
/// Supports 1D barcodes (Code128, EAN-13, EAN-8, UPC-A, Code39, etc.)
/// and 2D barcodes (QR Code, Data Matrix, Aztec, PDF417).
/// Outputs as SVG for sharp rendering at any resolution.
/// </summary>
public static class BarcodeRenderer
{
    /// <summary>
    /// Supported barcode formats mapped to ZXing BarcodeFormat.
    /// </summary>
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
    /// Renders a barcode component.
    /// </summary>
    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var value = PropertyHelpers.GetString(properties, "value", "");
        var barcodeType = PropertyHelpers.GetString(properties, "barcodeType", "qr-code");
        var showValue = PropertyHelpers.GetBool(properties, "showValue", true);
        var foregroundColor = PropertyHelpers.GetString(properties, "foregroundColor", "#000000");
        var backgroundColor = PropertyHelpers.GetString(properties, "backgroundColor", "#FFFFFF");
        var errorCorrectionLevel = PropertyHelpers.GetString(
            properties,
            "errorCorrectionLevel",
            "medium"
        );
        var quietZone = PropertyHelpers.GetInt(properties, "quietZone", 2);
        var valueFontSize = PropertyHelpers.GetFloat(properties, "valueFontSize", 10f);
        var valueFontFamily = PropertyHelpers.GetString(properties, "valueFontFamily", "Inter");

        // Validate barcode type
        if (!BarcodeFormats.TryGetValue(barcodeType, out var format))
        {
            PlaceholderRenderer.RenderWarning(container, $"Unknown barcode type: {barcodeType}");
            return;
        }

        // Validate value
        if (string.IsNullOrWhiteSpace(value))
        {
            PlaceholderRenderer.RenderInfo(container, "Enter barcode value");
            return;
        }

        try
        {
            // Apply background color to container
            container
                .Background(backgroundColor)
                .Padding(quietZone)
                .Column(column =>
                {
                    // Render barcode as SVG using dynamic sizing
                    column
                        .Item()
                        .AlignCenter()
                        .Svg(size =>
                        {
                            return GenerateBarcodeSvg(
                                value,
                                format,
                                (int)size.Width,
                                (int)size.Height,
                                foregroundColor,
                                backgroundColor,
                                errorCorrectionLevel,
                                showValue ? valueFontFamily : null,
                                showValue ? valueFontSize : 0
                            );
                        });
                });
        }
        catch (Exception ex)
        {
            PlaceholderRenderer.RenderError(container, $"Barcode error: {ex.Message}");
        }
    }

    /// <summary>
    /// Renders a barcode with variable substitution support.
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        // Get the value and process variable substitutions
        var rawValue = PropertyHelpers.GetString(properties, "value", "");
        var processedValue = TemplateEngine.Process(
            rawValue,
            pageNumber,
            totalPages,
            variables,
            complexVariables ?? []
        );

        // Create a modified properties dictionary with the processed value
        var modifiedProperties = new Dictionary<string, JsonElement>(properties)
        {
            ["value"] = JsonSerializer.SerializeToElement(processedValue),
        };

        // Render with the processed value
        Render(container, modifiedProperties);
    }

    /// <summary>
    /// Generates SVG content for a barcode.
    /// </summary>
    private static string GenerateBarcodeSvg(
        string content,
        BarcodeFormat format,
        int width,
        int height,
        string foregroundColor,
        string backgroundColor,
        string errorCorrectionLevel,
        string? fontName,
        float fontSize
    )
    {
        // Create the appropriate writer based on format
        var writer = CreateWriter(format);

        // Configure encoding hints
        var hints = new Dictionary<EncodeHintType, object>
        {
            [EncodeHintType.MARGIN] = 0, // We handle margin separately via quiet zone
            [EncodeHintType.CHARACTER_SET] = "UTF-8",
        };

        // Add error correction level for 2D codes that support it
        if (format is BarcodeFormat.QR_CODE)
        {
            hints[EncodeHintType.ERROR_CORRECTION] = GetQrErrorCorrectionLevel(
                errorCorrectionLevel
            );
        }
        else if (format is BarcodeFormat.AZTEC)
        {
            hints[EncodeHintType.ERROR_CORRECTION] = GetAztecErrorCorrectionLevel(
                errorCorrectionLevel
            );
        }
        else if (format is BarcodeFormat.PDF_417)
        {
            hints[EncodeHintType.ERROR_CORRECTION] = GetPdf417ErrorCorrectionLevel(
                errorCorrectionLevel
            );
        }

        // For 1D barcodes that show text, adjust height to leave room
        var barcodeHeight = height;
        if (fontName != null && fontSize > 0 && Is1DBarcode(format))
        {
            // Reserve space for text below barcode
            barcodeHeight = Math.Max(height - (int)(fontSize * 1.5), height / 2);
        }

        // Encode the barcode
        var bitMatrix = writer.encode(content, format, width, barcodeHeight, hints);

        // Render to SVG
        var renderer = new SvgRenderer
        {
            Foreground = ParseSvgColor(foregroundColor),
            Background = ParseSvgColor(backgroundColor),
        };

        // For 1D barcodes, optionally show text
        if (fontName != null && fontSize > 0 && Is1DBarcode(format))
        {
            renderer.FontName = fontName;
            renderer.FontSize = (int)fontSize;
        }

        var svgImage = renderer.Render(bitMatrix, format, content);
        return svgImage.Content;
    }

    /// <summary>
    /// Creates the appropriate barcode writer for the given format.
    /// </summary>
    private static Writer CreateWriter(BarcodeFormat format)
    {
        return format switch
        {
            // 1D writers
            BarcodeFormat.EAN_13 => new EAN13Writer(),
            BarcodeFormat.EAN_8 => new EAN8Writer(),
            BarcodeFormat.UPC_A => new UPCAWriter(),
            BarcodeFormat.UPC_E => new UPCEWriter(),
            BarcodeFormat.CODE_128 => new Code128Writer(),
            BarcodeFormat.CODE_39 => new Code39Writer(),
            BarcodeFormat.CODE_93 => new Code93Writer(),
            BarcodeFormat.CODABAR => new CodaBarWriter(),
            BarcodeFormat.ITF => new ITFWriter(),

            // 2D writers
            BarcodeFormat.QR_CODE => new QRCodeWriter(),
            BarcodeFormat.DATA_MATRIX => new DataMatrixWriter(),
            BarcodeFormat.AZTEC => new AztecWriter(),
            BarcodeFormat.PDF_417 => new PDF417Writer(),

            _ => throw new NotSupportedException($"Barcode format {format} is not supported"),
        };
    }

    /// <summary>
    /// Checks if the format is a 1D barcode.
    /// </summary>
    private static bool Is1DBarcode(BarcodeFormat format)
    {
        return format
            is BarcodeFormat.EAN_13
                or BarcodeFormat.EAN_8
                or BarcodeFormat.UPC_A
                or BarcodeFormat.UPC_E
                or BarcodeFormat.CODE_128
                or BarcodeFormat.CODE_39
                or BarcodeFormat.CODE_93
                or BarcodeFormat.CODABAR
                or BarcodeFormat.ITF;
    }

    /// <summary>
    /// Parses a hex color string to ZXing SvgRenderer.Color.
    /// </summary>
    private static SvgRenderer.Color ParseSvgColor(string hexColor)
    {
        // Remove # prefix if present
        var hex = hexColor.TrimStart('#');

        // Parse RGB values
        byte r = Convert.ToByte(hex.Substring(0, 2), 16);
        byte g = Convert.ToByte(hex.Substring(2, 2), 16);
        byte b = Convert.ToByte(hex.Substring(4, 2), 16);
        byte a = hex.Length >= 8 ? Convert.ToByte(hex.Substring(6, 2), 16) : (byte)255;

        return new SvgRenderer.Color(a, r, g, b);
    }

    /// <summary>
    /// Maps error correction level string to QR Code error correction level.
    /// </summary>
    private static ZXing.QrCode.Internal.ErrorCorrectionLevel GetQrErrorCorrectionLevel(
        string level
    )
    {
        return level.ToLowerInvariant() switch
        {
            "low" or "l" => ZXing.QrCode.Internal.ErrorCorrectionLevel.L, // ~7% recovery
            "medium" or "m" => ZXing.QrCode.Internal.ErrorCorrectionLevel.M, // ~15% recovery
            "quartile" or "q" => ZXing.QrCode.Internal.ErrorCorrectionLevel.Q, // ~25% recovery
            "high" or "h" => ZXing.QrCode.Internal.ErrorCorrectionLevel.H, // ~30% recovery
            _ => ZXing.QrCode.Internal.ErrorCorrectionLevel.M,
        };
    }

    /// <summary>
    /// Maps error correction level string to Aztec error correction percentage.
    /// </summary>
    private static int GetAztecErrorCorrectionLevel(string level)
    {
        return level.ToLowerInvariant() switch
        {
            "low" => 10,
            "medium" => 25,
            "quartile" => 33,
            "high" => 50,
            _ => 25,
        };
    }

    /// <summary>
    /// Maps error correction level string to PDF417 error correction level.
    /// </summary>
    private static int GetPdf417ErrorCorrectionLevel(string level)
    {
        // PDF417 uses levels 0-8
        return level.ToLowerInvariant() switch
        {
            "low" => 2,
            "medium" => 4,
            "quartile" => 5,
            "high" => 6,
            _ => 4,
        };
    }
}
