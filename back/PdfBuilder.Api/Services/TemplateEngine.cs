using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Template engine for processing variable substitution, conditionals, and loops.
/// Supports Handlebars-like syntax for advanced templating.
///
/// Syntax supported:
/// - {{variableName}} - Simple substitution
/// - {{variableName:format}} - Substitution with format specifier
/// - {{#if condition}}...{{/if}} - Conditional rendering
/// - {{#unless condition}}...{{/unless}} - Inverse conditional
/// - {{#each arrayName}}...{{/each}} - Loop over array
/// - {{@index}} - Current index in loop (0-based)
/// - {{@number}} - Current number in loop (1-based)
/// - {{@first}} - True if first item
/// - {{@last}} - True if last item
/// - {{this}} - Current item in loop (for simple arrays)
/// - {{this.property}} - Property of current item in loop
/// </summary>
public static partial class TemplateEngine
{
    // Regex patterns for template syntax
    private static readonly Regex IfBlockRegex = GenerateIfBlockRegex();
    private static readonly Regex UnlessBlockRegex = GenerateUnlessBlockRegex();
    private static readonly Regex EachBlockRegex = GenerateEachBlockRegex();
    private static readonly Regex VariableWithFormatRegex = GenerateVariableWithFormatRegex();
    private static readonly Regex SimpleVariableRegex = GenerateSimpleVariableRegex();

    // Updated regex patterns to support nested property access (e.g., {{#if item.active}})
    [GeneratedRegex(@"\{\{#if\s+([\w.]+)\s*\}\}(.*?)\{\{/if\}\}", RegexOptions.Singleline)]
    private static partial Regex GenerateIfBlockRegex();

    [GeneratedRegex(@"\{\{#unless\s+([\w.]+)\s*\}\}(.*?)\{\{/unless\}\}", RegexOptions.Singleline)]
    private static partial Regex GenerateUnlessBlockRegex();

    [GeneratedRegex(@"\{\{#each\s+(\w+)\s*\}\}(.*?)\{\{/each\}\}", RegexOptions.Singleline)]
    private static partial Regex GenerateEachBlockRegex();

    [GeneratedRegex(@"\{\{([\w.]+):([^}]+)\}\}")]
    private static partial Regex GenerateVariableWithFormatRegex();

    [GeneratedRegex(@"\{\{(\w+(?:\.\w+)*)\}\}")]
    private static partial Regex GenerateSimpleVariableRegex();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Process a template string with the given context.
    /// </summary>
    /// <param name="template">The template string with placeholders.</param>
    /// <param name="pageNumber">Current page number.</param>
    /// <param name="totalPages">Total number of pages.</param>
    /// <param name="variables">Simple string variables.</param>
    /// <param name="complexVariables">Complex variables (arrays, objects) as raw JSON.</param>
    public static string Process(
        string template,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables = null
    )
    {
        if (string.IsNullOrEmpty(template))
            return template;

        var result = template;

        // Process built-in variables first
        result = SubstituteBuiltInVariables(result, pageNumber, totalPages);

        // Process conditionals (must happen before simple substitution)
        result = ProcessConditionals(result, variables, complexVariables);

        // Process loops
        result = ProcessLoops(result, variables, complexVariables);

        // Process variables with format specifiers
        result = ProcessFormattedVariables(result, variables, complexVariables);

        // Process simple variables
        result = ProcessSimpleVariables(result, variables);

        return result;
    }

    /// <summary>
    /// Substitute built-in variables like pageNumber, totalPages, date, year.
    /// </summary>
    private static string SubstituteBuiltInVariables(string text, int pageNumber, int totalPages)
    {
        return text.Replace("{{pageNumber}}", pageNumber.ToString())
            .Replace("{{totalPages}}", totalPages.ToString())
            .Replace("{{date}}", DateTime.Now.ToShortDateString())
            .Replace("{{year}}", DateTime.Now.Year.ToString())
            .Replace("{{time}}", DateTime.Now.ToShortTimeString())
            .Replace("{{datetime}}", DateTime.Now.ToString("g"))
            .Replace("{{today}}", DateTime.Now.ToString("MMMM dd, yyyy"));
    }

    /// <summary>
    /// Process {{#if condition}}...{{/if}} and {{#unless condition}}...{{/unless}} blocks.
    /// </summary>
    private static string ProcessConditionals(
        string template,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        var result = template;

        // Process {{#if condition}}...{{/if}}
        result = IfBlockRegex.Replace(
            result,
            match =>
            {
                var condition = match.Groups[1].Value;
                var content = match.Groups[2].Value;

                if (EvaluateCondition(condition, variables, complexVariables))
                {
                    return content;
                }
                return string.Empty;
            }
        );

        // Process {{#unless condition}}...{{/unless}}
        result = UnlessBlockRegex.Replace(
            result,
            match =>
            {
                var condition = match.Groups[1].Value;
                var content = match.Groups[2].Value;

                if (!EvaluateCondition(condition, variables, complexVariables))
                {
                    return content;
                }
                return string.Empty;
            }
        );

        return result;
    }

