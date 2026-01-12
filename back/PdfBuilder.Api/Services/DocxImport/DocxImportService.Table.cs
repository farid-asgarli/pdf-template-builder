using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using PdfBuilder.Api.Services.DocxImport;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing table parsing methods.
/// </summary>
public partial class DocxImportService
{
    #region Table Parsing

    /// <summary>
    /// Parses a Word table into our intermediate representation.
    /// </summary>
    /// <param name="table">The Word table element.</param>
    /// <param name="mainPart">The main document part (for resolving styles).</param>
    /// <returns>Parsed table or null if empty.</returns>
    private ParsedDocxTable? ParseTableEnhanced(Table table, MainDocumentPart mainPart)
    {
        var rows = table.Elements<TableRow>().ToList();
        if (rows.Count == 0)
            return null;

        var parsed = new ParsedDocxTable
        {
            ElementType = "table",
            Style = GetTableStyleEnhanced(table),
        };

        // Extract column definitions from table grid
        ParseColumnDefinitions(table, parsed);

        // Parse all rows
        var isFirstRow = true;
        foreach (var row in rows)
        {
            var tableRow = ParseTableRow(row, mainPart);
            parsed.TableRows.Add(tableRow);

            // Update column count from actual cell count
            if (parsed.ColumnCount == 0)
            {
                parsed.ColumnCount = tableRow.Cells.Sum(c => c.ColumnSpan);
            }

            // Determine header row
            if (isFirstRow)
            {
                parsed.HasHeaderRow = IsHeaderRow(tableRow);
                isFirstRow = false;
            }
        }

        // Build simplified headers and rows arrays for editor compatibility
        BuildSimplifiedData(parsed);

        // Fill column definitions if not from grid
        EnsureColumnDefinitions(parsed);

        // Compute actual row spans from VMerge restart/continue patterns
        ComputeRowSpans(parsed);

        return parsed;
    }

    /// <summary>
    /// Extracts column definitions from the table grid.
    /// </summary>
    private static void ParseColumnDefinitions(Table table, ParsedDocxTable parsed)
    {
        var tableGrid = table.GetFirstChild<TableGrid>();
        if (tableGrid == null)
            return;

        foreach (var gridCol in tableGrid.Elements<GridColumn>())
        {
            var colDef = new DocxColumnDefinition();

            if (
                gridCol.Width?.Value != null
                && int.TryParse(gridCol.Width.Value, out var widthTwips)
            )
            {
                colDef.Width = widthTwips / DocxConversionConstants.TwipsPerMm;
                colDef.WidthType = "fixed";
                colDef.PreferredWidth = colDef.Width;
            }

            parsed.ColumnDefinitions.Add(colDef);
        }
    }

    /// <summary>
    /// Determines if a row should be treated as a header row.
    /// </summary>
    private static bool IsHeaderRow(DocxTableRow row)
    {
        // Explicitly marked as header
        if (row.IsHeader)
            return true;

        // Heuristic: first row with bold text or background color is likely a header
        return row.Cells.Any(c =>
            c.Runs.Any(r => r.Style.IsBold) || c.Style.BackgroundColor != null
        );
    }

    /// <summary>
    /// Builds the simplified Headers and Rows arrays for editor format compatibility.
    /// </summary>
    private static void BuildSimplifiedData(ParsedDocxTable parsed)
    {
        parsed.Headers.Clear();
        parsed.Rows.Clear();

        for (var i = 0; i < parsed.TableRows.Count; i++)
        {
            var row = parsed.TableRows[i];
            var cellTexts = row.Cells.Select(c => c.Text).ToList();

            if (i == 0 && parsed.HasHeaderRow)
            {
                parsed.Headers = cellTexts;
            }
            else
            {
                parsed.Rows.Add(cellTexts);
            }
        }
    }

    /// <summary>
    /// Ensures column definitions are filled for all columns.
    /// </summary>
    private static void EnsureColumnDefinitions(ParsedDocxTable parsed)
    {
        while (parsed.ColumnDefinitions.Count < parsed.ColumnCount)
        {
            parsed.ColumnDefinitions.Add(new DocxColumnDefinition { WidthType = "auto" });
        }
    }

