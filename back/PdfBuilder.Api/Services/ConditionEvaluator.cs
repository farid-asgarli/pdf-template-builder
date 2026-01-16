using System.Text.Json;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Evaluates conditional rendering rules against variable values.
/// </summary>
public static class ConditionEvaluator
{
    /// <summary>
    /// Evaluates whether a component should be rendered based on its conditional config.
    /// </summary>
    /// <param name="condition">The conditional configuration to evaluate.</param>
    /// <param name="variables">Simple string variables.</param>
    /// <param name="complexVariables">Complex variables (arrays, objects) as JsonElements.</param>
    /// <returns>True if the component should be rendered, false otherwise.</returns>
    public static bool ShouldRender(
        ConditionalConfig? condition,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables = null
    )
    {
        // No condition or not enabled = always render
        if (condition == null || !condition.Enabled)
            return true;

        // No rules = always render
        if (condition.Rules == null || condition.Rules.Count == 0)
            return true;

        var results = condition.Rules.Select(rule =>
            EvaluateRule(rule, variables, complexVariables)
        );

        // Apply logic: "all" = AND (all must be true), "any" = OR (at least one must be true)
        return condition.Logic.ToLowerInvariant() == "any"
            ? results.Any(r => r)
            : results.All(r => r);
    }

    /// <summary>
    /// Evaluates a single conditional rule.
    /// </summary>
    private static bool EvaluateRule(
        ConditionalRule rule,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        if (string.IsNullOrEmpty(rule.Variable))
            return true; // Empty variable name = condition passes

        // Try to get the variable value
        var variableValue = GetVariableValue(rule.Variable, variables, complexVariables);

        return EvaluateOperator(rule.Operator, variableValue, rule.Value);
    }

    /// <summary>
    /// Gets the value of a variable from simple or complex variables.
    /// </summary>
    private static string? GetVariableValue(
        string variableName,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        // First check simple variables
        if (variables.TryGetValue(variableName, out var simpleValue))
            return simpleValue;

        // Then check complex variables
        if (
            complexVariables != null
            && complexVariables.TryGetValue(variableName, out var complexValue)
        )
        {
            return complexValue.ValueKind switch
            {
                JsonValueKind.String => complexValue.GetString(),
                JsonValueKind.Number => complexValue.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Null => null,
                JsonValueKind.Array => complexValue.GetArrayLength().ToString(), // Return array length as string
                _ => complexValue.GetRawText(),
            };
        }

        // Variable not found
        return null;
    }

    /// <summary>
    /// Evaluates the comparison operator.
    /// </summary>
    private static bool EvaluateOperator(
        string operatorName,
        string? variableValue,
        string? compareValue
    )
    {
        var op = operatorName.ToLowerInvariant();

        return op switch
        {
            "equals" => string.Equals(
                variableValue,
                compareValue,
                StringComparison.OrdinalIgnoreCase
            ),
            "not_equals" => !string.Equals(
                variableValue,
                compareValue,
                StringComparison.OrdinalIgnoreCase
            ),
            "contains" => variableValue?.Contains(
                compareValue ?? "",
                StringComparison.OrdinalIgnoreCase
            ) ?? false,
            "not_contains" => !(
                variableValue?.Contains(compareValue ?? "", StringComparison.OrdinalIgnoreCase)
                ?? false
            ),
            "starts_with" => variableValue?.StartsWith(
                compareValue ?? "",
                StringComparison.OrdinalIgnoreCase
            ) ?? false,
            "ends_with" => variableValue?.EndsWith(
                compareValue ?? "",
                StringComparison.OrdinalIgnoreCase
            ) ?? false,
            "greater_than" => CompareNumeric(variableValue, compareValue, (a, b) => a > b),
            "less_than" => CompareNumeric(variableValue, compareValue, (a, b) => a < b),
            "greater_than_or_equals" => CompareNumeric(
                variableValue,
                compareValue,
                (a, b) => a >= b
            ),
            "less_than_or_equals" => CompareNumeric(variableValue, compareValue, (a, b) => a <= b),
            "is_empty" => string.IsNullOrWhiteSpace(variableValue),
            "is_not_empty" => !string.IsNullOrWhiteSpace(variableValue),
            "is_true" => IsTruthy(variableValue),
            "is_false" => !IsTruthy(variableValue),
            _ => true, // Unknown operator = condition passes
        };
    }

    /// <summary>
    /// Compares two values numerically.
    /// </summary>
    private static bool CompareNumeric(
        string? value1,
        string? value2,
        Func<double, double, bool> comparison
    )
    {
        if (double.TryParse(value1, out var num1) && double.TryParse(value2, out var num2))
        {
            return comparison(num1, num2);
        }

        // Fall back to string comparison if not numeric
        var strCompare = string.Compare(
            value1 ?? "",
            value2 ?? "",
            StringComparison.OrdinalIgnoreCase
        );
        return comparison(strCompare, 0);
    }

    /// <summary>
    /// Checks if a value is considered "truthy".
    /// </summary>
    private static bool IsTruthy(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var lower = value.ToLowerInvariant().Trim();
        return lower switch
        {
            "true" => true,
            "1" => true,
            "yes" => true,
            "on" => true,
            "false" => false,
            "0" => false,
            "no" => false,
            "off" => false,
            _ => !string.IsNullOrEmpty(value), // Any non-empty value is truthy
        };
    }
}
