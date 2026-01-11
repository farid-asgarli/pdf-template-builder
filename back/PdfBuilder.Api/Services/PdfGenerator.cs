using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services;

/// <summary>
/// PDF generation service using QuestPDF library.
/// Converts JSON document content into PDF files.
/// </summary>
public static class PdfGenerator
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Generate a simple "Hello World" PDF for testing.
    /// </summary>
    public static byte[] GenerateSimple()
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(20, Unit.Millimetre);
                page.DefaultTextStyle(x => x.FontSize(14));
                page.PageColor(Colors.White);

                page.Content()
                    .Column(column =>
                    {
                        column.Item().Text("Hello World").FontSize(24).Bold();
                    });
            });
        });

        return document.GeneratePdf();
    }

    /// <summary>
    /// Generate PDF from document JSON content with default settings.
    /// </summary>
    public static byte[] Generate(string jsonContent)
    {
        return Generate(jsonContent, null, null);
    }

    /// <summary>
    /// Generate PDF from document JSON content with custom settings.
    /// </summary>
    public static byte[] Generate(string jsonContent, PdfGenerationSettings? settings)
    {
        return Generate(jsonContent, settings, null);
    }

    /// <summary>
    /// Generate PDF from document JSON content with custom settings and runtime variables.
    /// </summary>
    /// <param name="jsonContent">The document JSON content.</param>
    /// <param name="settings">Optional PDF generation settings.</param>
    /// <param name="runtimeVariables">Variables to substitute at generation time.</param>
    public static byte[] Generate(
        string jsonContent,
        PdfGenerationSettings? settings,
        Dictionary<string, object>? runtimeVariables
    )
    {
        var data = ParseDocumentData(jsonContent);

        if (data?.Pages == null || data.Pages.Count == 0)
        {
            return GenerateSimple();
        }

        // Apply global settings to pages that don't have their own settings
        ApplyGlobalSettings(data);

        // Merge runtime variables with document variables
        if (runtimeVariables != null || data.VariableDefinitions.Count > 0)
        {
            data.Variables = VariableService.MergeVariables(
                data.VariableDefinitions,
                data.Variables,
                runtimeVariables
            );

            // Extract complex variables (arrays, objects) for template processing
            data.ComplexVariables = VariableService.ExtractComplexVariables(runtimeVariables);

            // Evaluate computed variables
            data.Variables = VariableService.EvaluateComputedVariables(
                data.VariableDefinitions,
                data.Variables,
                data.ComplexVariables
            );
        }

        var pdfDocument = new PdfDocument(data, settings);
        return pdfDocument.GeneratePdf();
    }

    /// <summary>
    /// Generate PDF and return it as a stream for large documents.
    /// </summary>
    public static MemoryStream GenerateToStream(
        string jsonContent,
        PdfGenerationSettings? settings = null
    )
    {
        var data = ParseDocumentData(jsonContent);

        if (data?.Pages == null || data.Pages.Count == 0)
        {
            var stream = new MemoryStream();
            var simpleDoc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(20, Unit.Millimetre);
                    page.Content().Text("Empty document");
                });
            });
            simpleDoc.GeneratePdf(stream);
            stream.Position = 0;
            return stream;
        }

        ApplyGlobalSettings(data);

        var pdfDocument = new PdfDocument(data, settings);
        var resultStream = new MemoryStream();
        pdfDocument.GeneratePdf(resultStream);
        resultStream.Position = 0;
        return resultStream;
    }

    #region Parsing

    private static DocumentData? ParseDocumentData(string jsonContent)
    {
        try
        {
            return JsonSerializer.Deserialize<DocumentData>(jsonContent, JsonOptions);
        }
        catch
        {
            // If parsing fails, check for legacy single-page format with components array
            return TryParseLegacyFormat(jsonContent);
        }
    }

    private static DocumentData? TryParseLegacyFormat(string jsonContent)
    {
        try
        {
            var legacyDoc = JsonSerializer.Deserialize<LegacyDocument>(jsonContent, JsonOptions);
            if (legacyDoc?.Components != null && legacyDoc.Components.Count > 0)
            {
                return new DocumentData
                {
                    Pages =
                    [
                        new PageData
                        {
                            Id = "page-1",
                            PageNumber = 1,
                            Components = legacyDoc.Components,
                            PageSettings = new PageSettings
                            {
                                PredefinedSize = "a4",
                                Orientation = "portrait",
                            },
                        },
                    ],
                };
            }
        }
        catch
        {
            // Ignore parsing errors
        }

        return null;
    }

    #endregion

    #region Settings Application

    private static void ApplyGlobalSettings(DocumentData data)
    {
        var globalSettings = data.Settings;

        foreach (var page in data.Pages)
        {
            // Create page settings if not present
            page.PageSettings ??= new PageSettings();

            // Apply global settings as defaults
            if (globalSettings != null)
            {
                page.PageSettings.PredefinedSize ??= globalSettings.PredefinedSize;
                page.PageSettings.Orientation ??= globalSettings.Orientation;

                if (string.IsNullOrEmpty(page.PageSettings.BackgroundColor))
                {
                    page.PageSettings.BackgroundColor = globalSettings.BackgroundColor;
                }

                if (string.IsNullOrEmpty(page.PageSettings.ContentDirection))
                {
                    page.PageSettings.ContentDirection = globalSettings.ContentDirection;
                }

                // Apply margin defaults if not set
                page.PageSettings.Margins ??= new PageMargins();
                if (page.PageSettings.Margins.Top == 0 && globalSettings.Margins?.Top > 0)
                {
                    page.PageSettings.Margins.Top = globalSettings.Margins.Top;
                }
                if (page.PageSettings.Margins.Right == 0 && globalSettings.Margins?.Right > 0)
                {
                    page.PageSettings.Margins.Right = globalSettings.Margins.Right;
                }
                if (page.PageSettings.Margins.Bottom == 0 && globalSettings.Margins?.Bottom > 0)
                {
                    page.PageSettings.Margins.Bottom = globalSettings.Margins.Bottom;
                }
                if (page.PageSettings.Margins.Left == 0 && globalSettings.Margins?.Left > 0)
                {
                    page.PageSettings.Margins.Left = globalSettings.Margins.Left;
                }
            }

            // Ensure sensible defaults
            page.PageSettings.PredefinedSize ??= "a4";
            page.PageSettings.Orientation ??= "portrait";
            page.PageSettings.BackgroundColor ??= "#FFFFFF";
            page.PageSettings.ContentDirection ??= "ltr";
            page.PageSettings.Margins ??= new PageMargins();
        }
    }

    #endregion
}

internal class LegacyDocument
{
    public List<ComponentData> Components { get; set; } = [];
}