    /// <summary>
    /// Computes actual row span values by analyzing VMerge restart/continue patterns.
    /// </summary>
    private static void ComputeRowSpans(ParsedDocxTable table)
    {
        if (table.TableRows.Count == 0)
            return;

        var columnCount = table.TableRows.Max(r => r.Cells.Sum(c => c.ColumnSpan));

        // For each column, track the row span
        for (int col = 0; col < columnCount; col++)
        {
            int? rowSpanStartRow = null;

            for (int rowIndex = 0; rowIndex < table.TableRows.Count; rowIndex++)
            {
                var row = table.TableRows[rowIndex];
                var cell = GetCellAtColumn(row, col);

                if (cell == null)
                    continue;

                if (cell.RowSpanType == "restart")
                {
                    // Start counting a new row span
                    rowSpanStartRow = rowIndex;
                    cell.RowSpan = 1;
                }
                else if (cell.RowSpanType == "continue" && rowSpanStartRow.HasValue)
                {
                    // Increment the row span of the starting cell
                    var startCell = GetCellAtColumn(table.TableRows[rowSpanStartRow.Value], col);
                    if (startCell != null)
                    {
                        startCell.RowSpan++;
                    }
                }
                else
                {
                    // No merge, reset tracking
                    rowSpanStartRow = null;
                    cell.RowSpan = 1;
                }
            }
        }
    }

    /// <summary>
    /// Gets the cell at a specific column index, accounting for column spans.
    /// </summary>
    private static DocxTableCell? GetCellAtColumn(DocxTableRow row, int targetColumn)
    {
        int currentColumn = 0;
        foreach (var cell in row.Cells)
        {
            if (currentColumn == targetColumn)
                return cell;

            currentColumn += cell.ColumnSpan;

            if (currentColumn > targetColumn)
                return cell; // Cell spans over target column
        }
        return null;
    }

    private DocxTableRow ParseTableRow(TableRow row, MainDocumentPart mainPart)
    {
        var tableRow = new DocxTableRow();

        // Check if this row is marked as header
        var rowProps = row.TableRowProperties;
        tableRow.IsHeader = rowProps?.GetFirstChild<TableHeader>() != null;

        // Row height
        var rowHeight = rowProps?.GetFirstChild<TableRowHeight>();
        if (rowHeight?.Val?.HasValue == true)
        {
            tableRow.Height = rowHeight.Val.Value / DocxConversionConstants.TwipsPerMm;
            var rule = rowHeight.HeightType?.Value;
            if (rule.HasValue)
            {
                tableRow.HeightRule =
                    rule.Value == HeightRuleValues.Exact ? "exact"
                    : rule.Value == HeightRuleValues.AtLeast ? "atLeast"
                    : "auto";
            }
        }

        foreach (var cell in row.Elements<TableCell>())
        {
            tableRow.Cells.Add(ParseTableCell(cell, mainPart));
        }

        return tableRow;
    }

    private DocxTableCell ParseTableCell(TableCell cell, MainDocumentPart mainPart)
    {
        var tableCell = new DocxTableCell { Text = GetCellText(cell), Style = GetCellStyle(cell) };
        var cellProps = cell.TableCellProperties;

        // Get column span (GridSpan)
        if (cellProps?.GridSpan?.Val?.Value is int gridSpan)
        {
            tableCell.ColumnSpan = gridSpan;
        }

        // Get vertical merge info (VMerge)
        ParseVerticalMerge(cellProps, tableCell);

        // Get cell width
        if (
            cellProps?.TableCellWidth?.Width?.Value != null
            && int.TryParse(cellProps.TableCellWidth.Width.Value, out var widthTwips)
        )
        {
            tableCell.Width = widthTwips / DocxConversionConstants.TwipsPerMm;
        }

        // Parse text runs from paragraphs in cell
        ParseCellContent(cell, mainPart, tableCell);

        return tableCell;
    }

    /// <summary>
    /// Parses vertical merge information from cell properties.
    /// </summary>
    private static void ParseVerticalMerge(TableCellProperties? cellProps, DocxTableCell tableCell)
    {
        var vMerge = cellProps?.VerticalMerge;
        if (vMerge == null)
            return;

        if (vMerge.Val?.Value == MergedCellValues.Restart)
        {
            tableCell.RowSpanType = "restart";
            tableCell.IsMergedContinuation = false;
        }
        else
        {
            // No Val or Val = "continue" means this cell is merged with the one above
            tableCell.RowSpanType = "continue";
            tableCell.IsMergedContinuation = true;
        }
    }

