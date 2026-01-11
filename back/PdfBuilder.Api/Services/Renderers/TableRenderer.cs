using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders table components using QuestPDF's Table API.
///
/// Features:
/// - Column definitions: constant (fixed width in points) or relative (proportional)
/// - Per-column text alignment (left, center, right)
/// - Header row with customizable styling (background, text color, font, padding, border)
/// - Data cells with alternating row colors support
/// - Configurable cell styling (font size, weight, color, padding, vertical alignment)
/// - Flexible border options (all borders, header border only, horizontal, none)
///
/// Based on QuestPDF Table documentation:
/// - Uses table.Header() for repeating headers on multi-page tables
/// - Uses Element() pattern for consistent cell styling
/// - Supports DefaultTextStyle for header text configuration
/// </summary>
public static class TableRenderer
{
    /// <summary>
    /// Configuration record for table rendering.
    /// </summary>
    private record TableConfig(
        // Structure
        List<ColumnDefinition> ColumnDefinitions,
        List<string> Headers,
        List<List<string>> Data,
        bool ShowHeader,
        // Header styling
        string HeaderBackground,
        string HeaderTextColor,
        float HeaderFontSize,
        string HeaderFontWeight,
        float HeaderPaddingVertical,
        float HeaderPaddingHorizontal,
        string HeaderVerticalAlign,
        bool HeaderBorderBottom,
        float HeaderBorderBottomWidth,
        string HeaderBorderBottomColor,
        // Cell styling
        string CellTextColor,
        float CellFontSize,
        string CellFontWeight,
        float CellPaddingVertical,
        float CellPaddingHorizontal,
        string CellVerticalAlign,
        // Alternating row colors
        bool AlternateRowColors,
        string EvenRowBackground,
        string OddRowBackground,
        // Borders
        string BorderStyle,
        float BorderWidth,
        string BorderColor
    );

