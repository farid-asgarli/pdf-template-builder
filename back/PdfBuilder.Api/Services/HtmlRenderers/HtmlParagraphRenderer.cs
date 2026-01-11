using System.Text;
using System.Text.Json;
using System.Web;
using PdfBuilder.Api.Services.Renderers;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Renders paragraph components to HTML with full text styling support.
/// </summary>
public static class HtmlParagraphRenderer
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
        var fontSize = HtmlPropertyHelpers.GetFloat(properties, "fontSize", 12);
        var fontFamily = HtmlPropertyHelpers.GetString(properties, "fontFamily", "Inter");
        var fontWeight = HtmlPropertyHelpers.GetString(properties, "fontWeight", "normal");
        var italic = HtmlPropertyHelpers.GetBool(properties, "italic", false);
        var color = HtmlPropertyHelpers.GetString(properties, "color", "#000000");
        var backgroundColor = HtmlPropertyHelpers.GetString(properties, "backgroundColor", "");
        var textAlign = HtmlPropertyHelpers.GetString(properties, "textAlign", "left");
        var letterSpacing = HtmlPropertyHelpers.GetFloat(properties, "letterSpacing", 0);
        var lineHeight = HtmlPropertyHelpers.GetFloat(properties, "lineHeight", 1.5f);
        var paragraphSpacing = HtmlPropertyHelpers.GetFloat(properties, "paragraphSpacing", 0);
        var firstLineIndentation = HtmlPropertyHelpers.GetFloat(
            properties,
            "firstLineIndentation",
            0
        );
        var decoration = HtmlPropertyHelpers.GetString(properties, "decoration", "none");
        var decorationStyle = HtmlPropertyHelpers.GetString(properties, "decorationStyle", "solid");

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
            "overflow-wrap: break-word",
            "word-wrap: break-word",
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

        if (firstLineIndentation > 0)
        {
            styles.Add($"text-indent: {firstLineIndentation}pt");
        }

        if (decoration != "none")
        {
            styles.Add(
                $"text-decoration: {HtmlPropertyHelpers.GetCssTextDecoration(decoration, decorationStyle)}"
            );
        }

        var styleAttr = string.Join("; ", styles);

        // Split content into paragraphs and render with spacing
        var paragraphs = processedContent.Split(
            new[] { "\n\n", "\r\n\r\n" },
            StringSplitOptions.None
        );

        sb.AppendLine($"<div class=\"paragraph\" style=\"{styleAttr}\">");
        for (int i = 0; i < paragraphs.Length; i++)
        {
            var pStyle = i > 0 && paragraphSpacing > 0 ? $"margin-top: {paragraphSpacing}pt" : "";
            sb.AppendLine(
                $"  <p style=\"{pStyle}\">{HttpUtility.HtmlEncode(paragraphs[i]).Replace("\n", "<br>")}</p>"
            );
        }
        sb.AppendLine("</div>");
    }
}