    /// <summary>
    /// Parses text runs from all paragraphs in a cell.
    /// </summary>
    private void ParseCellContent(
        TableCell cell,
        MainDocumentPart mainPart,
        DocxTableCell tableCell
    )
    {
        foreach (var para in cell.Elements<Paragraph>())
        {
            var paragraphStyle = GetParagraphTextStyle(para);
            foreach (var run in para.Elements<Run>())
            {
                var runText = run.InnerText;
                if (!string.IsNullOrEmpty(runText))
                {
                    tableCell.Runs.Add(
                        new ParsedDocxTextRun
                        {
                            Text = runText,
                            Style = GetRunStyle(run, paragraphStyle),
                        }
                    );
                }
            }
        }
    }

    private DocxCellStyle GetCellStyle(TableCell cell)
    {
        var style = new DocxCellStyle();
        var props = cell.TableCellProperties;

        if (props == null)
            return style;

        // Background color (shading)
        ParseCellBackgroundColor(props, style);

        // Vertical alignment
        var vAlign = props.TableCellVerticalAlignment?.Val?.Value;
        if (vAlign.HasValue)
        {
            style.VerticalAlign =
                vAlign.Value == TableVerticalAlignmentValues.Center ? "center"
                : vAlign.Value == TableVerticalAlignmentValues.Bottom ? "bottom"
                : "top";
        }

        // Cell margins/padding
        ParseCellMargins(props, style);

        // Cell borders
        var borders = props.TableCellBorders;
        if (borders != null)
        {
            style.BorderTop = ParseBorder(borders.TopBorder);
            style.BorderBottom = ParseBorder(borders.BottomBorder);
            style.BorderLeft = ParseBorder(borders.LeftBorder);
            style.BorderRight = ParseBorder(borders.RightBorder);
        }

        return style;
    }

    /// <summary>
    /// Parses background color from cell shading.
    /// </summary>
    private static void ParseCellBackgroundColor(TableCellProperties props, DocxCellStyle style)
    {
        var shading = props.Shading;
        if (shading?.Fill?.Value == null || shading.Fill.Value == "auto")
            return;

        style.BackgroundColor = NormalizeColor(shading.Fill.Value);
    }

    /// <summary>
    /// Parses cell margins/padding.
    /// </summary>
    private static void ParseCellMargins(TableCellProperties props, DocxCellStyle style)
    {
        var margins = props.TableCellMargin;
        if (margins == null)
            return;

        if (TryParseMargin(margins.TopMargin?.Width?.Value, out var top))
            style.PaddingTop = top;
        if (TryParseMargin(margins.BottomMargin?.Width?.Value, out var bottom))
            style.PaddingBottom = bottom;
        if (TryParseMargin(margins.LeftMargin?.Width?.Value, out var left))
            style.PaddingLeft = left;
        if (TryParseMargin(margins.RightMargin?.Width?.Value, out var right))
            style.PaddingRight = right;
    }

    /// <summary>
    /// Tries to parse a margin value from twips to mm.
    /// </summary>
    private static bool TryParseMargin(string? value, out double result)
    {
        result = 0;
        if (value == null || !int.TryParse(value, out var twips))
            return false;

        result = twips / DocxConversionConstants.TwipsPerMm;
        return true;
    }

    /// <summary>
    /// Normalizes a color value to include the # prefix.
    /// </summary>
    private static string NormalizeColor(string color)
    {
        return color.StartsWith("#") ? color : $"#{color}";
    }

