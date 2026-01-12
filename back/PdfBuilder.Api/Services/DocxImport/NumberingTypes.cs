namespace PdfBuilder.Api.Services.DocxImport;

/// <summary>
/// Represents a Word numbering definition (list style).
/// </summary>
public class NumberingDefinition
{
    public int NumId { get; set; }

    /// <summary>
    /// The abstract numbering ID this instance is based on.
    /// </summary>
    public int AbstractNumId { get; set; }

    /// <summary>
    /// Level definitions for this numbering.
    /// </summary>
    public Dictionary<int, NumberingLevelInfo> Levels { get; set; } = [];

    /// <summary>
    /// Level overrides for this specific numbering instance (from w:lvlOverride).
    /// </summary>
    public Dictionary<int, NumberingLevelOverride> LevelOverrides { get; set; } = [];
}

/// <summary>
/// Level override information that can change start value or other properties.
/// </summary>
public class NumberingLevelOverride
{
    public int LevelIndex { get; set; }

    /// <summary>
    /// Override start value (from w:startOverride).
    /// </summary>
    public int? StartOverride { get; set; }

    /// <summary>
    /// Optional level definition override.
    /// </summary>
    public NumberingLevelInfo? LevelInfo { get; set; }
}

/// <summary>
/// Information about a specific level in a numbering definition.
/// </summary>
public class NumberingLevelInfo
{
    public int LevelIndex { get; set; }

    /// <summary>
    /// Number format: "bullet", "decimal", "lowerRoman", "upperRoman", "lowerLetter", "upperLetter", "none".
    /// </summary>
    public string NumFormat { get; set; } = "bullet";

    /// <summary>
    /// Level text pattern (e.g., "%1.", "%1.%2", "•").
    /// Contains placeholders like %1, %2 for level numbers.
    /// </summary>
    public string LevelText { get; set; } = "•";

    /// <summary>
    /// Start value for numbering at this level.
    /// </summary>
    public int StartValue { get; set; } = 1;

    /// <summary>
    /// Indentation in millimeters.
    /// </summary>
    public double IndentMm { get; set; }

    /// <summary>
    /// Hanging indent in millimeters.
    /// </summary>
    public double HangingIndentMm { get; set; }

    /// <summary>
    /// Whether this level restarts when its parent level increments.
    /// </summary>
    public bool RestartAfterHigherLevel { get; set; } = true;

    /// <summary>
    /// Level that triggers restart (-1 means restart after any higher level).
    /// </summary>
    public int RestartLevel { get; set; } = -1;
}

/// <summary>
/// Tracks the current state of list numbering during document parsing.
/// </summary>
public class NumberingState
{
    /// <summary>
    /// Current counter values per numId and level.
    /// Key is (numId, level), value is current count.
    /// </summary>
    public Dictionary<(int NumId, int Level), int> Counters { get; } = [];

    /// <summary>
    /// Previous numId encountered (to detect list changes).
    /// </summary>
    public int? PreviousNumId { get; set; }

    /// <summary>
    /// Previous level encountered (to detect level changes for restart).
    /// </summary>
    public int PreviousLevel { get; set; } = -1;

    /// <summary>
    /// Gets and increments the counter for the specified list level.
    /// Handles restart logic when levels change.
    /// </summary>
    public int GetNextNumber(int numId, int level, NumberingDefinition definition, bool isNewList)
    {
        // Check if we need to restart counters
        if (isNewList || PreviousNumId != numId)
        {
            // New list - reset all counters for this numId
            ResetCounters(numId);
        }
        else if (PreviousLevel >= 0 && level > PreviousLevel)
        {
            // Going deeper - reset counters for this and deeper levels
            for (var l = level; l <= 8; l++)
            {
                var key = (numId, l);
                if (Counters.ContainsKey(key))
                {
                    Counters.Remove(key);
                }
            }
        }
        else if (PreviousLevel >= 0 && level < PreviousLevel)
        {
            // Going up - check restart settings for lower levels
            for (var l = level + 1; l <= 8; l++)
            {
                var key = (numId, l);
                if (Counters.ContainsKey(key))
                {
                    // Check if this level should restart
                    if (
                        definition.Levels.TryGetValue(l, out var levelInfo)
                        && levelInfo.RestartAfterHigherLevel
                    )
                    {
                        Counters.Remove(key);
                    }
                }
            }
        }

        // Get start value from override or level definition
        var startValue = 1;
        if (definition.LevelOverrides.TryGetValue(level, out var levelOverride))
        {
            startValue = levelOverride.StartOverride ?? levelOverride.LevelInfo?.StartValue ?? 1;
        }
        else if (definition.Levels.TryGetValue(level, out var levelDef))
        {
            startValue = levelDef.StartValue;
        }

        // Get or initialize counter
        var counterKey = (numId, level);
        if (!Counters.TryGetValue(counterKey, out var currentValue))
        {
            currentValue = startValue;
            Counters[counterKey] = currentValue;
        }
        else
        {
            currentValue++;
            Counters[counterKey] = currentValue;
        }

        // Update tracking
        PreviousNumId = numId;
        PreviousLevel = level;

        return currentValue;
    }

    /// <summary>
    /// Resets all counters for a specific numbering instance.
    /// </summary>
    public void ResetCounters(int numId)
    {
        var keysToRemove = Counters.Keys.Where(k => k.NumId == numId).ToList();
        foreach (var key in keysToRemove)
        {
            Counters.Remove(key);
        }
    }
}
