using System.Text.Json;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Data models for parsing document JSON content.
/// Designed to work with QuestPDF for PDF generation.
/// </summary>
public class DocumentData
{
    public List<PageData> Pages { get; set; } = [];
    public HeaderFooterConfig HeaderFooter { get; set; } = new();
    public Dictionary<string, string> Variables { get; set; } = [];

    /// <summary>
    /// Complex variables (arrays, objects) stored as JsonElements for template processing.
    /// </summary>
    public Dictionary<string, JsonElement> ComplexVariables { get; set; } = [];

    /// <summary>
    /// Variable definitions that describe what variables the document expects.
    /// This defines the schema for variables (type, required, default, etc.).
    /// </summary>
    public List<VariableDefinition> VariableDefinitions { get; set; } = [];

    /// <summary>
    /// Global document settings that apply to all pages unless overridden.
    /// </summary>
    public GlobalDocumentSettings? Settings { get; set; }
}

/// <summary>
/// Global document settings that can be overridden at page level.
/// </summary>
public class GlobalDocumentSettings
{
    /// <summary>
    /// Default page size preset (a3, a4, a5, letter, legal, ledger, tabloid, executive).
    /// </summary>
    public string PredefinedSize { get; set; } = "a4";

    /// <summary>
    /// Default orientation (portrait or landscape).
    /// </summary>
    public string Orientation { get; set; } = "portrait";

    /// <summary>
    /// Default background color for pages.
    /// </summary>
    public string BackgroundColor { get; set; } = "#FFFFFF";

    /// <summary>
    /// Default content direction (ltr or rtl).
    /// </summary>
    public string ContentDirection { get; set; } = "ltr";

    /// <summary>
    /// Default margins for pages.
    /// </summary>
    public PageMargins Margins { get; set; } = new();
}

public class PageData
{
    public string Id { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public string HeaderType { get; set; } = "default";
    public string FooterType { get; set; } = "default";
    public List<ComponentData> Components { get; set; } = [];

    /// <summary>
    /// Page-specific settings that override global settings.
    /// </summary>
    public PageSettings? PageSettings { get; set; }
}

/// <summary>
/// Page-level settings for size, orientation, margins, etc.
/// Values are in millimeters unless otherwise specified.
/// </summary>
public class PageSettings
{
    /// <summary>
    /// Predefined page size (a3, a4, a5, letter, legal, ledger, tabloid, executive).
    /// Takes precedence over custom width/height if set.
    /// </summary>
    public string? PredefinedSize { get; set; }

    /// <summary>
    /// Custom page width in millimeters. Used when PredefinedSize is not set.
    /// </summary>
    public double Width { get; set; }

    /// <summary>
    /// Custom page height in millimeters. Used when PredefinedSize is not set.
    /// </summary>
    public double Height { get; set; }

    /// <summary>
    /// Page orientation: "portrait" or "landscape".
    /// </summary>
    public string Orientation { get; set; } = "portrait";

    /// <summary>
    /// Page background color (hex color code).
    /// </summary>
    public string BackgroundColor { get; set; } = "#FFFFFF";

    /// <summary>
    /// Content direction: "ltr" (left-to-right) or "rtl" (right-to-left).
    /// </summary>
    public string ContentDirection { get; set; } = "ltr";

    /// <summary>
    /// Page margins in millimeters.
    /// </summary>
    public PageMargins Margins { get; set; } = new();
}

/// <summary>
/// Page margins in millimeters.
/// </summary>
public class PageMargins
{
    public double Top { get; set; } = 0;
    public double Right { get; set; } = 0;
    public double Bottom { get; set; } = 0;
    public double Left { get; set; } = 0;
}

public class ComponentData
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public PositionData Position { get; set; } = new();
    public SizeData Size { get; set; } = new();
    public Dictionary<string, JsonElement> Properties { get; set; } = [];

    /// <summary>
    /// Optional conditional rendering configuration.
    /// When set and enabled, the component will only render if conditions are met.
    /// </summary>
    public ConditionalConfig? Condition { get; set; }
}

/// <summary>
/// Conditional rendering configuration for a component.
/// </summary>
public class ConditionalConfig
{
    /// <summary>
    /// Whether conditional rendering is enabled for this component.
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// How to combine multiple rules: "all" = AND, "any" = OR.
    /// </summary>
    public string Logic { get; set; } = "all";

    /// <summary>
    /// List of conditions to evaluate.
    /// </summary>
    public List<ConditionalRule> Rules { get; set; } = [];
}

/// <summary>
/// Single condition rule for conditional rendering.
/// </summary>
public class ConditionalRule
{
    /// <summary>
    /// Variable name to check (e.g., "customerType", "hasDiscount").
    /// </summary>
    public string Variable { get; set; } = string.Empty;

    /// <summary>
    /// Comparison operator (equals, not_equals, contains, etc.).
    /// </summary>
    public string Operator { get; set; } = "equals";

    /// <summary>
    /// Value to compare against (not needed for is_empty, is_not_empty, is_true, is_false).
    /// </summary>
    public string? Value { get; set; }
}

public class PositionData
{
    public double X { get; set; }
    public double Y { get; set; }
}

public class SizeData
{
    public double Width { get; set; }
    public double Height { get; set; }
}

public class HeaderFooterConfig
{
    public HeaderFooterContent DefaultHeader { get; set; } = new() { Height = 25 };
    public HeaderFooterContent DefaultFooter { get; set; } = new() { Height = 15 };
    public HeaderFooterContent? FirstPageHeader { get; set; }
    public HeaderFooterContent? FirstPageFooter { get; set; }
    public HeaderFooterContent? CompactHeader { get; set; }
    public HeaderFooterContent? CompactFooter { get; set; }
}

public class HeaderFooterContent
{
    public double Height { get; set; } = 20;
    public List<ComponentData> Components { get; set; } = [];
}
