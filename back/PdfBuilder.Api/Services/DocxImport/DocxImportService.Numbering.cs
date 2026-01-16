using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using PdfBuilder.Api.Services.DocxImport;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing numbering and list support methods.
/// Handles Word's complex numbering system including multi-level lists,
/// restart rules, and level overrides.
/// </summary>
public partial class DocxImportService
{
    /// <summary>
    /// Tracks numbering state during document parsing for proper sequential numbering.
    /// </summary>
    private NumberingState? _numberingState;

    #region Numbering/List Support

    /// <summary>
    /// Builds the numbering cache from the document's numbering definitions.
    /// This includes abstract numbering definitions and numbering instances with their overrides.
    /// </summary>
    private void BuildNumberingCache(MainDocumentPart mainPart)
    {
        _numberingCache = [];
        _numberingState = new NumberingState();

        var numberingPart = mainPart.NumberingDefinitionsPart;
        if (numberingPart?.Numbering == null)
            return;

        var abstractNums = numberingPart.Numbering.Elements<AbstractNum>().ToList();
        var numInstances = numberingPart.Numbering.Elements<NumberingInstance>().ToList();

        foreach (var numInstance in numInstances)
        {
            if (numInstance.NumberID?.Value == null)
                continue;

            var numId = numInstance.NumberID.Value;
            var abstractNumId = numInstance.AbstractNumId?.Val?.Value;

            if (abstractNumId == null)
                continue;

            var abstractNum = abstractNums.FirstOrDefault(a =>
                a.AbstractNumberId?.Value == abstractNumId
            );
            if (abstractNum == null)
                continue;

            var definition = new NumberingDefinition
            {
                NumId = numId,
                AbstractNumId = abstractNumId.Value,
            };

            // Parse all levels from abstract numbering
            foreach (var level in abstractNum.Elements<Level>())
            {
                if (level.LevelIndex?.Value == null)
                    continue;

                var levelInfo = ParseLevelInfo(level);
                definition.Levels[levelInfo.LevelIndex] = levelInfo;
            }

            // Parse level overrides from the numbering instance
            foreach (var lvlOverride in numInstance.Elements<LevelOverride>())
            {
                if (lvlOverride.LevelIndex?.Value == null)
                    continue;

                var levelIndex = lvlOverride.LevelIndex.Value;
                var overrideInfo = new NumberingLevelOverride { LevelIndex = levelIndex };

                // Check for start override
                if (lvlOverride.StartOverrideNumberingValue?.Val?.Value is int startOverride)
                {
                    overrideInfo.StartOverride = startOverride;
                }

                // Check for level definition override
                var overrideLevel = lvlOverride.GetFirstChild<Level>();
                if (overrideLevel != null)
                {
                    overrideInfo.LevelInfo = ParseLevelInfo(overrideLevel);
                }

                definition.LevelOverrides[levelIndex] = overrideInfo;
            }

            _numberingCache[numId] = definition;
        }
    }

    /// <summary>
    /// Parses level information from a Level element.
    /// </summary>
    private NumberingLevelInfo ParseLevelInfo(Level level)
    {
        var levelInfo = new NumberingLevelInfo
        {
            LevelIndex = level.LevelIndex?.Value ?? 0,
            NumFormat = NormalizeNumFormat(level.NumberingFormat?.Val?.Value.ToString()),
            LevelText = level.LevelText?.Val?.Value ?? "•",
            StartValue = level.StartNumberingValue?.Val?.Value ?? 1,
        };

        // Parse restart setting
        var restartSetting = level.LevelRestart?.Val?.Value;
        if (restartSetting.HasValue)
        {
            levelInfo.RestartLevel = restartSetting.Value;
            levelInfo.RestartAfterHigherLevel = restartSetting.Value >= 0;
        }

        // Get indentation from paragraph properties
        var indentProps = level.PreviousParagraphProperties?.Indentation;
        if (indentProps != null)
        {
            // Left indent
            if (
                indentProps.Left?.Value != null
                && int.TryParse(indentProps.Left.Value, out var leftTwips)
            )
            {
                levelInfo.IndentMm = leftTwips / TWIPS_PER_MM;
            }

            // Hanging indent
            if (
                indentProps.Hanging?.Value != null
                && int.TryParse(indentProps.Hanging.Value, out var hangingTwips)
            )
            {
                levelInfo.HangingIndentMm = hangingTwips / TWIPS_PER_MM;
            }
        }

        return levelInfo;
    }