    private static DocxBorder? ParseBorder(BorderType? border)
    {
        if (border == null)
            return null;

        var val = border.Val?.Value;
        if (val == BorderValues.Nil || val == BorderValues.None)
            return null;

        var docxBorder = new DocxBorder();

        if (border.Color?.Value != null && border.Color.Value != "auto")
        {
            docxBorder.Color = NormalizeColor(border.Color.Value);
        }

        if (border.Size?.HasValue == true)
        {
            docxBorder.Width = border.Size.Value / DocxConversionConstants.EighthsPerPoint;
        }

        // Map border style
        if (val == BorderValues.Single)
            docxBorder.Style = "single";
        else if (val == BorderValues.Double)
            docxBorder.Style = "double";
        else if (val == BorderValues.Dashed)
            docxBorder.Style = "dashed";
        else if (val == BorderValues.Dotted)
            docxBorder.Style = "dotted";
        else if (val == BorderValues.DotDash || val == BorderValues.DotDotDash)
            docxBorder.Style = "dashed";
        else
            docxBorder.Style = "single";

        return docxBorder;
    }

    private string GetCellText(TableCell cell)
    {
        var sb = new StringBuilder();
        foreach (var para in cell.Elements<Paragraph>())
        {
            if (sb.Length > 0)
                sb.Append('\n');
            sb.Append(GetParagraphText(para));
        }
        return sb.ToString().Trim();
    }

    private static DocxTableStyle GetTableStyleEnhanced(Table table)
    {
        var style = new DocxTableStyle();
        var props = table.GetFirstChild<TableProperties>();

        if (props == null)
            return style;

        // Table borders
        ParseTableBorders(props, style);

        // Table width
        ParseTableWidth(props, style);

        // Table alignment
        var justify = props.TableJustification?.Val?.Value;
        if (justify.HasValue)
        {
            style.TableAlignment =
                justify.Value == TableRowAlignmentValues.Center ? "center"
                : justify.Value == TableRowAlignmentValues.Right ? "right"
                : "left";
        }

        // Cell spacing
        if (
            props.TableCellSpacing?.Width?.Value != null
            && int.TryParse(props.TableCellSpacing.Width.Value, out var spacingTwips)
        )
        {
            style.CellSpacing = spacingTwips / DocxConversionConstants.TwipsPerMm;
        }

        // Look for table style that might indicate alternating rows
        ParseBandedRowStyle(props, style);

        return style;
    }

    /// <summary>
    /// Parses table border properties.
    /// </summary>
    private static void ParseTableBorders(TableProperties props, DocxTableStyle style)
    {
        var borders = props.TableBorders;
        if (borders == null)
            return;

        var topBorder = borders.TopBorder;
        if (topBorder?.Color?.HasValue == true)
        {
            var color = topBorder.Color.Value;
            style.BorderColor = color == "auto" ? "#000000" : NormalizeColor(color!);
        }

        if (topBorder?.Size?.HasValue == true)
        {
            style.BorderWidth = topBorder.Size.Value / DocxConversionConstants.EighthsPerPoint;
        }
    }

    /// <summary>
    /// Parses table width properties.
    /// </summary>
    private static void ParseTableWidth(TableProperties props, DocxTableStyle style)
    {
        var tableWidth = props.TableWidth;
        if (tableWidth == null)
            return;

        var widthType = tableWidth.Type?.Value;
        if (widthType.HasValue)
        {
            if (widthType.Value == TableWidthUnitValues.Dxa)
                style.TableWidthType = "fixed";
            else if (widthType.Value == TableWidthUnitValues.Pct)
                style.TableWidthType = "percentage";
            else
                style.TableWidthType = "auto";
        }

        if (
            tableWidth.Width?.Value != null
            && int.TryParse(tableWidth.Width.Value, out var widthVal)
        )
        {
            if (style.TableWidthType == "fixed")
            {
                style.TableWidth = widthVal / DocxConversionConstants.TwipsPerMm;
            }
            else if (style.TableWidthType == "percentage")
            {
                style.TableWidth = widthVal / 50.0; // Pct is in fiftieths of a percent
            }
        }
    }

    /// <summary>
    /// Parses banded row style indicator.
    /// </summary>
    private static void ParseBandedRowStyle(TableProperties props, DocxTableStyle style)
    {
        var tableStyleId = props.TableStyle?.Val?.Value;
        if (string.IsNullOrEmpty(tableStyleId))
            return;

        if (tableStyleId.Contains("Banded", StringComparison.OrdinalIgnoreCase))
        {
            style.AlternateRowColors = true;
            style.OddRowBackground = "#F9F9F9";
            style.EvenRowBackground = "#FFFFFF";
        }
    }

    #endregion
}
