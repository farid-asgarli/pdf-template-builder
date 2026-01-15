using System.Text.Json.Serialization;

namespace PdfBuilder.Api.DTOs.Documents;

// ========================
// Editor Format DTOs
// These DTOs represent the document structure as consumed by the frontend editor.
// Property names use camelCase via JsonPropertyName to match frontend TypeScript types.
// ========================

/// <summary>
/// Complete document content structure for the editor.
/// Maps to frontend Document interface.
/// </summary>
public class EditorDocumentContent
{
    [JsonPropertyName("pages")]
    public List<EditorPage> Pages { get; set; } = [];

    [JsonPropertyName("headerFooter")]
    public EditorHeaderFooter HeaderFooter { get; set; } = new();

    [JsonPropertyName("variables")]
    public Dictionary<string, string> Variables { get; set; } = [];

    [JsonPropertyName("variableDefinitions")]
    public List<object> VariableDefinitions { get; set; } = [];

    [JsonPropertyName("settings")]
    public EditorGlobalSettings Settings { get; set; } = new();
}

/// <summary>
/// A single page in the document.
/// Maps to frontend Page interface.
/// </summary>
public class EditorPage
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("pageNumber")]
    public int PageNumber { get; set; }

    [JsonPropertyName("headerType")]
    public string HeaderType { get; set; } = "default";

    [JsonPropertyName("footerType")]
    public string FooterType { get; set; } = "default";

    [JsonPropertyName("components")]
    public List<EditorComponent> Components { get; set; } = [];
}

/// <summary>
/// A component within a page.
/// Maps to frontend Component interface.
/// </summary>
public class EditorComponent
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("position")]
    public EditorPosition Position { get; set; } = new();

    [JsonPropertyName("size")]
    public EditorSize Size { get; set; } = new();

    [JsonPropertyName("properties")]
    public Dictionary<string, object> Properties { get; set; } = [];

    [JsonPropertyName("condition")]
    public EditorConditionalConfig? Condition { get; set; }
}

/// <summary>
/// Conditional rendering configuration for a component.
/// Maps to frontend ConditionalConfig interface.
/// </summary>
public class EditorConditionalConfig
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("logic")]
    public string Logic { get; set; } = "all";

    [JsonPropertyName("rules")]
    public List<EditorConditionalRule> Rules { get; set; } = [];
}

/// <summary>
/// Single condition rule for conditional rendering.
/// Maps to frontend ConditionalRule interface.
/// </summary>
public class EditorConditionalRule
{
    [JsonPropertyName("variable")]
    public string Variable { get; set; } = string.Empty;

    [JsonPropertyName("operator")]
    public string Operator { get; set; } = "equals";

    [JsonPropertyName("value")]
    public string? Value { get; set; }
}

/// <summary>
/// Position of a component in millimeters.
/// Maps to frontend Position interface.
/// </summary>
public class EditorPosition
{
    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }
}

/// <summary>
/// Size of a component in millimeters.
/// Maps to frontend Size interface.
/// </summary>
public class EditorSize
{
    [JsonPropertyName("width")]
    public double Width { get; set; }

    [JsonPropertyName("height")]
    public double Height { get; set; }
}

/// <summary>
/// Header and footer configuration.
/// Maps to frontend HeaderFooterConfig interface.
/// </summary>
public class EditorHeaderFooter
{
    [JsonPropertyName("defaultHeader")]
    public EditorHeaderFooterContent DefaultHeader { get; set; } = new();

    [JsonPropertyName("defaultFooter")]
    public EditorHeaderFooterContent DefaultFooter { get; set; } = new();

    [JsonPropertyName("firstPageHeader")]
    public EditorHeaderFooterContent? FirstPageHeader { get; set; }

    [JsonPropertyName("firstPageFooter")]
    public EditorHeaderFooterContent? FirstPageFooter { get; set; }
}

/// <summary>
/// Content for a header or footer section.
/// Maps to frontend HeaderFooterContent interface.
/// </summary>
public class EditorHeaderFooterContent
{
    [JsonPropertyName("height")]
    public double Height { get; set; }

    [JsonPropertyName("components")]
    public List<EditorComponent> Components { get; set; } = [];
}

/// <summary>
/// Global document settings.
/// Maps to frontend GlobalDocumentSettings interface.
/// </summary>
public class EditorGlobalSettings
{
    [JsonPropertyName("predefinedSize")]
    public string PredefinedSize { get; set; } = "a4";

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait";

    [JsonPropertyName("backgroundColor")]
    public string BackgroundColor { get; set; } = "#FFFFFF";

    [JsonPropertyName("contentDirection")]
    public string ContentDirection { get; set; } = "ltr";

    [JsonPropertyName("margins")]
    public EditorMargins Margins { get; set; } = new();
}

/// <summary>
/// Page margins in millimeters.
/// Maps to frontend PageMargins interface.
/// </summary>
public class EditorMargins
{
    [JsonPropertyName("top")]
    public double Top { get; set; }

    [JsonPropertyName("right")]
    public double Right { get; set; }

    [JsonPropertyName("bottom")]
    public double Bottom { get; set; }

    [JsonPropertyName("left")]
    public double Left { get; set; }
}
