using System.Text.Json;
using System.Text.RegularExpressions;
using PdfBuilder.Api.DTOs.Variables;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Service for handling variable validation, processing, and substitution.
/// </summary>
public static class VariableService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Parse variable definitions from document JSON content.
    /// </summary>
    public static List<VariableDefinition> GetVariableDefinitions(string jsonContent)
    {
        try
        {
            var data = JsonSerializer.Deserialize<DocumentData>(jsonContent, JsonOptions);
            return data?.VariableDefinitions ?? [];
        }
        catch
        {
            return [];
        }
    }

    /// <summary>
    /// Validate provided variables against the variable definitions.
    /// </summary>
    public static VariableValidationResult ValidateVariables(
        List<VariableDefinition> definitions,
        Dictionary<string, object>? providedVariables
    )
    {
        var errors = new List<VariableValidationError>();
        var variables = providedVariables ?? [];

        foreach (var definition in definitions)
        {
            var hasValue = variables.TryGetValue(definition.Name, out var value);
            var stringValue = ConvertToString(value);
            var isEmpty = string.IsNullOrWhiteSpace(stringValue);

            // Check required
            if (definition.Required && (!hasValue || isEmpty))
            {
                // Check if there's a default value
                if (string.IsNullOrWhiteSpace(definition.DefaultValue))
                {
                    errors.Add(
                        new VariableValidationError(
                            definition.Name,
                            "required",
                            $"Variable '{definition.Label ?? definition.Name}' is required."
                        )
                    );
                    continue;
                }
            }

            // Skip further validation if no value provided (will use default)
            if (!hasValue || isEmpty)
                continue;

            // Validate type
            var typeError = ValidateType(definition, stringValue);
            if (typeError != null)
            {
                errors.Add(typeError);
                continue;
            }

            // Validate pattern (for string types)
            if (
                !string.IsNullOrEmpty(definition.Pattern)
                && definition.Type == VariableTypes.String
            )
            {
                try
                {
                    if (!Regex.IsMatch(stringValue, definition.Pattern))
                    {
                        errors.Add(
                            new VariableValidationError(
                                definition.Name,
                                "pattern",
                                $"Variable '{definition.Label ?? definition.Name}' does not match the required pattern."
                            )
                        );
                    }
                }
                catch (RegexParseException)
                {
                    // Invalid regex pattern in definition - skip validation
                }
            }
        }

        return new VariableValidationResult(errors.Count == 0, errors);
    }

    /// <summary>
    /// Merge provided variables with defaults and format values.
    /// Returns a dictionary ready for substitution in the document.
    /// </summary>
    public static Dictionary<string, string> MergeVariables(
        List<VariableDefinition> definitions,
        Dictionary<string, string> documentVariables,
        Dictionary<string, object>? providedVariables
    )
    {
        var result = new Dictionary<string, string>(documentVariables);
        var provided = providedVariables ?? [];

        foreach (var definition in definitions)
        {
            // Check if value was provided at runtime
            if (provided.TryGetValue(definition.Name, out var value))
            {
                var formatted = FormatValue(definition, value);
                result[definition.Name] = formatted;
            }
            // Use default value if not already in result and default is available
            else if (
                !result.ContainsKey(definition.Name)
                && !string.IsNullOrEmpty(definition.DefaultValue)
            )
            {
                result[definition.Name] = definition.DefaultValue;
            }
        }

        return result;
    }

    /// <summary>
    /// Convert object value to string representation.
    /// </summary>
    private static string ConvertToString(object? value)
    {
        if (value == null)
            return string.Empty;

        if (value is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.String => jsonElement.GetString() ?? string.Empty,
                JsonValueKind.Number => jsonElement.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Null => string.Empty,
                _ => jsonElement.GetRawText(),
            };
        }

        return value.ToString() ?? string.Empty;
    }

    /// <summary>
    /// Validate value against the expected type.
    /// </summary>
    private static VariableValidationError? ValidateType(
        VariableDefinition definition,
        string value
    )
    {
        var isValid = definition.Type.ToLowerInvariant() switch
        {
            "number" => double.TryParse(value, out _),
            "date" => DateTime.TryParse(value, out _),
            "boolean" => bool.TryParse(value, out _) || value is "1" or "0",
            "currency" => decimal.TryParse(value, out _) || TryParseCurrencyObject(value),
            "string" => true, // Any value is valid for string
            _ => true, // Unknown types are permissive
        };

        if (!isValid)
        {
            return new VariableValidationError(
                definition.Name,
                "type",
                $"Variable '{definition.Label ?? definition.Name}' must be a valid {definition.Type}."
            );
        }

        return null;
    }

    /// <summary>
    /// Try to parse a currency object (JSON with value and currency fields).
    /// </summary>
    private static bool TryParseCurrencyObject(string value)
    {
        try
        {
            var obj = JsonSerializer.Deserialize<CurrencyValue>(value, JsonOptions);
            return obj != null && obj.Value != 0;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Format a value according to its type and definition settings.
    /// </summary>
    private static string FormatValue(VariableDefinition definition, object value)
    {
        var stringValue = ConvertToString(value);

        return definition.Type.ToLowerInvariant() switch
        {
            "date" => FormatDate(stringValue, definition.Format),
            "currency" => FormatCurrency(stringValue, value),
            "number" => FormatNumber(stringValue, definition.Format),
            "boolean" => FormatBoolean(stringValue),
            _ => stringValue,
        };
    }

    private static string FormatDate(string value, string? format)
    {
        if (!DateTime.TryParse(value, out var date))
            return value;

        // Use provided format or default
        var dateFormat = format ?? "MMMM dd, yyyy";
        try
        {
            return date.ToString(dateFormat);
        }
        catch
        {
            return date.ToLongDateString();
        }
    }

    private static string FormatCurrency(string stringValue, object originalValue)
    {
        // Try to parse as currency object first
        try
        {
            CurrencyValue? currencyObj = null;

            if (
                originalValue is JsonElement jsonElement
                && jsonElement.ValueKind == JsonValueKind.Object
            )
            {
                currencyObj = JsonSerializer.Deserialize<CurrencyValue>(
                    jsonElement.GetRawText(),
                    JsonOptions
                );
            }

            if (currencyObj != null)
            {
                var symbol = GetCurrencySymbol(currencyObj.Currency);
                return $"{symbol}{currencyObj.Value:N2}";
            }
        }
        catch
        {
            // Fall through to simple number formatting
        }

        // Fall back to simple number formatting
        if (decimal.TryParse(stringValue, out var amount))
        {
            return $"${amount:N2}";
        }

        return stringValue;
    }

    private static string GetCurrencySymbol(string? currencyCode)
    {
        return currencyCode?.ToUpperInvariant() switch
        {
            "USD" => "$",
            "EUR" => "€",
            "GBP" => "£",
            "JPY" => "¥",
            "CAD" => "CA$",
            "AUD" => "A$",
            _ => "$",
        };
    }

    private static string FormatNumber(string value, string? format)
    {
        if (!double.TryParse(value, out var number))
            return value;

        try
        {
            return format != null ? number.ToString(format) : number.ToString("N");
        }
        catch
        {
            return number.ToString();
        }
    }

    private static string FormatBoolean(string value)
    {
        var isTrue = value.ToLowerInvariant() is "true" or "1" or "yes";
        return isTrue ? "Yes" : "No";
    }

    /// <summary>
    /// Extract complex variables (arrays and objects) from provided variables.
    /// These are kept as JsonElements for processing by the TemplateEngine.
    /// </summary>
    public static Dictionary<string, JsonElement> ExtractComplexVariables(
        Dictionary<string, object>? providedVariables
    )
    {
        var result = new Dictionary<string, JsonElement>();

        if (providedVariables == null)
            return result;

        foreach (var kvp in providedVariables)
        {
            if (kvp.Value is JsonElement jsonElement)
            {
                if (
                    jsonElement.ValueKind == JsonValueKind.Array
                    || jsonElement.ValueKind == JsonValueKind.Object
                )
                {
                    result[kvp.Key] = jsonElement;
                }
            }
        }

        return result;
    }

    /// <summary>
    /// Validate array variables against their definitions.
    /// </summary>
    public static List<VariableValidationError> ValidateArrayVariable(
        VariableDefinition definition,
        JsonElement arrayElement
    )
    {
        var errors = new List<VariableValidationError>();

        if (arrayElement.ValueKind != JsonValueKind.Array)
        {
            errors.Add(
                new VariableValidationError(
                    definition.Name,
                    "type",
                    $"Variable '{definition.Label ?? definition.Name}' must be an array."
                )
            );
            return errors;
        }

        var itemCount = arrayElement.GetArrayLength();

        // Check minimum items
        if (definition.MinItems.HasValue && itemCount < definition.MinItems.Value)
        {
            errors.Add(
                new VariableValidationError(
                    definition.Name,
                    "minItems",
                    $"Variable '{definition.Label ?? definition.Name}' must have at least {definition.MinItems} items."
                )
            );
        }

        // Check maximum items
        if (definition.MaxItems.HasValue && itemCount > definition.MaxItems.Value)
        {
            errors.Add(
                new VariableValidationError(
                    definition.Name,
                    "maxItems",
                    $"Variable '{definition.Label ?? definition.Name}' must have at most {definition.MaxItems} items."
                )
            );
        }

        return errors;
    }

    /// <summary>
    /// Evaluate computed variables and add them to the merged variables dictionary.
    /// </summary>
    public static Dictionary<string, string> EvaluateComputedVariables(
        List<VariableDefinition> definitions,
        Dictionary<string, string> mergedVariables,
        Dictionary<string, JsonElement> complexVariables
    )
    {
        var result = new Dictionary<string, string>(mergedVariables);
        var computedDefs = definitions
            .Where(d => d.IsComputed && !string.IsNullOrEmpty(d.Expression))
            .ToList();

        if (computedDefs.Count == 0)
            return result;

        // Sort by dependencies to ensure correct evaluation order
        var sortedComputed = TopologicalSort(computedDefs);

        var evaluator = new ExpressionEvaluator(mergedVariables, complexVariables);

        foreach (var definition in sortedComputed)
        {
            try
            {
                var value = evaluator.EvaluateToString(definition.Expression!, definition.Format);
                result[definition.Name] = value;
            }
            catch
            {
                // If evaluation fails, use empty string or default
                result[definition.Name] = definition.DefaultValue ?? string.Empty;
            }
        }

        return result;
    }

    /// <summary>
    /// Topologically sort computed variables based on their dependencies.
    /// </summary>
    private static List<VariableDefinition> TopologicalSort(List<VariableDefinition> computedDefs)
    {
        var result = new List<VariableDefinition>();
        var visited = new HashSet<string>();
        var visiting = new HashSet<string>();
        var defMap = computedDefs.ToDictionary(d => d.Name);

        void Visit(VariableDefinition def)
        {
            if (visited.Contains(def.Name))
                return;
            if (visiting.Contains(def.Name))
            {
                // Circular dependency detected - skip
                return;
            }

            visiting.Add(def.Name);

            if (def.DependsOn != null)
            {
                foreach (var depName in def.DependsOn)
                {
                    if (defMap.TryGetValue(depName, out var depDef))
                    {
                        Visit(depDef);
                    }
                }
            }

            visiting.Remove(def.Name);
            visited.Add(def.Name);
            result.Add(def);
        }

        foreach (var def in computedDefs)
        {
            Visit(def);
        }

        return result;
    }

    /// <summary>
    /// Create a history record for variable values used in PDF generation.
    /// </summary>
    public static VariableHistory CreateHistoryRecord(
        Guid documentId,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables,
        string? generatedBy = null,
        string? notes = null
    )
    {
        var allVariables = new Dictionary<string, object>();

        foreach (var kvp in variables)
        {
            allVariables[kvp.Key] = kvp.Value;
        }

        if (complexVariables != null)
        {
            foreach (var kvp in complexVariables)
            {
                allVariables[kvp.Key] = JsonSerializer.Deserialize<object>(kvp.Value.GetRawText())!;
            }
        }

        return new VariableHistory
        {
            DocumentId = documentId,
            VariablesJson = JsonSerializer.Serialize(allVariables),
            GeneratedBy = generatedBy,
            Notes = notes,
            CreatedAt = DateTime.UtcNow,
        };
    }

    /// <summary>
    /// Parse variable values from a history record.
    /// </summary>
    public static (
        Dictionary<string, string> Simple,
        Dictionary<string, JsonElement> Complex
    ) ParseHistoryVariables(VariableHistory history)
    {
        var simple = new Dictionary<string, string>();
        var complex = new Dictionary<string, JsonElement>();

        try
        {
            using var doc = JsonDocument.Parse(history.VariablesJson);
            foreach (var property in doc.RootElement.EnumerateObject())
            {
                if (
                    property.Value.ValueKind == JsonValueKind.Array
                    || property.Value.ValueKind == JsonValueKind.Object
                )
                {
                    complex[property.Name] = property.Value.Clone();
                }
                else
                {
                    simple[property.Name] = property.Value.ToString();
                }
            }
        }
        catch
        {
            // Invalid JSON - return empty dictionaries
        }

        return (simple, complex);
    }

    /// <summary>
    /// Convert a VariableDefinition to VariableDefinitionDto (with recursive handling).
    /// </summary>
    public static VariableDefinitionDto ToDto(VariableDefinition definition)
    {
        return new VariableDefinitionDto(
            definition.Name,
            definition.Type,
            definition.Label,
            definition.Description,
            definition.Required,
            definition.DefaultValue,
            definition.Pattern,
            definition.Format,
            definition.Category,
            definition.Order,
            // Array type properties
            definition.ItemSchema?.Select(ToDto).ToList(),
            definition.MinItems,
            definition.MaxItems,
            // Object type properties
            definition.Properties?.Select(ToDto).ToList(),
            // Computed variable properties
            definition.IsComputed,
            definition.Expression,
            definition.DependsOn
        );
    }

    /// <summary>
    /// Convert a list of VariableDefinition to VariableDefinitionDto.
    /// </summary>
    public static List<VariableDefinitionDto> ToDtos(List<VariableDefinition> definitions)
    {
        return definitions.Select(ToDto).ToList();
    }

    /// <summary>
    /// Extract variable placeholders from template content.
    /// Returns a list of variable names found in {{variableName}} patterns.
    /// </summary>
    public static List<string> ExtractPlaceholders(string content)
    {
        if (string.IsNullOrEmpty(content))
            return [];

        var placeholders = new HashSet<string>();

        // Match {{variableName}} but not {{#if}}, {{#each}}, {{/if}}, etc.
        var regex = new Regex(@"\{\{(?!#|/|@)(\w+(?:\.\w+)*)\}\}");
        var matches = regex.Matches(content);

        foreach (Match match in matches)
        {
            // Get the root variable name (before any dot notation)
            var fullName = match.Groups[1].Value;
            var rootName = fullName.Split('.')[0];

            // Skip built-in variables
            if (
                rootName
                is "pageNumber"
                    or "totalPages"
                    or "date"
                    or "year"
                    or "time"
                    or "datetime"
                    or "today"
                    or "this"
            )
                continue;

            placeholders.Add(rootName);
        }

        return placeholders.ToList();
    }

    /// <summary>
    /// Analyze a document/template content and return variable definitions with auto-detected placeholders.
    /// </summary>
    public static VariableAnalysisResult AnalyzeVariables(string jsonContent)
    {
        var definitions = GetVariableDefinitions(jsonContent);
        var definedNames = definitions.Select(d => d.Name).ToHashSet();

        // Extract all {{variable}} placeholders from the content
        var detectedPlaceholders = ExtractPlaceholders(jsonContent);

        // Find undefined variables (used in content but not in definitions)
        var undefinedVariables = detectedPlaceholders
            .Where(p => !definedNames.Contains(p))
            .ToList();

        // Find unused definitions (defined but not used in content)
        var unusedDefinitions = definitions
            .Where(d => !detectedPlaceholders.Contains(d.Name) && !d.IsComputed)
            .Select(d => d.Name)
            .ToList();

        return new VariableAnalysisResult(
            ToDtos(definitions),
            detectedPlaceholders,
            undefinedVariables,
            unusedDefinitions
        );
    }
}

/// <summary>
/// Currency value object for structured currency data.
/// </summary>
internal class CurrencyValue
{
    public decimal Value { get; set; }
    public string Currency { get; set; } = "USD";
}
