using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using A = DocumentFormat.OpenXml.Drawing;

namespace PdfBuilder.Api.Services;

public partial class DocxImportService
{
    #region Math Equation Extraction

    private void ExtractMathEquations(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        // Find Office Math elements (OMML)
        foreach (var oMath in body.Descendants<DocumentFormat.OpenXml.Math.OfficeMath>())
        {
            try
            {
                var equation = ParseMathEquation(oMath);
                if (equation != null)
                {
                    content.Equations.Add(equation);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse math equation");
            }
        }

        // Find math paragraphs (display equations)
        foreach (var oMathPara in body.Descendants<DocumentFormat.OpenXml.Math.Paragraph>())
        {
            try
            {
                foreach (var oMath in oMathPara.Elements<DocumentFormat.OpenXml.Math.OfficeMath>())
                {
                    var equation = ParseMathEquation(oMath, isInline: false);
                    if (equation != null)
                    {
                        content.Equations.Add(equation);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse math paragraph");
            }
        }
    }

    private ParsedDocxEquation? ParseMathEquation(
        DocumentFormat.OpenXml.Math.OfficeMath oMath,
        bool isInline = true
    )
    {
        var equation = new ParsedDocxEquation
        {
            ElementType = "equation",
            IsInline = isInline,
            OmmlXml = oMath.OuterXml,
            // Extract plain text fallback
            PlainText = ExtractMathPlainText(oMath),

            // Parse components
            Components = ParseMathComponents(oMath),

            // Try to generate LaTeX representation
            LaTeX = ConvertOmmlToLatex(oMath),
        };

        return string.IsNullOrEmpty(equation.PlainText) ? null : equation;
    }

    private string ExtractMathPlainText(OpenXmlElement element)
    {
        var textBuilder = new StringBuilder();

        foreach (var text in element.Descendants<DocumentFormat.OpenXml.Math.Text>())
        {
            textBuilder.Append(text.Text);
        }

        // Also check for Run elements with text
        foreach (var run in element.Descendants<DocumentFormat.OpenXml.Math.Run>())
        {
            foreach (var text in run.Elements<DocumentFormat.OpenXml.Math.Text>())
            {
                textBuilder.Append(text.Text);
            }
        }

        return textBuilder.ToString();
    }

    private List<DocxMathComponent> ParseMathComponents(OpenXmlElement element)
    {
        var components = new List<DocxMathComponent>();

        foreach (var child in element.ChildElements)
        {
            var component = child switch
            {
                DocumentFormat.OpenXml.Math.Fraction fraction
                    when fraction.Numerator != null && fraction.Denominator != null =>
                    new DocxMathComponent
                    {
                        Type = "fraction",
                        Numerator = ParseMathComponents(fraction.Numerator),
                        Denominator = ParseMathComponents(fraction.Denominator),
                    },
                DocumentFormat.OpenXml.Math.Radical radical when radical.Degree != null =>
                    new DocxMathComponent
                    {
                        Type = "radical",
                        Radicand = ParseMathComponents(radical.Degree),
                        Degree = radical.Elements<DocumentFormat.OpenXml.Math.Degree>().Any()
                            ? ParseMathComponents(
                                radical.Elements<DocumentFormat.OpenXml.Math.Degree>().First()
                            )
                            : null,
                    },
                DocumentFormat.OpenXml.Math.Superscript superscript
                    when superscript.Base != null && superscript.SuperArgument != null =>
                    new DocxMathComponent
                    {
                        Type = "superscript",
                        Base = ParseMathComponents(superscript.Base),
                        Script = ParseMathComponents(superscript.SuperArgument),
                    },
                DocumentFormat.OpenXml.Math.Subscript subscript
                    when subscript.Base != null && subscript.SubArgument != null =>
                    new DocxMathComponent
                    {
                        Type = "subscript",
                        Base = ParseMathComponents(subscript.Base),
                        Script = ParseMathComponents(subscript.SubArgument),
                    },
                DocumentFormat.OpenXml.Math.SubSuperscript subSup
                    when subSup.Base != null
                        && subSup.SubArgument != null
                        && subSup.SuperArgument != null => new DocxMathComponent
                {
                    Type = "subsuperscript",
                    Base = ParseMathComponents(subSup.Base),
                    Script = ParseMathComponents(subSup.SubArgument),
                    Children = ParseMathComponents(subSup.SuperArgument),
                },
                DocumentFormat.OpenXml.Math.Nary nary
                    when nary.SubArgument != null
                        && nary.SuperArgument != null
                        && nary.Base != null => new DocxMathComponent
                {
                    Type = GetNaryType(nary),
                    LowerLimit = ParseMathComponents(nary.SubArgument),
                    UpperLimit = ParseMathComponents(nary.SuperArgument),
                    Children = ParseMathComponents(nary.Base),
                },
                DocumentFormat.OpenXml.Math.Matrix matrix => ParseMatrixComponent(matrix),
                DocumentFormat.OpenXml.Math.Run mathRun => new DocxMathComponent
                {
                    Type = "text",
                    Text = ExtractMathPlainText(mathRun),
                },
                DocumentFormat.OpenXml.Math.Delimiter delimiter => new DocxMathComponent
                {
                    Type = "delimiter",
                    Children = delimiter
                        .Elements<DocumentFormat.OpenXml.Math.Base>()
                        .SelectMany(b => ParseMathComponents(b))
                        .ToList(),
                },
                DocumentFormat.OpenXml.Math.Bar bar when bar.Base != null => new DocxMathComponent
                {
                    Type = "bar",
                    Base = ParseMathComponents(bar.Base),
                },
                DocumentFormat.OpenXml.Math.Accent accent when accent.Base != null =>
                    new DocxMathComponent
                    {
                        Type = "accent",
                        Base = ParseMathComponents(accent.Base),
                    },
                _ => null,
            };

            if (component != null)
            {
                components.Add(component);
            }
        }

        return components;
    }

    private string GetNaryType(DocumentFormat.OpenXml.Math.Nary nary)
    {
        var naryPr = nary.NaryProperties;
        var chr = naryPr?.GetFirstChild<DocumentFormat.OpenXml.Math.AccentChar>()?.Val?.Value;

        return chr switch
        {
            "∑" => "sum",
            "∏" => "product",
            "∫" => "integral",
            "∮" => "contourIntegral",
            "∬" => "doubleIntegral",
            "∭" => "tripleIntegral",
            "⋃" => "union",
            "⋂" => "intersection",
            _ => "nary",
        };
    }

    private DocxMathComponent ParseMatrixComponent(DocumentFormat.OpenXml.Math.Matrix matrix)
    {
        var component = new DocxMathComponent { Type = "matrix", MatrixRows = [] };

        foreach (var matrixRow in matrix.Elements<DocumentFormat.OpenXml.Math.MatrixRow>())
        {
            var row = new List<DocxMathComponent>();
            foreach (var matrixCell in matrixRow.Elements<DocumentFormat.OpenXml.Math.Base>())
            {
                var cellComponents = ParseMathComponents(matrixCell);
                row.Add(new DocxMathComponent { Type = "cell", Children = cellComponents });
            }
            component.MatrixRows.Add(row);
        }

        return component;
    }

    private string? ConvertOmmlToLatex(DocumentFormat.OpenXml.Math.OfficeMath oMath)
    {
        // Basic OMML to LaTeX conversion - simplified implementation
        try
        {
            var latex = new StringBuilder();
            ConvertElementToLatex(oMath, latex);
            var result = latex.ToString().Trim();
            return string.IsNullOrEmpty(result) ? null : result;
        }
        catch
        {
            return null;
        }
    }

    private void ConvertElementToLatex(OpenXmlElement element, StringBuilder latex)
    {
        foreach (var child in element.ChildElements)
        {
            switch (child)
            {
                case DocumentFormat.OpenXml.Math.Fraction fraction:
                    latex.Append(@"\frac{");
                    if (fraction.Numerator != null)
                        ConvertElementToLatex(fraction.Numerator, latex);
                    latex.Append("}{");
                    if (fraction.Denominator != null)
                        ConvertElementToLatex(fraction.Denominator, latex);
                    latex.Append("}");
                    break;

                case DocumentFormat.OpenXml.Math.Radical radical:
                    var hasDegree = radical.Elements<DocumentFormat.OpenXml.Math.Degree>().Any();
                    if (hasDegree)
                    {
                        latex.Append(@"\sqrt[");
                        ConvertElementToLatex(
                            radical.Elements<DocumentFormat.OpenXml.Math.Degree>().First(),
                            latex
                        );
                        latex.Append("]{");
                    }
                    else
                    {
                        latex.Append(@"\sqrt{");
                    }
                    if (radical.Degree != null)
                        ConvertElementToLatex(radical.Degree, latex);
                    latex.Append("}");
                    break;

                case DocumentFormat.OpenXml.Math.Superscript superscript:
                    if (superscript.Base != null)
                        ConvertElementToLatex(superscript.Base, latex);
                    latex.Append("^{");
                    if (superscript.SuperArgument != null)
                        ConvertElementToLatex(superscript.SuperArgument, latex);
                    latex.Append("}");
                    break;

                case DocumentFormat.OpenXml.Math.Subscript subscript:
                    if (subscript.Base != null)
                        ConvertElementToLatex(subscript.Base, latex);
                    latex.Append("_{");
                    if (subscript.SubArgument != null)
                        ConvertElementToLatex(subscript.SubArgument, latex);
                    latex.Append("}");
                    break;

                case DocumentFormat.OpenXml.Math.SubSuperscript subSup:
                    if (subSup.Base != null)
                        ConvertElementToLatex(subSup.Base, latex);
                    latex.Append("_{");
                    if (subSup.SubArgument != null)
                        ConvertElementToLatex(subSup.SubArgument, latex);
                    latex.Append("}^{");
                    if (subSup.SuperArgument != null)
                        ConvertElementToLatex(subSup.SuperArgument, latex);
                    latex.Append("}");
                    break;

                case DocumentFormat.OpenXml.Math.Nary nary:
                    var naryType = GetNaryType(nary);
                    var latexCmd = naryType switch
                    {
                        "sum" => @"\sum",
                        "product" => @"\prod",
                        "integral" => @"\int",
                        "contourIntegral" => @"\oint",
                        "doubleIntegral" => @"\iint",
                        "tripleIntegral" => @"\iiint",
                        "union" => @"\bigcup",
                        "intersection" => @"\bigcap",
                        _ => @"\sum",
                    };
                    latex.Append(latexCmd);
                    latex.Append("_{");
                    if (nary.SubArgument != null)
                        ConvertElementToLatex(nary.SubArgument, latex);
                    latex.Append("}^{");
                    if (nary.SuperArgument != null)
                        ConvertElementToLatex(nary.SuperArgument, latex);
                    latex.Append("}");
                    if (nary.Base != null)
                        ConvertElementToLatex(nary.Base, latex);
                    break;

                case DocumentFormat.OpenXml.Math.Delimiter delimiter:
                    var begChar =
                        delimiter
                            .DelimiterProperties?.GetFirstChild<DocumentFormat.OpenXml.Math.BeginChar>()
                            ?.Val?.Value ?? "(";
                    var endChar =
                        delimiter
                            .DelimiterProperties?.GetFirstChild<DocumentFormat.OpenXml.Math.EndChar>()
                            ?.Val?.Value ?? ")";
                    latex.Append(@"\left");
                    latex.Append(begChar);
                    foreach (var baseEl in delimiter.Elements<DocumentFormat.OpenXml.Math.Base>())
                    {
                        ConvertElementToLatex(baseEl, latex);
                    }
                    latex.Append(@"\right");
                    latex.Append(endChar);
                    break;

                case DocumentFormat.OpenXml.Math.Run mathRun:
                    latex.Append(ExtractMathPlainText(mathRun));
                    break;

                case DocumentFormat.OpenXml.Math.Text mathText:
                    latex.Append(mathText.Text);
                    break;

                default:
                    ConvertElementToLatex(child, latex);
                    break;
            }
        }
    }

    #endregion

    #region Chart Extraction

    private void ExtractCharts(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        // Charts are typically in ChartParts
        foreach (var chartPart in mainPart.ChartParts)
        {
            try
            {
                var chart = ParseChart(chartPart);
                if (chart != null)
                {
                    content.Charts.Add(chart);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse chart");
            }
        }
    }

    private ParsedDocxChart? ParseChart(ChartPart chartPart)
    {
        var chartSpace = chartPart.ChartSpace;
        if (chartSpace == null)
            return null;

        var chart = chartSpace.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.Chart>();
        if (chart == null)
            return null;

        var plotArea = chart.PlotArea;
        if (plotArea == null)
            return null;

        var parsedChart = new ParsedDocxChart
        {
            ElementType = "chart",
            Title = ExtractChartTitle(chart),
        };

        // Determine chart type and extract data
        var (chartType, series) = ExtractChartTypeAndData(plotArea);
        parsedChart.ChartType = chartType;
        parsedChart.Series = series;

        // Extract categories
        parsedChart.Categories = ExtractChartCategories(plotArea);

        // Extract legend position
        var legend = chart.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.Legend>();
        if (legend != null)
        {
            parsedChart.LegendPosition = GetLegendPosition(legend);
        }

        // Try to extract rendered image
        parsedChart.RenderedImage = ExtractChartImage(chartPart);

        return parsedChart;
    }

    private string? ExtractChartTitle(DocumentFormat.OpenXml.Drawing.Charts.Chart chart)
    {
        var title = chart.Title;
        if (title == null)
            return null;

        var txPr = title.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.ChartText>();
        var richText = txPr?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.RichText>();

        if (richText != null)
        {
            return string.Join("", richText.Descendants<A.Text>().Select(t => t.Text));
        }

        return null;
    }

    private (string chartType, List<DocxChartSeries> series) ExtractChartTypeAndData(
        DocumentFormat.OpenXml.Drawing.Charts.PlotArea plotArea
    )
    {
        var series = new List<DocxChartSeries>();
        string chartType = "unknown";

        // Bar chart
        var barChart = plotArea.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.BarChart>();
        if (barChart != null)
        {
            chartType = "bar";
            series.AddRange(ExtractBarChartSeries(barChart));
        }

        // Line chart
        var lineChart = plotArea.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.LineChart>();
        if (lineChart != null)
        {
            chartType = "line";
            series.AddRange(ExtractLineChartSeries(lineChart));
        }

        // Pie chart
        var pieChart = plotArea.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.PieChart>();
        if (pieChart != null)
        {
            chartType = "pie";
            series.AddRange(ExtractPieChartSeries(pieChart));
        }

        // Area chart
        var areaChart = plotArea.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.AreaChart>();
        if (areaChart != null)
        {
            chartType = "area";
            series.AddRange(ExtractAreaChartSeries(areaChart));
        }

        // Scatter chart
        var scatterChart =
            plotArea.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.ScatterChart>();
        if (scatterChart != null)
        {
            chartType = "scatter";
        }

        // Doughnut chart
        var doughnutChart =
            plotArea.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.DoughnutChart>();
        if (doughnutChart != null)
        {
            chartType = "doughnut";
        }

        return (chartType, series);
    }

    private List<DocxChartSeries> ExtractBarChartSeries(
        DocumentFormat.OpenXml.Drawing.Charts.BarChart barChart
    )
    {
        var series = new List<DocxChartSeries>();

        foreach (
            var ser in barChart.Elements<DocumentFormat.OpenXml.Drawing.Charts.BarChartSeries>()
        )
        {
            var chartSeries = new DocxChartSeries
            {
                Name = ExtractSeriesName(ser),
                Values = ExtractSeriesValues(ser),
            };
            series.Add(chartSeries);
        }

        return series;
    }

    private List<DocxChartSeries> ExtractLineChartSeries(
        DocumentFormat.OpenXml.Drawing.Charts.LineChart lineChart
    )
    {
        var series = new List<DocxChartSeries>();

        foreach (
            var ser in lineChart.Elements<DocumentFormat.OpenXml.Drawing.Charts.LineChartSeries>()
        )
        {
            var chartSeries = new DocxChartSeries
            {
                Name = ExtractSeriesName(ser),
                Values = ExtractSeriesValues(ser),
            };
            series.Add(chartSeries);
        }

        return series;
    }

    private List<DocxChartSeries> ExtractPieChartSeries(
        DocumentFormat.OpenXml.Drawing.Charts.PieChart pieChart
    )
    {
        var series = new List<DocxChartSeries>();

        foreach (
            var ser in pieChart.Elements<DocumentFormat.OpenXml.Drawing.Charts.PieChartSeries>()
        )
        {
            var chartSeries = new DocxChartSeries
            {
                Name = ExtractSeriesName(ser),
                Values = ExtractSeriesValues(ser),
            };
            series.Add(chartSeries);
        }

        return series;
    }

    private List<DocxChartSeries> ExtractAreaChartSeries(
        DocumentFormat.OpenXml.Drawing.Charts.AreaChart areaChart
    )
    {
        var series = new List<DocxChartSeries>();

        foreach (
            var ser in areaChart.Elements<DocumentFormat.OpenXml.Drawing.Charts.AreaChartSeries>()
        )
        {
            var chartSeries = new DocxChartSeries
            {
                Name = ExtractSeriesName(ser),
                Values = ExtractSeriesValues(ser),
            };
            series.Add(chartSeries);
        }

        return series;
    }

    private string ExtractSeriesName(OpenXmlElement series)
    {
        var seriesText = series.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.SeriesText>();
        var stringRef =
            seriesText?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.StringReference>();
        var stringCache =
            stringRef?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.StringCache>();
        var pt = stringCache?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.StringPoint>();
        var numericValue = pt?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.NumericValue>();

        return numericValue?.Text ?? $"Series {series.GetHashCode()}";
    }

    private List<double> ExtractSeriesValues(OpenXmlElement series)
    {
        var values = new List<double>();

        var val = series.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.Values>();
        var numRef = val?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.NumberReference>();
        var numCache =
            numRef?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.NumberingCache>();

        if (numCache != null)
        {
            foreach (
                var pt in numCache.Elements<DocumentFormat.OpenXml.Drawing.Charts.NumericPoint>()
            )
            {
                var numVal = pt.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.NumericValue>();
                if (numVal?.Text != null && double.TryParse(numVal.Text, out var dVal))
                {
                    values.Add(dVal);
                }
            }
        }

        return values;
    }

    private List<string> ExtractChartCategories(
        DocumentFormat.OpenXml.Drawing.Charts.PlotArea plotArea
    )
    {
        var categories = new List<string>();

        // Try to get categories from the first series
        var seriesElement = plotArea
            .Descendants<DocumentFormat.OpenXml.Drawing.Charts.CategoryAxisData>()
            .FirstOrDefault();
        var stringRef =
            seriesElement?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.StringReference>();
        var stringCache =
            stringRef?.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.StringCache>();

        if (stringCache != null)
        {
            foreach (
                var pt in stringCache.Elements<DocumentFormat.OpenXml.Drawing.Charts.StringPoint>()
            )
            {
                var numVal = pt.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.NumericValue>();
                if (numVal?.Text != null)
                {
                    categories.Add(numVal.Text);
                }
            }
        }

        return categories;
    }

    private string GetLegendPosition(DocumentFormat.OpenXml.Drawing.Charts.Legend legend)
    {
        var legendPos =
            legend.GetFirstChild<DocumentFormat.OpenXml.Drawing.Charts.LegendPosition>();
        var val = legendPos?.Val?.Value;

        if (val == null)
            return "bottom";

        if (val == DocumentFormat.OpenXml.Drawing.Charts.LegendPositionValues.Bottom)
            return "bottom";
        if (val == DocumentFormat.OpenXml.Drawing.Charts.LegendPositionValues.Top)
            return "top";
        if (val == DocumentFormat.OpenXml.Drawing.Charts.LegendPositionValues.Left)
            return "left";
        if (val == DocumentFormat.OpenXml.Drawing.Charts.LegendPositionValues.Right)
            return "right";
        if (val == DocumentFormat.OpenXml.Drawing.Charts.LegendPositionValues.TopRight)
            return "right";

        return "bottom";
    }

    private string? ExtractChartImage(ChartPart chartPart)
    {
        // Charts may have an image part for preview
        try
        {
            var imagePart = chartPart.ImageParts.FirstOrDefault();
            if (imagePart != null)
            {
                using var stream = imagePart.GetStream();
                using var memoryStream = new MemoryStream();
                stream.CopyTo(memoryStream);
                var bytes = memoryStream.ToArray();
                return "data:image/png;base64," + Convert.ToBase64String(bytes);
            }
        }
        catch
        {
            // Ignore
        }

        return null;
    }

    #endregion

    #region SmartArt Extraction

    private void ExtractSmartArt(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        // SmartArt is represented as DrawingML diagrams
        foreach (var diagramDataPart in mainPart.DiagramDataParts)
        {
            try
            {
                var smartArt = ParseSmartArt(diagramDataPart);
                if (smartArt != null)
                {
                    content.SmartArt.Add(smartArt);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse SmartArt diagram");
            }
        }
    }

    private ParsedDocxSmartArt? ParseSmartArt(DiagramDataPart diagramDataPart)
    {
        var dataModelRoot = diagramDataPart.DataModelRoot;
        if (dataModelRoot == null)
            return null;

        var smartArt = new ParsedDocxSmartArt
        {
            ElementType = "smartArt",
            DiagramType = "hierarchy", // Default, will be updated based on layout
        };

        // Extract nodes from the data model
        var ptLst =
            dataModelRoot.GetFirstChild<DocumentFormat.OpenXml.Drawing.Diagrams.PointList>();
        if (ptLst != null)
        {
            foreach (var pt in ptLst.Elements<DocumentFormat.OpenXml.Drawing.Diagrams.Point>())
            {
                var modelId = pt.ModelId?.Value ?? "";
                var textBody = pt.GetFirstChild<DocumentFormat.OpenXml.Drawing.Diagrams.TextBody>();

                if (textBody != null)
                {
                    var text = string.Join("", textBody.Descendants<A.Text>().Select(t => t.Text));
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        smartArt.Nodes.Add(
                            new DocxSmartArtNode
                            {
                                Text = text,
                                Level = 0, // TODO: Calculate from connections
                            }
                        );
                    }
                }
            }
        }

        return smartArt.Nodes.Count > 0 ? smartArt : null;
    }

    #endregion

    #region Form Field Extraction

    private void ExtractFormFields(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        // Legacy form fields (fldChar)
        foreach (var ffData in body.Descendants<FormFieldData>())
        {
            try
            {
                var formField = ParseFormField(ffData);
                if (formField != null)
                {
                    content.FormFields.Add(formField);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse form field");
            }
        }
    }

    private ParsedDocxFormField? ParseFormField(FormFieldData ffData)
    {
        var formField = new ParsedDocxFormField
        {
            ElementType = "formField",
            Name = ffData.GetFirstChild<FormFieldName>()?.Val?.Value ?? "",
            BookmarkName = ffData.GetFirstChild<FormFieldName>()?.Val?.Value,
        };

        // Text input
        var textInput = ffData.GetFirstChild<TextInput>();
        if (textInput != null)
        {
            formField.FieldType = "text";
            formField.DefaultValue = textInput
                .GetFirstChild<DefaultTextBoxFormFieldString>()
                ?.Val?.Value;
            var maxLength = textInput.GetFirstChild<MaxLength>();
            if (maxLength?.Val?.Value != null)
            {
                formField.MaxLength = (int)maxLength.Val.Value;
            }
        }

        // Checkbox
        var checkBox = ffData.GetFirstChild<CheckBox>();
        if (checkBox != null)
        {
            formField.FieldType = "checkbox";
            formField.IsChecked =
                checkBox.GetFirstChild<Checked>() != null
                || checkBox.GetFirstChild<DefaultCheckBoxFormFieldState>()?.Val?.Value == true;
        }

        // Dropdown
        var ddList = ffData.GetFirstChild<DropDownListFormField>();
        if (ddList != null)
        {
            formField.FieldType = "dropdown";
            foreach (var entry in ddList.Elements<ListEntryFormField>())
            {
                if (entry.Val?.Value != null)
                {
                    formField.Options.Add(entry.Val.Value);
                }
            }
            var result = ddList.GetFirstChild<DropDownListSelection>();
            if (result?.Val?.Value != null)
            {
                formField.SelectedIndex = (int)result.Val.Value;
            }
        }

        // Help text
        var helpText = ffData.GetFirstChild<HelpText>();
        if (helpText?.Val?.Value != null)
        {
            formField.HelpText = helpText.Val.Value;
        }

        // Status text
        var statusText = ffData.GetFirstChild<StatusText>();
        if (statusText?.Val?.Value != null)
        {
            formField.StatusText = statusText.Val.Value;
        }

        // Enabled
        var enabled = ffData.GetFirstChild<Enabled>();
        formField.IsEnabled = enabled?.Val?.Value != false;

        return string.IsNullOrEmpty(formField.FieldType) ? null : formField;
    }

    #endregion

    #region Content Control Extraction

    private void ExtractContentControls(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        // Structured Document Tags (SDT)
        foreach (var sdt in body.Descendants<SdtElement>())
        {
            try
            {
                var contentControl = ParseContentControl(sdt);
                if (contentControl != null)
                {
                    content.ContentControls.Add(contentControl);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse content control");
            }
        }
    }

    private ParsedDocxContentControl? ParseContentControl(SdtElement sdt)
    {
        var properties = sdt.GetFirstChild<SdtProperties>();
        if (properties == null)
            return null;

        var control = new ParsedDocxContentControl
        {
            ElementType = "contentControl",
            Id = properties.GetFirstChild<SdtId>()?.Val?.Value.ToString() ?? "",
            Tag = properties.GetFirstChild<Tag>()?.Val?.Value,
            Title = properties.GetFirstChild<SdtAlias>()?.Val?.Value,
        };

        // Determine control type by looking for specific content type elements
        // Checkbox - check for W14 checkbox element (Word 2010+)
        var w14Ns = "http://schemas.microsoft.com/office/word/2010/wordml";
        var checkBoxEl = properties
            .Elements()
            .FirstOrDefault(e => e.LocalName == "checkbox" && e.NamespaceUri == w14Ns);

        if (checkBoxEl != null)
        {
            control.ControlType = "checkbox";
            // Try to get checked state from child elements
            var checkedEl = checkBoxEl.Elements().FirstOrDefault(e => e.LocalName == "checked");
            if (checkedEl != null)
            {
                var val = checkedEl.GetAttribute("val", w14Ns);
                control.IsChecked = val.Value == "1";
            }
        }
        else if (properties.GetFirstChild<SdtContentDate>() != null)
        {
            control.ControlType = "date";
            var datePicker = properties.GetFirstChild<SdtContentDate>();
            control.DateFormat = datePicker?.DateFormat?.Val?.Value;
            var fullDate = datePicker?.FullDate;
            if (fullDate?.Value != null)
            {
                control.DateValue = fullDate.Value;
            }
        }
        else if (properties.GetFirstChild<SdtContentDropDownList>() != null)
        {
            control.ControlType = "dropdownList";
            var dropDown = properties.GetFirstChild<SdtContentDropDownList>();
            if (dropDown != null)
            {
                foreach (var item in dropDown.Elements<ListItem>())
                {
                    control.Items.Add(
                        new DocxListItem
                        {
                            DisplayText = item.DisplayText?.Value ?? "",
                            Value = item.Value?.Value ?? "",
                        }
                    );
                }
            }
        }
        else if (properties.GetFirstChild<SdtContentComboBox>() != null)
        {
            control.ControlType = "comboBox";
            var comboBox = properties.GetFirstChild<SdtContentComboBox>();
            if (comboBox != null)
            {
                foreach (var item in comboBox.Elements<ListItem>())
                {
                    control.Items.Add(
                        new DocxListItem
                        {
                            DisplayText = item.DisplayText?.Value ?? "",
                            Value = item.Value?.Value ?? "",
                        }
                    );
                }
            }
        }
        else if (properties.GetFirstChild<SdtContentPicture>() != null)
        {
            control.ControlType = "picture";
        }
        else if (
            properties.GetFirstChild<SdtContentText>() != null
            && properties.GetFirstChild<SdtContentText>()?.MultiLine?.Value == true
        )
        {
            control.ControlType = "richText";
        }
        else
        {
            control.ControlType = "plainText";
        }

        // Lock settings
        var lock_ = properties.GetFirstChild<Lock>();
        if (lock_ != null)
        {
            var lockVal = lock_.Val?.Value;
            if (lockVal != null)
            {
                control.IsLocked =
                    lockVal == LockingValues.SdtLocked || lockVal == LockingValues.SdtContentLocked;
                control.IsEditable = lockVal != LockingValues.SdtContentLocked;
            }
        }

        // Placeholder text
        var placeholder = properties.GetFirstChild<SdtPlaceholder>();
        var docPart = placeholder?.DocPartReference;
        if (docPart?.Val?.Value != null)
        {
            control.Placeholder = docPart.Val.Value;
        }

        // Content
        var content =
            sdt.GetFirstChild<SdtContentBlock>()
            ?? (OpenXmlElement?)sdt.GetFirstChild<SdtContentRun>();
        if (content != null)
        {
            control.TextContent = content.InnerText;
        }

        // Data binding
        var dataBinding = properties.GetFirstChild<DataBinding>();
        if (dataBinding != null)
        {
            control.DataBinding = dataBinding.XPath?.Value;
        }

        return control;
    }

    #endregion

    #region Tracked Changes Extraction

    private void ExtractRevisions(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        // Extract revision settings from document settings
        var settings = mainPart.DocumentSettingsPart?.Settings;
        if (settings != null)
        {
            content.RevisionSettings = new DocxRevisionSettings
            {
                TrackRevisions = settings.GetFirstChild<TrackRevisions>() != null,
            };
        }

        // Insertions
        foreach (var ins in body.Descendants<InsertedRun>())
        {
            try
            {
                var revision = new ParsedDocxRevision
                {
                    Id = int.TryParse(ins.Id?.Value, out var id) ? id : 0,
                    RevisionType = "insert",
                    Author = ins.Author?.Value ?? "Unknown",
                    Date = ins.Date?.Value,
                    Text = ins.InnerText,
                };
                content.Revisions.Add(revision);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse insertion revision");
            }
        }

        // Deletions
        foreach (var del in body.Descendants<DeletedRun>())
        {
            try
            {
                var revision = new ParsedDocxRevision
                {
                    Id = int.TryParse(del.Id?.Value, out var id) ? id : 0,
                    RevisionType = "delete",
                    Author = del.Author?.Value ?? "Unknown",
                    Date = del.Date?.Value,
                    Text = del.InnerText,
                };
                content.Revisions.Add(revision);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse deletion revision");
            }
        }

        // Deleted text (within DeletedRun)
        foreach (var delText in body.Descendants<DeletedText>())
        {
            var parentDel = delText.Ancestors<DeletedRun>().FirstOrDefault();
            if (parentDel == null)
            {
                var revision = new ParsedDocxRevision
                {
                    RevisionType = "delete",
                    Text = delText.Text,
                };
                content.Revisions.Add(revision);
            }
        }

        // Format changes
        foreach (var rPrChange in body.Descendants<RunPropertiesChange>())
        {
            try
            {
                var revision = new ParsedDocxRevision
                {
                    Id = int.TryParse(rPrChange.Id?.Value, out var id) ? id : 0,
                    RevisionType = "formatChange",
                    Author = rPrChange.Author?.Value ?? "Unknown",
                    Date = rPrChange.Date?.Value,
                };

                // Previous style - use GetFirstChild to find properties
                var prevRPr = rPrChange.GetFirstChild<RunProperties>();
                if (prevRPr != null)
                {
                    revision.PreviousStyle = new DocxTextStyle
                    {
                        IsBold = prevRPr.GetFirstChild<Bold>() != null,
                        IsItalic = prevRPr.GetFirstChild<Italic>() != null,
                        IsUnderline =
                            prevRPr.GetFirstChild<Underline>() != null
                            && prevRPr.GetFirstChild<Underline>()?.Val?.Value
                                != UnderlineValues.None,
                    };
                }

                content.Revisions.Add(revision);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse format change revision");
            }
        }
    }

    #endregion

    #region Theme Extraction

    private void ExtractTheme(WordprocessingDocument wordDocument, ParsedDocxContent content)
    {
        var themePart = wordDocument.MainDocumentPart?.ThemePart;
        if (themePart?.Theme == null)
            return;

        var theme = themePart.Theme;
        var parsedTheme = new ParsedDocxTheme
        {
            Name = theme.ThemeElements?.GetFirstChild<A.Theme>()?.Name?.Value ?? "Office Theme",
        };

        // Color scheme
        var colorScheme = theme.ThemeElements?.ColorScheme;
        if (colorScheme != null)
        {
            parsedTheme.ColorScheme = new DocxColorScheme
            {
                Name = colorScheme.Name?.Value ?? "",
                Dark1 = GetThemeColor(colorScheme.Dark1Color),
                Light1 = GetThemeColor(colorScheme.Light1Color),
                Dark2 = GetThemeColor(colorScheme.Dark2Color),
                Light2 = GetThemeColor(colorScheme.Light2Color),
                Accent1 = GetThemeColor(colorScheme.Accent1Color),
                Accent2 = GetThemeColor(colorScheme.Accent2Color),
                Accent3 = GetThemeColor(colorScheme.Accent3Color),
                Accent4 = GetThemeColor(colorScheme.Accent4Color),
                Accent5 = GetThemeColor(colorScheme.Accent5Color),
                Accent6 = GetThemeColor(colorScheme.Accent6Color),
                Hyperlink = GetThemeColor(colorScheme.Hyperlink),
                FollowedHyperlink = GetThemeColor(colorScheme.FollowedHyperlinkColor),
            };
        }

        // Font scheme
        var fontScheme = theme.ThemeElements?.FontScheme;
        if (fontScheme != null)
        {
            parsedTheme.FontScheme = new DocxFontScheme
            {
                Name = fontScheme.Name?.Value ?? "",
                MajorLatin = fontScheme.MajorFont?.LatinFont?.Typeface?.Value ?? "Calibri Light",
                MajorEastAsian = fontScheme.MajorFont?.EastAsianFont?.Typeface?.Value,
                MajorComplexScript = fontScheme.MajorFont?.ComplexScriptFont?.Typeface?.Value,
                MinorLatin = fontScheme.MinorFont?.LatinFont?.Typeface?.Value ?? "Calibri",
                MinorEastAsian = fontScheme.MinorFont?.EastAsianFont?.Typeface?.Value,
                MinorComplexScript = fontScheme.MinorFont?.ComplexScriptFont?.Typeface?.Value,
            };
        }

        content.Theme = parsedTheme;
    }

    private string GetThemeColor(A.Color2Type? colorType)
    {
        if (colorType == null)
            return "#000000";

        var srgb = colorType.RgbColorModelHex;
        if (srgb?.Val?.Value != null)
        {
            return "#" + srgb.Val.Value;
        }

        var sysColor = colorType.SystemColor;
        if (sysColor?.LastColor?.Value != null)
        {
            return "#" + sysColor.LastColor.Value;
        }

        return "#000000";
    }

    #endregion

    #region Style Extraction

    private void ExtractStyles(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var stylesPart = mainPart.StyleDefinitionsPart;
        if (stylesPart?.Styles == null)
            return;

        foreach (var style in stylesPart.Styles.Elements<Style>())
        {
            try
            {
                var parsedStyle = ParseStyle(style);
                if (parsedStyle != null)
                {
                    content.Styles.Add(parsedStyle);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse style");
            }
        }
    }

    private ParsedDocxStyle? ParseStyle(Style style)
    {
        if (string.IsNullOrEmpty(style.StyleId?.Value))
            return null;

        var parsedStyle = new ParsedDocxStyle
        {
            StyleId = style.StyleId.Value,
            Name = style.StyleName?.Val?.Value ?? style.StyleId.Value,
            BasedOn = style.BasedOn?.Val?.Value,
            NextStyle = style.NextParagraphStyle?.Val?.Value,
            IsDefault = style.Default?.Value == true,
            IsHidden = style.SemiHidden != null || style.UnhideWhenUsed != null,
            QuickFormat = style.PrimaryStyle != null,
        };

        // Determine style type
        var styleType = style.Type?.Value;
        if (styleType != null)
        {
            if (styleType == StyleValues.Paragraph)
                parsedStyle.StyleType = "paragraph";
            else if (styleType == StyleValues.Character)
                parsedStyle.StyleType = "character";
            else if (styleType == StyleValues.Table)
                parsedStyle.StyleType = "table";
            else if (styleType == StyleValues.Numbering)
                parsedStyle.StyleType = "numbering";
            else
                parsedStyle.StyleType = "unknown";
        }

        // Priority
        var priority = style.UIPriority;
        if (priority?.Val?.Value != null)
        {
            parsedStyle.Priority = priority.Val.Value;
        }

        // Paragraph properties
        var pPr = style.StyleParagraphProperties;
        if (pPr != null)
        {
            parsedStyle.ParagraphStyle = ParseParagraphPropertiesForStyle(pPr);
        }

        // Run properties
        var rPr = style.StyleRunProperties;
        if (rPr != null)
        {
            parsedStyle.TextStyle = ParseRunPropertiesForStyle(rPr);
        }

        return parsedStyle;
    }

    private DocxParagraphStyle ParseParagraphPropertiesForStyle(StyleParagraphProperties pPr)
    {
        var style = new DocxParagraphStyle();

        // Spacing
        var spacing = pPr.GetFirstChild<SpacingBetweenLines>();
        if (spacing != null)
        {
            if (spacing.Before?.Value != null)
                style.SpaceBefore = double.Parse(spacing.Before.Value) / TWIPS_PER_MM;
            if (spacing.After?.Value != null)
                style.SpaceAfter = double.Parse(spacing.After.Value) / TWIPS_PER_MM;
            if (spacing.Line?.Value != null)
                style.LineSpacing = double.Parse(spacing.Line.Value) / 240.0; // 240 twips = single line
        }

        // Indentation
        var ind = pPr.GetFirstChild<Indentation>();
        if (ind != null)
        {
            if (ind.Left?.Value != null)
                style.LeftIndent = double.Parse(ind.Left.Value) / TWIPS_PER_MM;
            if (ind.Right?.Value != null)
                style.RightIndent = double.Parse(ind.Right.Value) / TWIPS_PER_MM;
            if (ind.FirstLine?.Value != null)
                style.FirstLineIndent = double.Parse(ind.FirstLine.Value) / TWIPS_PER_MM;
        }

        return style;
    }

    private DocxTextStyle ParseRunPropertiesForStyle(StyleRunProperties rPr)
    {
        var style = new DocxTextStyle();

        // Font
        var fonts = rPr.GetFirstChild<RunFonts>();
        if (fonts?.Ascii?.Value != null)
            style.FontFamily = fonts.Ascii.Value;

        // Size
        var sz = rPr.GetFirstChild<FontSize>();
        if (sz?.Val?.Value != null && double.TryParse(sz.Val.Value, out var size))
            style.FontSize = size / HALF_POINTS_PER_POINT;

        // Bold
        style.IsBold = rPr.GetFirstChild<Bold>() != null;

        // Italic
        style.IsItalic = rPr.GetFirstChild<Italic>() != null;

        // Underline
        var underline = rPr.GetFirstChild<Underline>();
        style.IsUnderline = underline != null && underline.Val?.Value != UnderlineValues.None;

        // Strike
        style.IsStrikethrough = rPr.GetFirstChild<Strike>() != null;

        // Color
        var color = rPr.GetFirstChild<Color>();
        if (color?.Val?.Value != null)
            style.Color = FormatColor(color.Val.Value) ?? style.Color;

        return style;
    }

    #endregion

    #region TOC Extraction

    private void ExtractTableOfContents(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        // TOC is typically within a structured document tag or has field codes
        var tocSdt = body.Descendants<SdtBlock>()
            .FirstOrDefault(sdt =>
            {
                var props = sdt.SdtProperties;
                var docPartObj = props?.GetFirstChild<SdtContentDocPartObject>();
                var docPartGallery = docPartObj?.DocPartGallery;
                return docPartGallery?.Val?.Value == "Table of Contents";
            });

        if (tocSdt != null)
        {
            content.TableOfContents = ParseTableOfContents(tocSdt);
        }
        else
        {
            // Look for TOC field code
            var tocField = body.Descendants<FieldCode>()
                .FirstOrDefault(fc => fc.Text?.Contains("TOC") == true);

            if (tocField != null)
            {
                content.TableOfContents = new ParsedDocxTableOfContents
                {
                    ElementType = "tableOfContents",
                    Entries = [], // Would need more complex parsing
                };
            }
        }
    }

    private ParsedDocxTableOfContents ParseTableOfContents(SdtBlock tocSdt)
    {
        var toc = new ParsedDocxTableOfContents { ElementType = "tableOfContents" };

        // Extract entries from hyperlinks
        foreach (var hyperlink in tocSdt.Descendants<Hyperlink>())
        {
            var text = hyperlink.InnerText;
            if (!string.IsNullOrWhiteSpace(text))
            {
                var entry = new DocxTocEntry { Text = text, BookmarkRef = hyperlink.Anchor?.Value };

                // Try to extract page number (typically at end)
                var parts = text.Split('\t');
                if (parts.Length > 1 && int.TryParse(parts[^1].Trim(), out var pageNum))
                {
                    entry.PageNumber = pageNum;
                    entry.Text = string.Join("\t", parts[..^1]);
                }

                // Determine level from style or indentation
                var parentPara = hyperlink.Ancestors<Paragraph>().FirstOrDefault();
                var pStyle = parentPara?.ParagraphProperties?.ParagraphStyleId?.Val?.Value;
                if (pStyle != null && pStyle.StartsWith("TOC"))
                {
                    if (int.TryParse(pStyle.Replace("TOC", ""), out var level))
                    {
                        entry.Level = level;
                    }
                }

                toc.Entries.Add(entry);
            }
        }

        return toc;
    }

    #endregion

    #region Bibliography Extraction

    private void ExtractBibliography(WordprocessingDocument wordDocument, ParsedDocxContent content)
    {
        // Bibliography is stored in CustomXmlPart
        var customXmlParts = wordDocument.MainDocumentPart?.CustomXmlParts;
        if (customXmlParts == null)
            return;

        foreach (var customXmlPart in customXmlParts)
        {
            try
            {
                using var stream = customXmlPart.GetStream();
                using var reader = new StreamReader(stream);
                var xml = reader.ReadToEnd();

                // Check if this is a bibliography
                if (
                    xml.Contains(
                        "http://schemas.openxmlformats.org/officeDocument/2006/bibliography"
                    )
                )
                {
                    content.Bibliography = ParseBibliography(xml);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse custom XML part");
            }
        }

        // Extract citations from document body
        ExtractCitations(wordDocument.MainDocumentPart, content);
    }

    private ParsedDocxBibliography? ParseBibliography(string xml)
    {
        try
        {
            var doc = System.Xml.Linq.XDocument.Parse(xml);
            var ns = System.Xml.Linq.XNamespace.Get(
                "http://schemas.openxmlformats.org/officeDocument/2006/bibliography"
            );

            var bibliography = new ParsedDocxBibliography { ElementType = "bibliography" };

            foreach (var source in doc.Descendants(ns + "Source"))
            {
                var bibSource = new DocxBibliographySource
                {
                    Tag = source.Element(ns + "Tag")?.Value ?? "",
                    SourceType = source.Element(ns + "SourceType")?.Value ?? "",
                    Title = source.Element(ns + "Title")?.Value ?? "",
                    Year = source.Element(ns + "Year")?.Value,
                    Publisher = source.Element(ns + "Publisher")?.Value,
                    City = source.Element(ns + "City")?.Value,
                    JournalName =
                        source.Element(ns + "JournalName")?.Value
                        ?? source.Element(ns + "PeriodicalTitle")?.Value,
                    Volume = source.Element(ns + "Volume")?.Value,
                    Issue = source.Element(ns + "Issue")?.Value,
                    Pages = source.Element(ns + "Pages")?.Value,
                    Url = source.Element(ns + "URL")?.Value,
                    Doi = source.Element(ns + "DOI")?.Value,
                    Isbn = source.Element(ns + "ISBN")?.Value,
                };

                // Authors
                var authors = source.Element(ns + "Author")?.Element(ns + "Author");
                if (authors != null)
                {
                    var nameList = authors.Element(ns + "NameList");
                    if (nameList != null)
                    {
                        foreach (var namePerson in nameList.Elements(ns + "Person"))
                        {
                            bibSource.Authors.Add(
                                new DocxPerson
                                {
                                    First = namePerson.Element(ns + "First")?.Value,
                                    Middle = namePerson.Element(ns + "Middle")?.Value,
                                    Last = namePerson.Element(ns + "Last")?.Value,
                                }
                            );
                        }
                    }
                }

                bibliography.Sources.Add(bibSource);
            }

            return bibliography.Sources.Count > 0 ? bibliography : null;
        }
        catch
        {
            return null;
        }
    }

    private void ExtractCitations(MainDocumentPart? mainPart, ParsedDocxContent content)
    {
        if (mainPart?.Document.Body == null)
            return;

        // Citations are typically in SDT elements with specific tags
        foreach (var sdt in mainPart.Document.Body.Descendants<SdtRun>())
        {
            var tag = sdt.SdtProperties?.GetFirstChild<Tag>()?.Val?.Value;
            if (tag?.StartsWith("CITATION") == true)
            {
                var citation = new DocxCitation { SourceTag = tag.Replace("CITATION", "").Trim() };
                content.Citations.Add(citation);
            }
        }
    }

    #endregion

    #region Custom XML Extraction

    private void ExtractCustomXml(WordprocessingDocument wordDocument, ParsedDocxContent content)
    {
        var customXmlParts = wordDocument.MainDocumentPart?.CustomXmlParts;
        if (customXmlParts == null)
            return;

        foreach (var customXmlPart in customXmlParts)
        {
            try
            {
                using var stream = customXmlPart.GetStream();
                using var reader = new StreamReader(stream);
                var xml = reader.ReadToEnd();

                // Skip bibliography XML (handled separately)
                if (
                    xml.Contains(
                        "http://schemas.openxmlformats.org/officeDocument/2006/bibliography"
                    )
                )
                    continue;

                var customXml = new DocxCustomXmlData
                {
                    Id = customXmlPart.Uri?.ToString() ?? Guid.NewGuid().ToString(),
                    XmlContent = xml,
                };

                try
                {
                    var doc = System.Xml.Linq.XDocument.Parse(xml);
                    customXml.RootElement = doc.Root?.Name.LocalName;
                    customXml.Namespace = doc.Root?.Name.NamespaceName;

                    // Extract simple key-value pairs from first level elements
                    foreach (var element in doc.Root?.Elements() ?? [])
                    {
                        if (!element.HasElements)
                        {
                            customXml.Data[element.Name.LocalName] = element.Value;
                        }
                    }
                }
                catch
                {
                    // XML parsing failed, keep raw content
                }

                content.CustomXmlData.Add(customXml);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract custom XML");
            }
        }
    }

    #endregion

    #region Embedded Object Extraction

    private void ExtractEmbeddedObjects(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        // Find OLE objects
        foreach (var oleObj in body.Descendants<EmbeddedObject>())
        {
            try
            {
                var embeddedObject = ParseEmbeddedObject(oleObj, mainPart);
                if (embeddedObject != null)
                {
                    content.EmbeddedObjects.Add(embeddedObject);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse embedded object");
            }
        }
    }

    private ParsedDocxEmbeddedObject? ParseEmbeddedObject(
        EmbeddedObject oleObj,
        MainDocumentPart mainPart
    )
    {
        var shape = oleObj.GetFirstChild<DocumentFormat.OpenXml.Vml.Shape>();
        var embedded = new ParsedDocxEmbeddedObject { ElementType = "embeddedObject" };

        // Get object type from OLE object
        var oleObject = oleObj.GetFirstChild<DocumentFormat.OpenXml.Vml.Office.OleObject>();
        if (oleObject != null)
        {
            embedded.ProgId = oleObject.ProgId?.Value;
            embedded.ObjectType = DetermineObjectType(oleObject.ProgId?.Value);
        }

        // Get dimensions from shape style
        if (shape?.Style?.Value != null)
        {
            var style = shape.Style.Value;
            var width = ExtractStyleValue(style, "width");
            var height = ExtractStyleValue(style, "height");

            if (!string.IsNullOrEmpty(width))
                embedded.Width = ParsePointValue(width) * 0.3528; // pt to mm
            if (!string.IsNullOrEmpty(height))
                embedded.Height = ParsePointValue(height) * 0.3528;
        }

        // Try to get preview image
        var imageData = shape?.GetFirstChild<DocumentFormat.OpenXml.Vml.ImageData>();
        if (imageData?.RelationshipId?.Value != null)
        {
            try
            {
                var imagePart = mainPart.GetPartById(imageData.RelationshipId.Value) as ImagePart;
                if (imagePart != null)
                {
                    using var imgStream = imagePart.GetStream();
                    using var ms = new MemoryStream();
                    imgStream.CopyTo(ms);
                    embedded.PreviewImage =
                        $"data:{imagePart.ContentType};base64,{Convert.ToBase64String(ms.ToArray())}";
                }
            }
            catch
            {
                // Ignore
            }
        }

        return embedded;
    }

    private string DetermineObjectType(string? progId)
    {
        if (string.IsNullOrEmpty(progId))
            return "unknown";

        if (progId.Contains("Excel"))
            return "excel";
        if (progId.Contains("Word"))
            return "word";
        if (progId.Contains("PowerPoint"))
            return "powerpoint";
        if (progId.Contains("PDF") || progId.Contains("Acrobat"))
            return "pdf";
        if (progId.Contains("Package"))
            return "package";

        return "unknown";
    }

    #endregion
}