    /// <summary>
    /// Evaluate a condition variable as truthy or falsy.
    /// Supports nested property access: "item.active", "user.profile.verified"
    /// </summary>
    private static bool EvaluateCondition(
        string conditionName,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        // Handle nested property access (e.g., "item.active")
        if (conditionName.Contains('.'))
        {
            var parts = conditionName.Split('.');
            var rootName = parts[0];

            // Try to find the root in complex variables
            if (complexVariables?.TryGetValue(rootName, out var rootElement) == true)
            {
                var nestedValue = ResolveNestedProperty(rootElement, [.. parts.Skip(1)]);
                return nestedValue.HasValue && IsTruthy(nestedValue.Value);
            }

            // Try to find as simple variable (for string concatenated paths)
            if (variables.TryGetValue(conditionName, out var flatValue))
            {
                return IsTruthy(flatValue);
            }

            return false;
        }

        // Check simple variables first
        if (variables.TryGetValue(conditionName, out var value))
        {
            return IsTruthy(value);
        }

        // Check complex variables
        if (complexVariables?.TryGetValue(conditionName, out var jsonElement) == true)
        {
            return IsTruthy(jsonElement);
        }

        // Variable not found = falsy
        return false;
    }

    /// <summary>
    /// Resolve a nested property path within a JsonElement.
    /// </summary>
    private static JsonElement? ResolveNestedProperty(JsonElement element, string[] propertyPath)
    {
        var current = element;

        foreach (var property in propertyPath)
        {
            if (current.ValueKind != JsonValueKind.Object)
                return null;

            if (!current.TryGetProperty(property, out var next))
            {
                // Try case-insensitive match
                var found = false;
                foreach (var prop in current.EnumerateObject())
                {
                    if (prop.Name.Equals(property, StringComparison.OrdinalIgnoreCase))
                    {
                        current = prop.Value;
                        found = true;
                        break;
                    }
                }
                if (!found)
                    return null;
            }
            else
            {
                current = next;
            }
        }

        return current;
    }

    /// <summary>
    /// Determine if a string value is truthy.
    /// </summary>
    private static bool IsTruthy(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        // Explicit false values
        if (
            value.Equals("false", StringComparison.OrdinalIgnoreCase)
            || value.Equals("0", StringComparison.Ordinal)
            || value.Equals("no", StringComparison.OrdinalIgnoreCase)
            || value.Equals("null", StringComparison.OrdinalIgnoreCase)
        )
        {
            return false;
        }

        return true;
    }

