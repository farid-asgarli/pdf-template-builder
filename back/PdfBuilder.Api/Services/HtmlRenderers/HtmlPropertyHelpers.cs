using System.Text.Json;

namespace PdfBuilder.Api.Services.HtmlRenderers;

/// <summary>
/// Helper methods for extracting typed properties from JSON element dictionaries.
/// Mirrors PropertyHelpers from the PDF renderers for consistency.
/// </summary>
public static class HtmlPropertyHelpers
{
    public static string GetString(
        Dictionary<string, JsonElement> properties,
        string key,
        string defaultValue
    )
    {
        if (properties.TryGetValue(key, out var element))
        {
            if (element.ValueKind == JsonValueKind.String)
                return element.GetString() ?? defaultValue;
        }
        return defaultValue;
    }

    public static float GetFloat(
        Dictionary<string, JsonElement> properties,
        string key,
        float defaultValue
    )
    {
        if (properties.TryGetValue(key, out var element))
        {
            if (element.ValueKind == JsonValueKind.Number)
                return (float)element.GetDouble();
        }
        return defaultValue;
    }

    public static int GetInt(
        Dictionary<string, JsonElement> properties,
        string key,
        int defaultValue
    )
    {
        if (properties.TryGetValue(key, out var element))
        {
            if (element.ValueKind == JsonValueKind.Number)
                return element.GetInt32();
        }
        return defaultValue;
    }

    public static bool GetBool(
        Dictionary<string, JsonElement> properties,
        string key,
        bool defaultValue
    )
    {
        if (properties.TryGetValue(key, out var element))
        {
            if (element.ValueKind == JsonValueKind.True)
                return true;
            if (element.ValueKind == JsonValueKind.False)
                return false;
        }
        return defaultValue;
    }

    public static List<string>? GetStringArray(
        Dictionary<string, JsonElement> properties,
        string key
    )
    {
        if (
            properties.TryGetValue(key, out var element)
            && element.ValueKind == JsonValueKind.Array
        )
        {
            var result = new List<string>();
            foreach (var item in element.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    result.Add(item.GetString() ?? "");
                }
            }
            return result;
        }
        return null;
    }

    public static List<List<string>>? GetStringArrayArray(
        Dictionary<string, JsonElement> properties,
        string key
    )
    {
        if (
            properties.TryGetValue(key, out var element)
            && element.ValueKind == JsonValueKind.Array
        )
        {
            var result = new List<List<string>>();
            foreach (var row in element.EnumerateArray())
            {
                if (row.ValueKind == JsonValueKind.Array)
                {
                    var rowList = new List<string>();
                    foreach (var cell in row.EnumerateArray())
                    {
                        rowList.Add(
                            cell.ValueKind == JsonValueKind.String
                                ? cell.GetString() ?? ""
                                : cell.ToString()
                        );
                    }
                    result.Add(rowList);
                }
            }
            return result;
        }
        return null;
    }

    public static float[]? GetFloatArray(Dictionary<string, JsonElement> properties, string key)
    {
        if (
            properties.TryGetValue(key, out var element)
            && element.ValueKind == JsonValueKind.Array
        )
        {
            var result = new List<float>();
            foreach (var item in element.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.Number)
                {
                    result.Add((float)item.GetDouble());
                }
            }
            return result.ToArray();
        }
        return null;
    }

    /// <summary>
    /// Converts font weight string to CSS font-weight value.
    /// </summary>
    public static string GetCssFontWeight(string fontWeight)
    {
        return fontWeight.ToLowerInvariant() switch
        {
            "thin" => "100",
            "extralight" => "200",
            "light" => "300",
            "normal" => "400",
            "medium" => "500",
            "semibold" => "600",
            "bold" => "700",
            "extrabold" => "800",
            "black" => "900",
            _ => "400",
        };
    }

    /// <summary>
    /// Converts text decoration to CSS text-decoration value.
    /// </summary>
    public static string GetCssTextDecoration(string decoration, string style)
    {
        if (decoration == "none")
            return "none";

        var decorationLine = decoration switch
        {
            "underline" => "underline",
            "strikethrough" => "line-through",
            "overline" => "overline",
            _ => "none",
        };

        var decorationStyle = style switch
        {
            "double" => "double",
            "wavy" => "wavy",
            "dotted" => "dotted",
            "dashed" => "dashed",
            _ => "solid",
        };

        return $"{decorationLine} {decorationStyle}";
    }

    /// <summary>
    /// Converts text alignment to CSS text-align value.
    /// </summary>
    public static string GetCssTextAlign(string textAlign)
    {
        return textAlign.ToLowerInvariant() switch
        {
            "left" => "left",
            "center" => "center",
            "right" => "right",
            "justify" => "justify",
            "start" => "start",
            "end" => "end",
            _ => "left",
        };
    }
}
