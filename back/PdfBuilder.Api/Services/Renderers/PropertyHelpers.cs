using System.Text.Json;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Helper methods for extracting typed properties from JSON element dictionaries.
/// </summary>
public static class PropertyHelpers
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
                    var rowData = new List<string>();
                    foreach (var cell in row.EnumerateArray())
                    {
                        if (cell.ValueKind == JsonValueKind.String)
                        {
                            rowData.Add(cell.GetString() ?? "");
                        }
                        else
                        {
                            rowData.Add("");
                        }
                    }
                    result.Add(rowData);
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
            return result.Count > 0 ? [.. result] : null;
        }
        return null;
    }
}