    /// <summary>
    /// Column definition with type, width, and alignment.
    /// </summary>
    private record ColumnDefinition(string Type, float Width, string Align);

    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var config = ExtractTableConfig(properties);
        RenderTable(container, config);
    }

    /// <summary>
    /// Render a table component with variable substitution.
    /// Variables in headers and cell data are substituted.
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables
    )
    {
        RenderWithVariables(container, properties, pageNumber, totalPages, variables, null);
    }

    /// <summary>
    /// Render a table with full variable substitution support.
    /// Supports: conditionals, loops, inline formatting.
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
        var config = ExtractTableConfig(properties);

        // Substitute variables in headers
        var headersWithVars = config
            .Headers.Select(h =>
                TextHelpers.SubstituteVariables(
                    h,
                    pageNumber,
                    totalPages,
                    variables,
                    complexVariables
                )
            )
            .ToList();

        // Substitute variables in all data cells
        var dataWithVars = config
            .Data.Select(row =>
                row.Select(cell =>
                        TextHelpers.SubstituteVariables(
                            cell,
                            pageNumber,
                            totalPages,
                            variables,
                            complexVariables
                        )
                    )
                    .ToList()
            )
            .ToList();

        var configWithVars = config with { Headers = headersWithVars, Data = dataWithVars };

        RenderTable(container, configWithVars);
    }

    /// <summary>
    /// Core table rendering logic.
    /// </summary>
    private static void RenderTable(IContainer container, TableConfig config)
    {
        if (config.ColumnDefinitions.Count == 0)
            return;

        container.Table(table =>
        {
            // Define columns based on configuration
            DefineColumns(table, config.ColumnDefinitions);

            var columnCount = config.ColumnDefinitions.Count;

            // Render header if enabled
            if (config.ShowHeader && config.Headers.Count > 0)
            {
                RenderHeader(table, config, columnCount);
            }

            // Render data rows
            if (config.Data.Count > 0)
            {
                RenderDataRows(table, config, columnCount);
            }
        });
    }

    /// <summary>
    /// Define table columns based on column definitions.
    /// </summary>
    private static void DefineColumns(
        TableDescriptor table,
        List<ColumnDefinition> columnDefinitions
    )
    {
        table.ColumnsDefinition(columns =>
        {
            foreach (var colDef in columnDefinitions)
            {
                if (colDef.Type == "constant")
                {
                    columns.ConstantColumn(colDef.Width);
                }
                else
                {
                    // Relative column - width is the ratio (e.g., 1, 2, 3)
                    columns.RelativeColumn(colDef.Width);
                }
            }
        });
    }

    /// <summary>
    /// Render table header row with proper styling.
    /// Uses table.Header() so headers repeat on multi-page tables.
    /// </summary>
    private static void RenderHeader(TableDescriptor table, TableConfig config, int columnCount)
    {
        table.Header(header =>
        {
            for (var i = 0; i < columnCount; i++)
            {
                var headerText = i < config.Headers.Count ? config.Headers[i] : "";
                var alignment = GetColumnAlignment(config.ColumnDefinitions, i);

                header
                    .Cell()
                    .Element(c => ApplyHeaderCellStyle(c, config, alignment))
                    .Text(headerText)
                    .FontSize(config.HeaderFontSize)
                    .FontColor(config.HeaderTextColor)
                    .ApplyFontWeight(config.HeaderFontWeight);
            }
        });
    }

    /// <summary>
    /// Render all data rows with proper styling.
    /// </summary>
    private static void RenderDataRows(TableDescriptor table, TableConfig config, int columnCount)
    {
        for (var rowIndex = 0; rowIndex < config.Data.Count; rowIndex++)
        {
            var row = config.Data[rowIndex];
            var isEvenRow = rowIndex % 2 == 0;

            for (var colIndex = 0; colIndex < columnCount; colIndex++)
            {
                var cellValue = colIndex < row.Count ? row[colIndex] : "";
                var alignment = GetColumnAlignment(config.ColumnDefinitions, colIndex);

                table
                    .Cell()
                    .Element(c => ApplyDataCellStyle(c, config, isEvenRow, alignment))
                    .Text(cellValue)
                    .FontSize(config.CellFontSize)
                    .FontColor(config.CellTextColor)
                    .ApplyFontWeight(config.CellFontWeight);
            }
        }
    }

    /// <summary>
    /// Get alignment for a column at the given index.
    /// </summary>
    private static string GetColumnAlignment(List<ColumnDefinition> columns, int index)
    {
        if (index >= 0 && index < columns.Count)
        {
            return columns[index].Align;
        }
        return "left";
    }

    /// <summary>
    /// Apply styling to header cells using the Element pattern.
    /// </summary>
    private static IContainer ApplyHeaderCellStyle(
        IContainer container,
        TableConfig config,
        string alignment
    )
    {
        var styled = container;

        // Apply borders based on style
        styled = ApplyBorder(styled, config, isHeader: true);

        // Apply background
        styled = styled.Background(config.HeaderBackground);

        // Apply padding (vertical and horizontal separately)
        styled = styled
            .PaddingVertical(config.HeaderPaddingVertical)
            .PaddingHorizontal(config.HeaderPaddingHorizontal);

        // Apply vertical alignment
        styled = ApplyVerticalAlignment(styled, config.HeaderVerticalAlign);

        // Apply horizontal alignment
        styled = ApplyHorizontalAlignment(styled, alignment);

        return styled;
    }

    /// <summary>
    /// Apply styling to data cells using the Element pattern.
    /// </summary>
    private static IContainer ApplyDataCellStyle(
        IContainer container,
        TableConfig config,
        bool isEvenRow,
        string alignment
    )
    {
        var styled = container;

        // Apply borders based on style
        styled = ApplyBorder(styled, config, isHeader: false);

        // Apply background (alternating rows or default)
        if (config.AlternateRowColors)
        {
            var backgroundColor = isEvenRow ? config.EvenRowBackground : config.OddRowBackground;
            styled = styled.Background(backgroundColor);
        }

        // Apply padding (vertical and horizontal separately)
        styled = styled
            .PaddingVertical(config.CellPaddingVertical)
            .PaddingHorizontal(config.CellPaddingHorizontal);

        // Apply vertical alignment
        styled = ApplyVerticalAlignment(styled, config.CellVerticalAlign);

        // Apply horizontal alignment
        styled = ApplyHorizontalAlignment(styled, alignment);

        return styled;
    }

    /// <summary>
    /// Apply border styling based on configuration.
    /// Supports: "all" (all cells), "header" (header bottom only), "horizontal", "none"
    /// </summary>
    private static IContainer ApplyBorder(IContainer container, TableConfig config, bool isHeader)
    {
        if (config.BorderWidth <= 0 || config.BorderStyle == "none")
            return container;

        return config.BorderStyle switch
        {
            "all" => container.Border(config.BorderWidth).BorderColor(config.BorderColor),
            "header" when isHeader => container
                .BorderBottom(
                    config.HeaderBorderBottomWidth > 0
                        ? config.HeaderBorderBottomWidth
                        : config.BorderWidth
                )
                .BorderColor(config.HeaderBorderBottomColor ?? config.BorderColor),
            "horizontal" => container
                .BorderHorizontal(config.BorderWidth)
                .BorderColor(config.BorderColor),
            "vertical" => container
                .BorderVertical(config.BorderWidth)
                .BorderColor(config.BorderColor),
            _ => container,
        };
    }

    /// <summary>
    /// Apply vertical alignment to a container.
    /// </summary>
    private static IContainer ApplyVerticalAlignment(IContainer container, string align)
    {
        return align switch
        {
            "top" => container.AlignTop(),
            "bottom" => container.AlignBottom(),
            _ => container.AlignMiddle(),
        };
    }

    /// <summary>
    /// Apply horizontal alignment to a container.
    /// </summary>
    private static IContainer ApplyHorizontalAlignment(IContainer container, string align)
    {
        return align switch
        {
            "center" => container.AlignCenter(),
            "right" => container.AlignRight(),
            _ => container.AlignLeft(),
        };
    }

    /// <summary>
    /// Extract table configuration from properties dictionary.
    /// Provides backward compatibility for legacy property names.
    /// </summary>
    private static TableConfig ExtractTableConfig(Dictionary<string, JsonElement> properties)
    {
        // For backward compatibility, map old padding properties to new ones
        var legacyCellPadding = PropertyHelpers.GetFloat(properties, "cellPadding", 5);
        var legacyHeaderPadding = PropertyHelpers.GetFloat(properties, "headerPadding", 5);

        return new TableConfig(
            // Structure
            ColumnDefinitions: GetColumnDefinitions(properties),
            Headers: PropertyHelpers.GetStringArray(properties, "headers") ?? [],
            Data: PropertyHelpers.GetStringArrayArray(properties, "data") ?? [],
            ShowHeader: PropertyHelpers.GetBool(properties, "showHeader", true),
            // Header styling
            HeaderBackground: PropertyHelpers.GetString(properties, "headerBackground", "#f0f0f0"),
            HeaderTextColor: PropertyHelpers.GetString(properties, "headerTextColor", "#000000"),
            HeaderFontSize: PropertyHelpers.GetFloat(properties, "headerFontSize", 10),
            HeaderFontWeight: PropertyHelpers.GetString(properties, "headerFontWeight", "bold"),
            HeaderPaddingVertical: PropertyHelpers.GetFloat(
                properties,
                "headerPaddingVertical",
                legacyHeaderPadding
            ),
            HeaderPaddingHorizontal: PropertyHelpers.GetFloat(
                properties,
                "headerPaddingHorizontal",
                legacyHeaderPadding
            ),
            HeaderVerticalAlign: PropertyHelpers.GetString(
                properties,
                "headerVerticalAlign",
                "middle"
            ),
            HeaderBorderBottom: PropertyHelpers.GetBool(properties, "headerBorderBottom", false),
            HeaderBorderBottomWidth: PropertyHelpers.GetFloat(
                properties,
                "headerBorderBottomWidth",
                2
            ),
            HeaderBorderBottomColor: PropertyHelpers.GetString(
                properties,
                "headerBorderBottomColor",
                "#000000"
            ),
            // Cell styling
            CellTextColor: PropertyHelpers.GetString(properties, "cellTextColor", "#000000"),
            CellFontSize: PropertyHelpers.GetFloat(properties, "cellFontSize", 10),
            CellFontWeight: PropertyHelpers.GetString(properties, "cellFontWeight", "normal"),
            CellPaddingVertical: PropertyHelpers.GetFloat(
                properties,
                "cellPaddingVertical",
                legacyCellPadding
            ),
            CellPaddingHorizontal: PropertyHelpers.GetFloat(
                properties,
                "cellPaddingHorizontal",
                legacyCellPadding
            ),
            CellVerticalAlign: PropertyHelpers.GetString(properties, "cellVerticalAlign", "middle"),
            // Alternating row colors
            AlternateRowColors: PropertyHelpers.GetBool(properties, "alternateRowColors", false),
            EvenRowBackground: PropertyHelpers.GetString(
                properties,
                "evenRowBackground",
                "#ffffff"
            ),
            OddRowBackground: PropertyHelpers.GetString(properties, "oddRowBackground", "#f9f9f9"),
            // Borders
            BorderStyle: PropertyHelpers.GetString(properties, "borderStyle", "all"),
            BorderWidth: PropertyHelpers.GetFloat(properties, "borderWidth", 1),
            BorderColor: PropertyHelpers.GetString(properties, "borderColor", "#000000")
        );
    }

    /// <summary>
    /// Parse column definitions from properties.
    /// </summary>
    private static List<ColumnDefinition> GetColumnDefinitions(
        Dictionary<string, JsonElement> properties
    )
    {
        var result = new List<ColumnDefinition>();

        if (
            properties.TryGetValue("columnDefinitions", out var element)
            && element.ValueKind == JsonValueKind.Array
        )
        {
            foreach (var item in element.EnumerateArray())
            {
                var type = "relative";
                var width = 1f;
                var align = "left";

                if (
                    item.TryGetProperty("type", out var typeEl)
                    && typeEl.ValueKind == JsonValueKind.String
                )
                {
                    type = typeEl.GetString() ?? "relative";
                }

                if (
                    item.TryGetProperty("width", out var widthEl)
                    && widthEl.ValueKind == JsonValueKind.Number
                )
                {
                    width = (float)widthEl.GetDouble();
                }

                if (
                    item.TryGetProperty("align", out var alignEl)
                    && alignEl.ValueKind == JsonValueKind.String
                )
                {
                    align = alignEl.GetString() ?? "left";
                }

                result.Add(new ColumnDefinition(type, width, align));
            }
        }

        // If no column definitions found, create default ones based on headers or data
        if (result.Count == 0)
        {
            var columnCount = 3; // default

            // Try to determine column count from headers
            if (
                properties.TryGetValue("headers", out var headersEl)
                && headersEl.ValueKind == JsonValueKind.Array
            )
            {
                columnCount = headersEl.GetArrayLength();
            }
            // Or from legacy 'columns' property
            else if (
                properties.TryGetValue("columns", out var columnsEl)
                && columnsEl.ValueKind == JsonValueKind.Number
            )
            {
                columnCount = columnsEl.GetInt32();
            }

            for (var i = 0; i < columnCount; i++)
            {
                result.Add(new ColumnDefinition("relative", 1, "left"));
            }
        }

        return result;
    }
}