    /// <summary>
    /// Determine if a JSON element is truthy.
    /// </summary>
    private static bool IsTruthy(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => false,
            JsonValueKind.Undefined => false,
            JsonValueKind.String => !string.IsNullOrWhiteSpace(element.GetString()),
            JsonValueKind.Number => element.GetDouble() != 0,
            JsonValueKind.Array => element.GetArrayLength() > 0,
            JsonValueKind.Object => true,
            _ => false,
        };
    }

    /// <summary>
    /// Process {{#each arrayName}}...{{/each}} blocks.
    /// </summary>
    private static string ProcessLoops(
        string template,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        if (complexVariables == null)
            return template;

        return EachBlockRegex.Replace(
            template,
            match =>
            {
                var arrayName = match.Groups[1].Value;
                var itemTemplate = match.Groups[2].Value;

                if (!complexVariables.TryGetValue(arrayName, out var arrayElement))
                    return string.Empty;

                if (arrayElement.ValueKind != JsonValueKind.Array)
                    return string.Empty;

                var items = arrayElement.EnumerateArray().ToList();
                var count = items.Count;
                var sb = new StringBuilder();

                for (int i = 0; i < count; i++)
                {
                    var item = items[i];
                    var itemResult = itemTemplate;

                    // Replace loop context variables
                    itemResult = itemResult
                        .Replace("{{@index}}", i.ToString())
                        .Replace("{{@number}}", (i + 1).ToString())
                        .Replace("{{@first}}", (i == 0).ToString().ToLowerInvariant())
                        .Replace("{{@last}}", (i == count - 1).ToString().ToLowerInvariant());

                    // Replace {{this}} for simple values
                    if (item.ValueKind == JsonValueKind.String)
                    {
                        itemResult = itemResult.Replace(
                            "{{this}}",
                            item.GetString() ?? string.Empty
                        );
                    }
                    else if (item.ValueKind == JsonValueKind.Number)
                    {
                        itemResult = itemResult.Replace("{{this}}", item.GetRawText());
                    }

                    // Replace {{this.property}} for object values
                    if (item.ValueKind == JsonValueKind.Object)
                    {
                        itemResult = ProcessObjectProperties(itemResult, "this", item);
                    }

                    // Also allow direct property access without "this." prefix
                    if (item.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var property in item.EnumerateObject())
                        {
                            var placeholder = $"{{{{{property.Name}}}}}";
                            var value = GetJsonElementValue(property.Value);
                            itemResult = itemResult.Replace(placeholder, value);
                        }
                    }

                    sb.Append(itemResult);
                }

                return sb.ToString();
            }
        );
    }

    /// <summary>
    /// Process properties of an object in the template.
    /// </summary>
    private static string ProcessObjectProperties(string template, string prefix, JsonElement obj)
    {
        var result = template;

        foreach (var property in obj.EnumerateObject())
        {
            var placeholder = $"{{{{{prefix}.{property.Name}}}}}";
            var value = GetJsonElementValue(property.Value);
            result = result.Replace(placeholder, value);
        }

        return result;
    }

    /// <summary>
    /// Get string value from a JsonElement.
    /// </summary>
    private static string GetJsonElementValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString() ?? string.Empty,
            JsonValueKind.Number => element.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            _ => element.GetRawText(),
        };
    }

    /// <summary>
    /// Process variables with inline format specifiers: {{variable:format}}
    /// Supported formats:
    /// - date:format (e.g., {{birthDate:MMMM dd, yyyy}})
    /// - currency:code (e.g., {{amount:USD}})
    /// - number:format (e.g., {{percentage:P2}})
    /// - upper, lower, title (e.g., {{name:upper}})
    /// </summary>
    private static string ProcessFormattedVariables(
        string template,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        return VariableWithFormatRegex.Replace(
            template,
            match =>
            {
                var variableName = match.Groups[1].Value;
                var format = match.Groups[2].Value;

                // Get the value
                string? value = null;
                if (variables.TryGetValue(variableName, out var strValue))
                {
                    value = strValue;
                }
                else if (complexVariables?.TryGetValue(variableName, out var jsonElement) == true)
                {
                    value = GetJsonElementValue(jsonElement);
                }

                if (value == null)
                    return match.Value; // Keep original if not found

                return ApplyFormat(value, format);
            }
        );
    }

    /// <summary>
    /// Apply a format specifier to a value.
    /// </summary>
    private static string ApplyFormat(string value, string format)
    {
        var formatLower = format.ToLowerInvariant();

        // Text transformations
        switch (formatLower)
        {
            case "upper":
            case "uppercase":
                return value.ToUpperInvariant();
            case "lower":
            case "lowercase":
                return value.ToLowerInvariant();
            case "title":
            case "titlecase":
                return ToTitleCase(value);
            case "trim":
                return value.Trim();
        }

        // Date formatting
        if (DateTime.TryParse(value, out var dateValue))
        {
            try
            {
                return dateValue.ToString(format);
            }
            catch
            {
                return value;
            }
        }

        // Number/currency formatting
        if (decimal.TryParse(value, out var numValue))
        {
            // Check for currency codes
            var currencySymbol = GetCurrencySymbol(format);
            if (currencySymbol != null)
            {
                return $"{currencySymbol}{numValue:N2}";
            }

            // Standard number format
            try
            {
                return numValue.ToString(format);
            }
            catch
            {
                return value;
            }
        }

        return value;
    }

    /// <summary>
    /// Get currency symbol from currency code.
    /// </summary>
    private static string? GetCurrencySymbol(string code)
    {
        return code.ToUpperInvariant() switch
        {
            "USD" => "$",
            "EUR" => "€",
            "GBP" => "£",
            "JPY" => "¥",
            "CNY" => "¥",
            "CAD" => "CA$",
            "AUD" => "A$",
            "CHF" => "CHF ",
            "INR" => "₹",
            "KRW" => "₩",
            "BRL" => "R$",
            "MXN" => "MX$",
            _ => null,
        };
    }

    /// <summary>
    /// Convert string to title case.
    /// </summary>
    private static string ToTitleCase(string value)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        var words = value.Split(' ');
        for (int i = 0; i < words.Length; i++)
        {
            if (words[i].Length > 0)
            {
                words[i] =
                    char.ToUpperInvariant(words[i][0])
                    + (words[i].Length > 1 ? words[i][1..].ToLowerInvariant() : "");
            }
        }
        return string.Join(' ', words);
    }

    /// <summary>
    /// Process simple variable substitution: {{variableName}}
    /// </summary>
    private static string ProcessSimpleVariables(
        string template,
        Dictionary<string, string> variables
    )
    {
        var result = template;

        foreach (var kvp in variables)
        {
            result = result.Replace($"{{{{{kvp.Key}}}}}", kvp.Value);
        }

        return result;
    }
}
