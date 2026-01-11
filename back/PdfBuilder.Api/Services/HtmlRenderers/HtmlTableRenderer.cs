using System.Text;
using System.Text.Json;
using System.Web;
using PdfBuilder.Api.Services.Renderers;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders table components to HTML.
/// </summary>
public static class HtmlTableRenderer
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
        // Extract configuration
        var headers = HtmlPropertyHelpers.GetStringArray(properties, "headers") ?? [];
        var data = HtmlPropertyHelpers.GetStringArrayArray(properties, "data") ?? [];
        var showHeader = HtmlPropertyHelpers.GetBool(properties, "showHeader", true);

        // Header styling
        var headerBackground = HtmlPropertyHelpers.GetString(
            properties,
            "headerBackground",
            "#f3f4f6"
        );
        var headerTextColor = HtmlPropertyHelpers.GetString(
            properties,
            "headerTextColor",
            "#1f2937"
        );
        var headerFontSize = HtmlPropertyHelpers.GetFloat(properties, "headerFontSize", 12);
        var headerFontWeight = HtmlPropertyHelpers.GetString(
            properties,
            "headerFontWeight",
            "bold"
        );
        var headerPaddingVertical = HtmlPropertyHelpers.GetFloat(
            properties,
            "headerPaddingVertical",
            8
        );
        var headerPaddingHorizontal = HtmlPropertyHelpers.GetFloat(
            properties,
            "headerPaddingHorizontal",
            12
        );

        // Cell styling
        var cellTextColor = HtmlPropertyHelpers.GetString(properties, "cellTextColor", "#374151");
        var cellFontSize = HtmlPropertyHelpers.GetFloat(properties, "cellFontSize", 11);
        var cellPaddingVertical = HtmlPropertyHelpers.GetFloat(
            properties,
            "cellPaddingVertical",
            6
        );
        var cellPaddingHorizontal = HtmlPropertyHelpers.GetFloat(
            properties,
            "cellPaddingHorizontal",
            12
        );

        // Alternating row colors
        var alternateRowColors = HtmlPropertyHelpers.GetBool(
            properties,
            "alternateRowColors",
            false
        );
        var evenRowBackground = HtmlPropertyHelpers.GetString(
            properties,
            "evenRowBackground",
            "#ffffff"
        );
        var oddRowBackground = HtmlPropertyHelpers.GetString(
            properties,
            "oddRowBackground",
            "#f9fafb"
        );

        // Border styling
        var borderStyle = HtmlPropertyHelpers.GetString(properties, "borderStyle", "all");
        var borderWidth = HtmlPropertyHelpers.GetFloat(properties, "borderWidth", 1);
        var borderColor = HtmlPropertyHelpers.GetString(properties, "borderColor", "#e5e7eb");

        // Column definitions for alignment
        var columnDefs = ExtractColumnDefinitions(properties);

        // Build table styles
        var tableStyle = "width: 100%; border-collapse: collapse;";
        if (borderStyle == "all")
        {
            tableStyle += $" border: {borderWidth}px solid {borderColor};";
        }

        sb.AppendLine($"<table class=\"table-component\" style=\"{tableStyle}\">");

        // Render header
        if (showHeader && headers.Count > 0)
        {
            sb.AppendLine("  <thead>");
            sb.AppendLine("    <tr>");
            for (int i = 0; i < headers.Count; i++)
            {
                var align = i < columnDefs.Count ? columnDefs[i].Align : "left";
                var headerCellStyle =
                    $"background: {headerBackground}; color: {headerTextColor}; font-size: {headerFontSize}pt; font-weight: {HtmlPropertyHelpers.GetCssFontWeight(headerFontWeight)}; padding: {headerPaddingVertical}pt {headerPaddingHorizontal}pt; text-align: {align};";
                if (borderStyle == "all" || borderStyle == "header")
                {
                    headerCellStyle += $" border: {borderWidth}px solid {borderColor};";
                }
                var headerContent = TextHelpers.SubstituteVariables(
                    headers[i],
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                sb.AppendLine(
                    $"      <th style=\"{headerCellStyle}\">{HttpUtility.HtmlEncode(headerContent)}</th>"
                );
            }
            sb.AppendLine("    </tr>");
            sb.AppendLine("  </thead>");
        }

        // Render body
        sb.AppendLine("  <tbody>");
        for (int rowIndex = 0; rowIndex < data.Count; rowIndex++)
        {
            var row = data[rowIndex];
            var rowBg = alternateRowColors
                ? (rowIndex % 2 == 0 ? evenRowBackground : oddRowBackground)
                : evenRowBackground;

            sb.AppendLine($"    <tr style=\"background: {rowBg};\">");
            for (int cellIndex = 0; cellIndex < row.Count; cellIndex++)
            {
                var align = cellIndex < columnDefs.Count ? columnDefs[cellIndex].Align : "left";
                var cellStyle =
                    $"color: {cellTextColor}; font-size: {cellFontSize}pt; padding: {cellPaddingVertical}pt {cellPaddingHorizontal}pt; text-align: {align};";
                if (borderStyle == "all" || borderStyle == "horizontal")
                {
                    cellStyle += $" border-bottom: {borderWidth}px solid {borderColor};";
                }
                if (borderStyle == "all")
                {
                    cellStyle +=
                        $" border-left: {borderWidth}px solid {borderColor}; border-right: {borderWidth}px solid {borderColor};";
                }
                var cellContent = TextHelpers.SubstituteVariables(
                    row[cellIndex],
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                );
                sb.AppendLine(
                    $"      <td style=\"{cellStyle}\">{HttpUtility.HtmlEncode(cellContent)}</td>"
                );
            }
            sb.AppendLine("    </tr>");
        }
        sb.AppendLine("  </tbody>");

        sb.AppendLine("</table>");
    }

    private record ColumnDef(string Type, float Width, string Align);

    private static List<ColumnDef> ExtractColumnDefinitions(
        Dictionary<string, JsonElement> properties
    )
    {
        var columnDefs = new List<ColumnDef>();
        if (
            properties.TryGetValue("columnDefinitions", out var colDefsElement)
            && colDefsElement.ValueKind == JsonValueKind.Array
        )
        {
            foreach (var colDef in colDefsElement.EnumerateArray())
            {
                var type = "relative";
                var width = 1f;
                var align = "left";

                if (colDef.TryGetProperty("type", out var typeProp))
                    type = typeProp.GetString() ?? "relative";
                if (colDef.TryGetProperty("width", out var widthProp))
                    width = (float)widthProp.GetDouble();
                if (colDef.TryGetProperty("align", out var alignProp))
                    align = alignProp.GetString() ?? "left";

                columnDefs.Add(new ColumnDef(type, width, align));
            }
        }
        return columnDefs;
    }
}