    /// <summary>
    /// Normalizes the number format string to a consistent lowercase format.
    /// </summary>
    private static string NormalizeNumFormat(string? format)
    {
        if (string.IsNullOrEmpty(format))
            return "bullet";

        // OpenXml NumberFormatValues enum ToString() returns PascalCase
        return format.ToLowerInvariant() switch
        {
            "bullet" => "bullet",
            "decimal" => "decimal",
            "lowerroman" => "lowerRoman",
            "upperroman" => "upperRoman",
            "lowerletter" => "lowerLetter",
            "upperletter" => "upperLetter",
            "decimalnoleadingzero" => "decimal",
            "ordinal" => "decimal",
            "cardinaltext" => "decimal",
            "ordinaltext" => "decimal",
            "none" => "none",
            _ => "bullet",
        };
    }

    /// <summary>
    /// Gets list information for a paragraph, including the computed marker.
    /// </summary>
    private DocxListInfo? GetListInfo(Paragraph paragraph)
    {
        var numProps = paragraph.ParagraphProperties?.NumberingProperties;
        if (numProps == null)
            return null;

        var numId = numProps.NumberingId?.Val?.Value;
        var levelIndex = numProps.NumberingLevelReference?.Val?.Value ?? 0;

        if (numId == null || numId == 0)
            return null;

        var listInfo = new DocxListInfo
        {
            NumberingId = numId,
            Level = levelIndex,
            IndentMm = DocxConversionConstants.DefaultListIndentMm * (levelIndex + 1),
        };

        if (_numberingCache != null && _numberingCache.TryGetValue(numId.Value, out var definition))
        {
            // Get effective level info (considering overrides)
            var levelInfo = GetEffectiveLevelInfo(definition, levelIndex);

            // Set list type based on format
            listInfo.ListType = GetListType(levelInfo.NumFormat);

            // Get the current number from our state tracker
            var currentNumber =
                _numberingState?.GetNextNumber(
                    numId.Value,
                    levelIndex,
                    definition,
                    isNewList: false // We track this internally
                ) ?? 1;

            // Generate the actual marker with the computed number
            listInfo.Marker = GenerateMarker(levelInfo, currentNumber, definition, levelIndex);

            // Use level indentation if available
            if (levelInfo.IndentMm > 0)
            {
                listInfo.IndentMm = levelInfo.IndentMm;
            }
        }

        return listInfo;
    }

    /// <summary>
    /// Gets the effective level info, considering overrides.
    /// </summary>
    private static NumberingLevelInfo GetEffectiveLevelInfo(
        NumberingDefinition definition,
        int levelIndex
    )
    {
        // Check for level override first
        if (
            definition.LevelOverrides.TryGetValue(levelIndex, out var lvlOverride)
            && lvlOverride.LevelInfo != null
        )
        {
            return lvlOverride.LevelInfo;
        }

        // Fall back to standard level definition
        if (definition.Levels.TryGetValue(levelIndex, out var levelInfo))
        {
            return levelInfo;
        }

        // Default level info
        return new NumberingLevelInfo
        {
            LevelIndex = levelIndex,
            NumFormat = "bullet",
            LevelText = "•",
            StartValue = 1,
        };
    }

    /// <summary>
    /// Determines the list type from the number format.
    /// </summary>
    private static string GetListType(string numFormat)
    {
        return numFormat switch
        {
            "bullet" => "bullet",
            "decimal" => "number",
            "lowerRoman" => "number",
            "upperRoman" => "number",
            "lowerLetter" => "number",
            "upperLetter" => "number",
            "none" => "none",
            _ => "bullet",
        };
    }

