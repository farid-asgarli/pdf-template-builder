using System.Text;
using System.Text.Json;
using System.Web;
using PdfBuilder.Api.Services.Renderers;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders text label components to HTML with full text styling support.
/// </summary>
public static class HtmlTextLabelRenderer
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
        var content = HtmlPropertyHelpers.GetString(properties, "content", "");
        var fontSize = HtmlPropertyHelpers.GetFloat(properties, "fontSize", 14);
        var fontFamily = HtmlPropertyHelpers.GetString(properties, "fontFamily", "Inter");
        var fontWeight = HtmlPropertyHelpers.GetString(properties, "fontWeight", "normal");
        var italic = HtmlPropertyHelpers.GetBool(properties, "italic", false);
        var color = HtmlPropertyHelpers.GetString(properties, "color", "#000000");
        var backgroundColor = HtmlPropertyHelpers.GetString(properties, "backgroundColor", "");
        var textAlign = HtmlPropertyHelpers.GetString(properties, "textAlign", "left");
        var letterSpacing = HtmlPropertyHelpers.GetFloat(properties, "letterSpacing", 0);
        var lineHeight = HtmlPropertyHelpers.GetFloat(properties, "lineHeight", 1.2f);
        var decoration = HtmlPropertyHelpers.GetString(properties, "decoration", "none");
        var decorationStyle = HtmlPropertyHelpers.GetString(properties, "decorationStyle", "solid");
        var decorationColor = HtmlPropertyHelpers.GetString(properties, "decorationColor", "");

        // Substitute variables in content
        var processedContent = TextHelpers.SubstituteVariables(
            content,
            pageNumber,
            totalPages,
            variables,
            complexVariables
        );

        // Build CSS styles
        var styles = new List<string>
        {
            $"font-size: {fontSize}pt",
            $"font-family: '{fontFamily}', sans-serif",
            $"font-weight: {HtmlPropertyHelpers.GetCssFontWeight(fontWeight)}",
            $"color: {color}",
            $"text-align: {HtmlPropertyHelpers.GetCssTextAlign(textAlign)}",
            $"line-height: {lineHeight}",
            "width: 100%",
            "height: 100%",
        };

        if (italic)
        {
            styles.Add("font-style: italic");
        }

        if (!string.IsNullOrEmpty(backgroundColor))
        {
            styles.Add($"background-color: {backgroundColor}");
        }

        if (letterSpacing != 0)
        {
            styles.Add($"letter-spacing: {letterSpacing}em");
        }

        if (decoration != "none")
        {
            styles.Add(
                $"text-decoration: {HtmlPropertyHelpers.GetCssTextDecoration(decoration, decorationStyle)}"
            );
            if (!string.IsNullOrEmpty(decorationColor))
            {
                styles.Add($"text-decoration-color: {decorationColor}");
            }
        }

        var styleAttr = string.Join("; ", styles);
        sb.AppendLine($"<div class=\"text-label\" style=\"{styleAttr}\">");
        sb.AppendLine($"  {HttpUtility.HtmlEncode(processedContent)}");
        sb.AppendLine("</div>");
    }
}
