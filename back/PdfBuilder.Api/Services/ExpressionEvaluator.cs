using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Evaluates expressions for computed variables.
/// Supports arithmetic, string operations, and aggregate functions.
/// </summary>
public class ExpressionEvaluator
{
    private readonly Dictionary<string, object> _variables;
    private readonly Dictionary<string, JsonElement> _complexVariables;

    public ExpressionEvaluator(
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables = null
    )
    {
        _variables = ConvertToObjects(variables);
        _complexVariables = complexVariables ?? new Dictionary<string, JsonElement>();
    }

    public ExpressionEvaluator(Dictionary<string, object> variables)
    {
        _variables = variables;
        _complexVariables = new Dictionary<string, JsonElement>();
    }

    /// <summary>
    /// Evaluates an expression and returns the result.
    /// </summary>
    public object? Evaluate(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression))
            return null;

        expression = expression.Trim();

        // Handle aggregate functions: array | function:property
        if (expression.Contains('|'))
        {
            return EvaluateAggregate(expression);
        }

        // Handle ternary operator: condition ? trueValue : falseValue
        if (expression.Contains('?') && expression.Contains(':'))
        {
            return EvaluateTernary(expression);
        }

        // Handle comparison operators
        if (ContainsComparisonOperator(expression))
        {
            return EvaluateComparison(expression);
        }

        // Handle arithmetic expressions
        if (ContainsArithmeticOperator(expression))
        {
            return EvaluateArithmetic(expression);
        }

        // Handle string concatenation with +
        if (expression.Contains('+') && ContainsStringOperand(expression))
        {
            return EvaluateStringConcat(expression);
        }

        // Simple variable reference or literal
        return ResolveValue(expression);
    }

    /// <summary>
    /// Evaluates an expression and returns the result as a string.
    /// </summary>
    public string EvaluateToString(string expression, string? format = null)
    {
        var result = Evaluate(expression);
        if (result == null)
            return string.Empty;

        if (!string.IsNullOrEmpty(format))
        {
            if (result is double d)
                return d.ToString(format, CultureInfo.InvariantCulture);
            if (result is decimal dec)
                return dec.ToString(format, CultureInfo.InvariantCulture);
            if (result is DateTime dt)
                return dt.ToString(format, CultureInfo.InvariantCulture);
        }

        return result.ToString() ?? string.Empty;
    }

    #region Aggregate Functions

    private object? EvaluateAggregate(string expression)
    {
        // Format: arrayName | function:property
        // Examples: items | sum:amount, items | avg:price, items | count, items | join:name
        var parts = expression.Split('|').Select(p => p.Trim()).ToArray();
        if (parts.Length != 2)
            return null;

        var arrayName = parts[0];
        var functionPart = parts[1];

        // Get the array
        JsonElement? arrayElement = null;
        if (
            _complexVariables.TryGetValue(arrayName, out var ce)
            && ce.ValueKind == JsonValueKind.Array
        )
        {
            arrayElement = ce;
        }

        if (arrayElement == null)
            return null;

        // Parse function and property
        var funcParts = functionPart.Split(':').Select(p => p.Trim()).ToArray();
        var functionName = funcParts[0].ToLowerInvariant();
        var propertyName = funcParts.Length > 1 ? funcParts[1] : null;
        var separator = funcParts.Length > 2 ? funcParts[2] : ", ";

        var array = arrayElement.Value;

        return functionName switch
        {
            "sum" => AggregateSum(array, propertyName),
            "avg" or "average" => AggregateAvg(array, propertyName),
            "min" => AggregateMin(array, propertyName),
            "max" => AggregateMax(array, propertyName),
            "count" => array.GetArrayLength(),
            "first" => GetArrayItem(array, 0, propertyName),
            "last" => GetArrayItem(array, array.GetArrayLength() - 1, propertyName),
            "join" => AggregateJoin(array, propertyName, separator),
            "concat" => AggregateJoin(array, propertyName, ""),
            _ => null,
        };
    }

    private double AggregateSum(JsonElement array, string? propertyName)
    {
        double sum = 0;
        foreach (var item in array.EnumerateArray())
        {
            sum += GetNumericValue(item, propertyName);
        }
        return sum;
    }

    private double AggregateAvg(JsonElement array, string? propertyName)
    {
        var count = array.GetArrayLength();
        if (count == 0)
            return 0;
        return AggregateSum(array, propertyName) / count;
    }

    private double AggregateMin(JsonElement array, string? propertyName)
    {
        double? min = null;
        foreach (var item in array.EnumerateArray())
        {
            var value = GetNumericValue(item, propertyName);
            if (min == null || value < min)
                min = value;
        }
        return min ?? 0;
    }

    private double AggregateMax(JsonElement array, string? propertyName)
    {
        double? max = null;
        foreach (var item in array.EnumerateArray())
        {
            var value = GetNumericValue(item, propertyName);
            if (max == null || value > max)
                max = value;
        }
        return max ?? 0;
    }

    private string AggregateJoin(JsonElement array, string? propertyName, string separator)
    {
        var values = new List<string>();
        foreach (var item in array.EnumerateArray())
        {
            var value = GetStringValue(item, propertyName);
            if (!string.IsNullOrEmpty(value))
                values.Add(value);
        }
        return string.Join(separator, values);
    }

    private object? GetArrayItem(JsonElement array, int index, string? propertyName)
    {
        if (index < 0 || index >= array.GetArrayLength())
            return null;

        var item = array[index];
        if (propertyName == null)
            return JsonElementToObject(item);

        if (item.TryGetProperty(propertyName, out var prop))
            return JsonElementToObject(prop);

        return null;
    }

    private static double GetNumericValue(JsonElement item, string? propertyName)
    {
        JsonElement target = item;
        if (propertyName != null && item.ValueKind == JsonValueKind.Object)
        {
            if (!item.TryGetProperty(propertyName, out target))
                return 0;
        }

        return target.ValueKind switch
        {
            JsonValueKind.Number => target.GetDouble(),
            JsonValueKind.String when double.TryParse(target.GetString(), out var d) => d,
            _ => 0,
        };
    }

    private static string GetStringValue(JsonElement item, string? propertyName)
    {
        JsonElement target = item;
        if (propertyName != null && item.ValueKind == JsonValueKind.Object)
        {
            if (!item.TryGetProperty(propertyName, out target))
                return string.Empty;
        }

        return target.ValueKind switch
        {
            JsonValueKind.String => target.GetString() ?? string.Empty,
            JsonValueKind.Number => target.GetDouble().ToString(CultureInfo.InvariantCulture),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => string.Empty,
        };
    }

    #endregion

    #region Arithmetic Operations

    private static bool ContainsArithmeticOperator(string expression)
    {
        // Check for operators outside of quotes
        var inQuote = false;
        var quoteChar = ' ';
        foreach (var c in expression)
        {
            if ((c == '"' || c == '\'') && !inQuote)
            {
                inQuote = true;
                quoteChar = c;
            }
            else if (c == quoteChar && inQuote)
            {
                inQuote = false;
            }
            else if (!inQuote && (c == '+' || c == '-' || c == '*' || c == '/' || c == '%'))
            {
                return true;
            }
        }
        return false;
    }

    private object? EvaluateArithmetic(string expression)
    {
        // Simple arithmetic parser for: a + b - c * d / e % f
        // Respects operator precedence: * / % before + -
        var tokens = TokenizeArithmetic(expression);
        if (tokens.Count == 0)
            return null;

        // First pass: evaluate * / %
        var intermediate = new List<object>();
        for (int i = 0; i < tokens.Count; i++)
        {
            if (tokens[i] is string op && (op == "*" || op == "/" || op == "%"))
            {
                var left = intermediate.Last();
                intermediate.RemoveAt(intermediate.Count - 1);
                var right = tokens[++i];

                var leftVal = ToDouble(left);
                var rightVal = ToDouble(right);

                double result = op switch
                {
                    "*" => leftVal * rightVal,
                    "/" => rightVal != 0 ? leftVal / rightVal : 0,
                    "%" => rightVal != 0 ? leftVal % rightVal : 0,
                    _ => 0,
                };
                intermediate.Add(result);
            }
            else
            {
                intermediate.Add(tokens[i]);
            }
        }

        // Second pass: evaluate + -
        double final = ToDouble(intermediate[0]);
        for (int i = 1; i < intermediate.Count; i += 2)
        {
            var op = intermediate[i] as string;
            var rightVal = ToDouble(intermediate[i + 1]);

            final = op switch
            {
                "+" => final + rightVal,
                "-" => final - rightVal,
                _ => final,
            };
        }

        return final;
    }

    private List<object> TokenizeArithmetic(string expression)
    {
        var tokens = new List<object>();
        var regex = new Regex(@"([+\-*/%])|(\d+\.?\d*)|([a-zA-Z_][a-zA-Z0-9_.]*)");

        foreach (Match match in regex.Matches(expression))
        {
            var value = match.Value.Trim();
            if (string.IsNullOrEmpty(value))
                continue;

            if (value == "+" || value == "-" || value == "*" || value == "/" || value == "%")
            {
                tokens.Add(value);
            }
            else if (
                double.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var num)
            )
            {
                tokens.Add(num);
            }
            else
            {
                // Variable reference
                var resolved = ResolveValue(value);
                tokens.Add(resolved ?? 0);
            }
        }

        return tokens;
    }

    private static double ToDouble(object value)
    {
        return value switch
        {
            double d => d,
            int i => i,
            decimal dec => (double)dec,
            string s
                when double.TryParse(
                    s,
                    NumberStyles.Any,
                    CultureInfo.InvariantCulture,
                    out var d
                ) => d,
            _ => 0,
        };
    }

    #endregion

    #region Comparison Operations

    private static bool ContainsComparisonOperator(string expression)
    {
        return expression.Contains("==")
            || expression.Contains("!=")
            || expression.Contains(">=")
            || expression.Contains("<=")
            || expression.Contains(">")
            || expression.Contains("<")
            || expression.Contains(" and ", StringComparison.OrdinalIgnoreCase)
            || expression.Contains(" or ", StringComparison.OrdinalIgnoreCase);
    }

    private object EvaluateComparison(string expression)
    {
        // Handle logical operators first (and, or)
        if (expression.Contains(" and ", StringComparison.OrdinalIgnoreCase))
        {
            var parts = Regex.Split(expression, @"\s+and\s+", RegexOptions.IgnoreCase);
            return parts.All(p => ToBool(EvaluateComparison(p.Trim())));
        }

        if (expression.Contains(" or ", StringComparison.OrdinalIgnoreCase))
        {
            var parts = Regex.Split(expression, @"\s+or\s+", RegexOptions.IgnoreCase);
            return parts.Any(p => ToBool(EvaluateComparison(p.Trim())));
        }

        // Handle comparison operators
        string[] operators = ["==", "!=", ">=", "<=", ">", "<"];
        foreach (var op in operators)
        {
            var index = expression.IndexOf(op);
            if (index > 0)
            {
                var left = expression[..index].Trim();
                var right = expression[(index + op.Length)..].Trim();

                var leftVal = ResolveValue(left);
                var rightVal = ResolveValue(right);

                return CompareValues(leftVal, rightVal, op);
            }
        }

        return ToBool(ResolveValue(expression));
    }

    private bool CompareValues(object? left, object? right, string op)
    {
        // Try numeric comparison first
        if (TryGetDouble(left, out var leftNum) && TryGetDouble(right, out var rightNum))
        {
            return op switch
            {
                "==" => Math.Abs(leftNum - rightNum) < 0.0001,
                "!=" => Math.Abs(leftNum - rightNum) >= 0.0001,
                ">" => leftNum > rightNum,
                "<" => leftNum < rightNum,
                ">=" => leftNum >= rightNum,
                "<=" => leftNum <= rightNum,
                _ => false,
            };
        }

        // String comparison
        var leftStr = left?.ToString() ?? "";
        var rightStr = right?.ToString() ?? "";

        return op switch
        {
            "==" => leftStr.Equals(rightStr, StringComparison.OrdinalIgnoreCase),
            "!=" => !leftStr.Equals(rightStr, StringComparison.OrdinalIgnoreCase),
            ">" => string.Compare(leftStr, rightStr, StringComparison.OrdinalIgnoreCase) > 0,
            "<" => string.Compare(leftStr, rightStr, StringComparison.OrdinalIgnoreCase) < 0,
            ">=" => string.Compare(leftStr, rightStr, StringComparison.OrdinalIgnoreCase) >= 0,
            "<=" => string.Compare(leftStr, rightStr, StringComparison.OrdinalIgnoreCase) <= 0,
            _ => false,
        };
    }

    private static bool TryGetDouble(object? value, out double result)
    {
        result = 0;
        if (value == null)
            return false;

        if (value is double d)
        {
            result = d;
            return true;
        }
        if (value is int i)
        {
            result = i;
            return true;
        }
        if (value is decimal dec)
        {
            result = (double)dec;
            return true;
        }
        if (
            value is string s
            && double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out result)
        )
            return true;

        return false;
    }

    private static bool ToBool(object? value)
    {
        if (value == null)
            return false;
        if (value is bool b)
            return b;
        if (value is string s)
        {
            if (bool.TryParse(s, out var boolVal))
                return boolVal;
            return !string.IsNullOrEmpty(s) && s != "0";
        }
        if (value is double d)
            return d != 0;
        if (value is int i)
            return i != 0;
        return true;
    }

    #endregion

    #region Ternary Operator

    private object? EvaluateTernary(string expression)
    {
        // Format: condition ? trueValue : falseValue
        var questionIndex = expression.IndexOf('?');
        if (questionIndex < 0)
            return null;

        var condition = expression[..questionIndex].Trim();
        var rest = expression[(questionIndex + 1)..];

        var colonIndex = FindTernaryColon(rest);
        if (colonIndex < 0)
            return null;

        var trueValue = rest[..colonIndex].Trim();
        var falseValue = rest[(colonIndex + 1)..].Trim();

        var conditionResult = ToBool(Evaluate(condition));
        return conditionResult ? ResolveValue(trueValue) : ResolveValue(falseValue);
    }

    private static int FindTernaryColon(string expression)
    {
        // Find the colon that's not inside a nested ternary
        var depth = 0;
        for (int i = 0; i < expression.Length; i++)
        {
            if (expression[i] == '?')
                depth++;
            else if (expression[i] == ':')
            {
                if (depth == 0)
                    return i;
                depth--;
            }
        }
        return -1;
    }

    #endregion

    #region String Operations

    private bool ContainsStringOperand(string expression)
    {
        // Check if any operand is a string literal or a string variable
        var parts = expression.Split('+');
        foreach (var part in parts)
        {
            var trimmed = part.Trim();
            if (trimmed.StartsWith('"') || trimmed.StartsWith('\''))
                return true;

            if (_variables.TryGetValue(trimmed, out var val) && val is string)
                return true;
        }
        return false;
    }

    private string EvaluateStringConcat(string expression)
    {
        var parts = SplitStringConcatenation(expression);
        var result = new System.Text.StringBuilder();

        foreach (var part in parts)
        {
            var value = ResolveValue(part.Trim());
            result.Append(value?.ToString() ?? "");
        }

        return result.ToString();
    }

    private static List<string> SplitStringConcatenation(string expression)
    {
        var parts = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuote = false;
        var quoteChar = ' ';

        foreach (var c in expression)
        {
            if ((c == '"' || c == '\'') && !inQuote)
            {
                inQuote = true;
                quoteChar = c;
                current.Append(c);
            }
            else if (c == quoteChar && inQuote)
            {
                inQuote = false;
                current.Append(c);
            }
            else if (c == '+' && !inQuote)
            {
                parts.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        if (current.Length > 0)
            parts.Add(current.ToString());

        return parts;
    }

    #endregion

    #region Value Resolution

    private object? ResolveValue(string expression)
    {
        expression = expression.Trim();

        // String literal
        if (
            (expression.StartsWith('"') && expression.EndsWith('"'))
            || (expression.StartsWith('\'') && expression.EndsWith('\''))
        )
        {
            return expression[1..^1];
        }

        // Number literal
        if (
            double.TryParse(expression, NumberStyles.Any, CultureInfo.InvariantCulture, out var num)
        )
        {
            return num;
        }

        // Boolean literal
        if (expression.Equals("true", StringComparison.OrdinalIgnoreCase))
            return true;
        if (expression.Equals("false", StringComparison.OrdinalIgnoreCase))
            return false;

        // Null literal
        if (expression.Equals("null", StringComparison.OrdinalIgnoreCase))
            return null;

        // Variable reference (may contain dots for nested properties)
        if (expression.Contains('.'))
        {
            return ResolveNestedProperty(expression);
        }

        // Simple variable lookup
        if (_variables.TryGetValue(expression, out var value))
            return value;

        if (_complexVariables.TryGetValue(expression, out var complex))
            return JsonElementToObject(complex);

        return null;
    }

    private object? ResolveNestedProperty(string path)
    {
        var parts = path.Split('.');
        var rootName = parts[0];

        // Try complex variables first
        if (_complexVariables.TryGetValue(rootName, out var element))
        {
            return NavigateJsonPath(element, parts[1..]);
        }

        // Try regular variables (might be serialized JSON)
        if (_variables.TryGetValue(rootName, out var value) && value is string jsonStr)
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<JsonElement>(jsonStr);
                return NavigateJsonPath(parsed, parts[1..]);
            }
            catch
            {
                return null;
            }
        }

        return null;
    }

    private object? NavigateJsonPath(JsonElement element, string[] path)
    {
        var current = element;
        foreach (var part in path)
        {
            if (current.ValueKind != JsonValueKind.Object)
                return null;

            if (!current.TryGetProperty(part, out current))
                return null;
        }
        return JsonElementToObject(current);
    }

    private static object? JsonElementToObject(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            _ => element.GetRawText(),
        };
    }

    private static Dictionary<string, object> ConvertToObjects(
        Dictionary<string, string> stringVars
    )
    {
        var result = new Dictionary<string, object>();
        foreach (var kvp in stringVars)
        {
            // Try to parse as number
            if (
                double.TryParse(
                    kvp.Value,
                    NumberStyles.Any,
                    CultureInfo.InvariantCulture,
                    out var num
                )
            )
            {
                result[kvp.Key] = num;
            }
            // Try to parse as boolean
            else if (bool.TryParse(kvp.Value, out var boolVal))
            {
                result[kvp.Key] = boolVal;
            }
            else
            {
                result[kvp.Key] = kvp.Value;
            }
        }
        return result;
    }

    #endregion
}