    /// <summary>
    /// Generates the marker text for a list item.
    /// Handles complex level text patterns like "%1.", "%1.%2", etc.
    /// </summary>
    private string GenerateMarker(
        NumberingLevelInfo levelInfo,
        int currentNumber,
        NumberingDefinition definition,
        int levelIndex
    )
    {
        var levelText = levelInfo.LevelText;

        // For bullet lists, return the bullet character directly
        if (levelInfo.NumFormat == "bullet")
        {
            // Map common bullet characters
            return levelText switch
            {
                "" or "●" => "•",
                "○" => "◦",
                "■" => "▪",
                "□" => "▫",
                "►" => "▸",
                "◆" => "◆",
                _ => string.IsNullOrEmpty(levelText) ? "•" : levelText,
            };
        }

        // For numbered lists, replace placeholders
        var marker = levelText;

        // Replace %1, %2, %3, etc. with actual numbers
        for (var i = 0; i <= levelIndex; i++)
        {
            var placeholder = $"%{i + 1}";
            if (marker.Contains(placeholder))
            {
                // Get the counter for this level
                int levelNumber;
                if (i == levelIndex)
                {
                    levelNumber = currentNumber;
                }
                else
                {
                    // Get parent level counter
                    var key = (definition.NumId, i);
                    levelNumber =
                        _numberingState?.Counters.TryGetValue(key, out var val) == true ? val : 1;
                }

                // Format the number based on the level's format
                var effectiveLevel = GetEffectiveLevelInfo(definition, i);
                var formattedNumber = FormatNumber(levelNumber, effectiveLevel.NumFormat);
                marker = marker.Replace(placeholder, formattedNumber);
            }
        }

        return marker;
    }

    /// <summary>
    /// Formats a number according to the specified format type.
    /// </summary>
    private static string FormatNumber(int number, string format)
    {
        return format switch
        {
            "decimal" => number.ToString(),
            "lowerLetter" => ConvertToLetter(number, lowercase: true),
            "upperLetter" => ConvertToLetter(number, lowercase: false),
            "lowerRoman" => ConvertToRoman(number).ToLowerInvariant(),
            "upperRoman" => ConvertToRoman(number),
            "none" => "",
            _ => number.ToString(),
        };
    }

    /// <summary>
    /// Converts a number to letter representation (a, b, c, ... z, aa, ab, etc.).
    /// </summary>
    private static string ConvertToLetter(int number, bool lowercase)
    {
        var result = "";
        while (number > 0)
        {
            number--;
            result = (char)((lowercase ? 'a' : 'A') + (number % 26)) + result;
            number /= 26;
        }
        return result;
    }

    /// <summary>
    /// Converts a number to Roman numeral representation.
    /// </summary>
    private static string ConvertToRoman(int number)
    {
        if (number <= 0 || number > 3999)
            return number.ToString();

        var romanNumerals = new (int Value, string Numeral)[]
        {
            (1000, "M"),
            (900, "CM"),
            (500, "D"),
            (400, "CD"),
            (100, "C"),
            (90, "XC"),
            (50, "L"),
            (40, "XL"),
            (10, "X"),
            (9, "IX"),
            (5, "V"),
            (4, "IV"),
            (1, "I"),
        };

        var result = "";
        foreach (var (value, numeral) in romanNumerals)
        {
            while (number >= value)
            {
                result += numeral;
                number -= value;
            }
        }
        return result;
    }

    /// <summary>
    /// Resets the numbering state. Call this before parsing a new document.
    /// </summary>
    private void ResetNumberingState()
    {
        _numberingState = new NumberingState();
    }

    #endregion

    #region Hyperlink Extraction

    private static List<ParsedDocxHyperlink> ExtractHyperlinks(MainDocumentPart mainPart)
    {
        var hyperlinks = new List<ParsedDocxHyperlink>();

        foreach (var rel in mainPart.HyperlinkRelationships)
        {
            hyperlinks.Add(
                new ParsedDocxHyperlink
                {
                    Id = rel.Id,
                    Url = rel.Uri.ToString(),
                    IsExternal = rel.IsExternal,
                }
            );
        }

        return hyperlinks;
    }

    #endregion
}
