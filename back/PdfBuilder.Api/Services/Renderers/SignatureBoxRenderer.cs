using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders signature box components with customizable styling.
/// Supports signature lines, signer name/title, date fields, and full styling control.
/// </summary>
public static class SignatureBoxRenderer
{
    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var config = ExtractSignatureBoxConfig(properties);
        RenderSignatureBox(container, config);
    }

    /// <summary>
    /// Configuration record for signature box styling.
    /// </summary>
    private record SignatureBoxConfig(
        // Signer information
        string SignerName,
        string? SignerTitle,
        // Feature toggles
        bool ShowLine,
        bool DateRequired,
        // Signature line styling
        float LineThickness,
        string LineColor,
        // Text styling
        float SignerNameFontSize,
        string SignerNameColor,
        string SignerNameFontWeight,
        float SignerTitleFontSize,
        string SignerTitleColor,
        // Date section styling
        float DateLineWidth,
        string DateLabel,
        float DateLabelFontSize,
        string DateLabelColor,
        // Spacing
        float SpacingBetweenElements,
        float SignatureAreaHeight
    );

    /// <summary>
    /// Extract all signature box configuration from properties dictionary.
    /// </summary>
    private static SignatureBoxConfig ExtractSignatureBoxConfig(
        Dictionary<string, JsonElement> properties
    )
    {
        return new SignatureBoxConfig(
            SignerName: PropertyHelpers.GetString(properties, "signerName", "Signer Name"),
            SignerTitle: PropertyHelpers.GetString(properties, "signerTitle", null!),
            ShowLine: PropertyHelpers.GetBool(properties, "showLine", true),
            DateRequired: PropertyHelpers.GetBool(properties, "dateRequired", true),
            LineThickness: PropertyHelpers.GetFloat(properties, "lineThickness", 1),
            LineColor: PropertyHelpers.GetString(properties, "lineColor", "#000000"),
            SignerNameFontSize: PropertyHelpers.GetFloat(properties, "signerNameFontSize", 10),
            SignerNameColor: PropertyHelpers.GetString(properties, "signerNameColor", "#000000"),
            SignerNameFontWeight: PropertyHelpers.GetString(
                properties,
                "signerNameFontWeight",
                "bold"
            ),
            SignerTitleFontSize: PropertyHelpers.GetFloat(properties, "signerTitleFontSize", 9),
            SignerTitleColor: PropertyHelpers.GetString(properties, "signerTitleColor", "#666666"),
            DateLineWidth: PropertyHelpers.GetFloat(properties, "dateLineWidth", 50),
            DateLabel: PropertyHelpers.GetString(properties, "dateLabel", "Date"),
            DateLabelFontSize: PropertyHelpers.GetFloat(properties, "dateLabelFontSize", 9),
            DateLabelColor: PropertyHelpers.GetString(properties, "dateLabelColor", "#666666"),
            SpacingBetweenElements: PropertyHelpers.GetFloat(
                properties,
                "spacingBetweenElements",
                2
            ),
            SignatureAreaHeight: PropertyHelpers.GetFloat(properties, "signatureAreaHeight", 20)
        );
    }

    /// <summary>
    /// Render the signature box with the given configuration.
    /// </summary>
    private static void RenderSignatureBox(IContainer container, SignatureBoxConfig config)
    {
        container.Column(column =>
        {
            column.Spacing(config.SpacingBetweenElements);

            // Signature area with line
            if (config.ShowLine)
            {
                column
                    .Item()
                    .MinHeight(config.SignatureAreaHeight)
                    .AlignBottom()
                    .LineHorizontal(config.LineThickness)
                    .LineColor(config.LineColor);
            }
            else
            {
                // Reserve space for signature even without line
                column.Item().MinHeight(config.SignatureAreaHeight);
            }

            // Signer information row (name/title on left, date on right if required)
            column
                .Item()
                .PaddingTop(config.SpacingBetweenElements)
                .Row(row =>
                {
                    // Signer name and title column
                    row.RelativeItem()
                        .Column(signerColumn =>
                        {
                            // Signer name
                            signerColumn
                                .Item()
                                .Text(text =>
                                {
                                    var nameSpan = text.Span(config.SignerName)
                                        .FontSize(config.SignerNameFontSize)
                                        .FontColor(config.SignerNameColor)
                                        .ApplyFontWeight(config.SignerNameFontWeight);
                                });

                            // Signer title (if provided)
                            if (!string.IsNullOrEmpty(config.SignerTitle))
                            {
                                signerColumn
                                    .Item()
                                    .Text(text =>
                                    {
                                        text.Span(config.SignerTitle)
                                            .FontSize(config.SignerTitleFontSize)
                                            .FontColor(config.SignerTitleColor);
                                    });
                            }
                        });

                    // Date section (if required)
                    if (config.DateRequired)
                    {
                        row.ConstantItem(config.DateLineWidth + 10)
                            .AlignRight()
                            .Column(dateColumn =>
                            {
                                // Date line
                                dateColumn
                                    .Item()
                                    .Width(config.DateLineWidth)
                                    .LineHorizontal(config.LineThickness)
                                    .LineColor(config.LineColor);

                                // Date label
                                dateColumn
                                    .Item()
                                    .PaddingTop(config.SpacingBetweenElements)
                                    .Text(text =>
                                    {
                                        text.Span(config.DateLabel)
                                            .FontSize(config.DateLabelFontSize)
                                            .FontColor(config.DateLabelColor);
                                    });
                            });
                    }
                });
        });
    }
}
