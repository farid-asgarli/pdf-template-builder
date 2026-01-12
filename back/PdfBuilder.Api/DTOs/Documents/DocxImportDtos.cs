namespace PdfBuilder.Api.DTOs.Documents;

// ========================
// DOCX Import DTOs
// ========================

/// <summary>
/// Response for DOCX import operation.
/// </summary>
public record DocxImportResponse(
    bool Success,
    DocumentResponse? Document = null,
    string? ErrorMessage = null,
    DocxImportMetadata? Metadata = null
);

/// <summary>
/// Metadata about the imported DOCX file.
/// </summary>
public record DocxImportMetadata(
    int ParagraphCount,
    int TableCount,
    int ImageCount,
    int ListCount,
    int HyperlinkCount,
    int TotalPages,
    string? OriginalFileName = null,
    List<string>? Warnings = null,
    bool HasHeaders = false,
    bool HasFooters = false,
    int PageBreakCount = 0,
    int SectionCount = 1,
    int MergedCellCount = 0,
    int TextBoxCount = 0,
    int FootnoteCount = 0,
    int EndnoteCount = 0,
    int BookmarkCount = 0,
    int CommentCount = 0,
    int ShapeCount = 0,
    bool HasWatermark = false,
    DocxDocumentProperties? DocumentProperties = null,
    // New advanced features
    int EquationCount = 0,
    int ChartCount = 0,
    int SmartArtCount = 0,
    int FormFieldCount = 0,
    int ContentControlCount = 0,
    int RevisionCount = 0,
    int StyleCount = 0,
    bool HasTableOfContents = false,
    int CitationCount = 0,
    int BibliographySourceCount = 0,
    int EmbeddedObjectCount = 0,
    bool HasCustomXml = false,
    ParsedDocxTheme? Theme = null
);

/// <summary>
/// Intermediate structure for parsed DOCX content before conversion to editor format.
/// </summary>
public class ParsedDocxContent
{
    public List<ParsedDocxElement> Elements { get; set; } = [];
    public DocxPageSettings PageSettings { get; set; } = new();
    public List<ParsedDocxImage> Images { get; set; } = [];
    public List<ParsedDocxHyperlink> Hyperlinks { get; set; } = [];

    /// <summary>Document headers by type (default, first, even)</summary>
    public Dictionary<string, ParsedDocxHeaderFooter> Headers { get; set; } = new();

    /// <summary>Document footers by type (default, first, even)</summary>
    public Dictionary<string, ParsedDocxHeaderFooter> Footers { get; set; } = new();

    /// <summary>All sections in the document (for different page settings)</summary>
    public List<ParsedDocxSection> Sections { get; set; } = [];

    /// <summary>Tab stop definitions by style</summary>
    public List<DocxTabStop> DefaultTabStops { get; set; } = [];

    /// <summary>Text boxes and shapes with text</summary>
    public List<ParsedDocxTextBox> TextBoxes { get; set; } = [];

    /// <summary>Footnotes referenced in the document</summary>
    public List<ParsedDocxNote> Footnotes { get; set; } = [];

    /// <summary>Endnotes referenced in the document</summary>
    public List<ParsedDocxNote> Endnotes { get; set; } = [];

    /// <summary>Bookmarks in the document</summary>
    public List<ParsedDocxBookmark> Bookmarks { get; set; } = [];

    /// <summary>Comments in the document</summary>
    public List<ParsedDocxComment> Comments { get; set; } = [];

    /// <summary>Document properties/metadata</summary>
    public DocxDocumentProperties? DocumentProperties { get; set; }

    /// <summary>Document watermark (if present)</summary>
    public ParsedDocxWatermark? Watermark { get; set; }

    /// <summary>Shapes and drawings</summary>
    public List<ParsedDocxShape> Shapes { get; set; } = [];

    // ========================
    // NEW ADVANCED FEATURES
    // ========================

    /// <summary>Math equations (OMML)</summary>
    public List<ParsedDocxEquation> Equations { get; set; } = [];

    /// <summary>Embedded charts</summary>
    public List<ParsedDocxChart> Charts { get; set; } = [];

    /// <summary>SmartArt diagrams</summary>
    public List<ParsedDocxSmartArt> SmartArt { get; set; } = [];

    /// <summary>Legacy form fields</summary>
    public List<ParsedDocxFormField> FormFields { get; set; } = [];

    /// <summary>Content controls (SDTs)</summary>
    public List<ParsedDocxContentControl> ContentControls { get; set; } = [];

    /// <summary>Tracked changes/revisions</summary>
    public List<ParsedDocxRevision> Revisions { get; set; } = [];

    /// <summary>Revision settings</summary>
    public DocxRevisionSettings? RevisionSettings { get; set; }

    /// <summary>Document theme</summary>
    public ParsedDocxTheme? Theme { get; set; }

    /// <summary>Named styles</summary>
    public List<ParsedDocxStyle> Styles { get; set; } = [];

    /// <summary>Table of contents (if present)</summary>
    public ParsedDocxTableOfContents? TableOfContents { get; set; }

    /// <summary>Bibliography (if present)</summary>
    public ParsedDocxBibliography? Bibliography { get; set; }

    /// <summary>Citations in the document</summary>
    public List<DocxCitation> Citations { get; set; } = [];

    /// <summary>Custom XML data parts</summary>
    public List<DocxCustomXmlData> CustomXmlData { get; set; } = [];

    /// <summary>Embedded objects (OLE)</summary>
    public List<ParsedDocxEmbeddedObject> EmbeddedObjects { get; set; } = [];
}

/// <summary>
/// Base class for parsed DOCX elements.
/// </summary>
public abstract class ParsedDocxElement
{
    public string ElementType { get; set; } = string.Empty;
}

/// <summary>
/// Parsed paragraph from DOCX.
/// </summary>
public class ParsedDocxParagraph : ParsedDocxElement
{
    public string Text { get; set; } = string.Empty;
    public DocxTextStyle Style { get; set; } = new();
    public DocxParagraphStyle ParagraphStyle { get; set; } = new();
    public bool IsHeading { get; set; }
    public int HeadingLevel { get; set; }
    public List<ParsedDocxTextRun> Runs { get; set; } = [];

    // List properties
    public bool IsListItem { get; set; }
    public DocxListInfo? ListInfo { get; set; }
}

/// <summary>
/// List information for list items.
/// </summary>
public class DocxListInfo
{
    /// <summary>Type of list: "bullet" or "number"</summary>
    public string ListType { get; set; } = "bullet";

    /// <summary>Nesting level (0 = top level, 1 = first indent, etc.)</summary>
    public int Level { get; set; }

    /// <summary>Numbering ID from the document's numbering definitions</summary>
    public int? NumberingId { get; set; }

    /// <summary>Computed list marker text (e.g., "1.", "a)", "•")</summary>
    public string Marker { get; set; } = "•";

    /// <summary>Indentation for this list level in mm</summary>
    public double IndentMm { get; set; } = 6.35; // 0.25 inch default
}

/// <summary>
/// Text run within a paragraph (allows mixed formatting).
/// </summary>
public class ParsedDocxTextRun
{
    public string Text { get; set; } = string.Empty;
    public DocxTextStyle Style { get; set; } = new();

    /// <summary>Hyperlink URL if this run is a link</summary>
    public string? HyperlinkUrl { get; set; }
}

/// <summary>
/// Paragraph-level styling from DOCX (spacing, indentation, etc.)
/// </summary>
public class DocxParagraphStyle
{
    /// <summary>Space before paragraph in points</summary>
    public double SpaceBefore { get; set; }

    /// <summary>Space after paragraph in points</summary>
    public double SpaceAfter { get; set; } = 8; // Word default is 8pt after

    /// <summary>Line spacing multiplier (1.0 = single, 1.5, 2.0 = double)</summary>
    public double LineSpacing { get; set; } = 1.15; // Word default

    /// <summary>Line spacing rule: "auto", "exact", "atLeast"</summary>
    public string LineSpacingRule { get; set; } = "auto";

    /// <summary>First line indentation in mm (positive = indent, negative = hanging)</summary>
    public double FirstLineIndent { get; set; }

    /// <summary>Left indentation in mm</summary>
    public double LeftIndent { get; set; }

    /// <summary>Right indentation in mm</summary>
    public double RightIndent { get; set; }

    /// <summary>Keep paragraph with next (no page break between)</summary>
    public bool KeepWithNext { get; set; }

    /// <summary>Keep all lines together on same page</summary>
    public bool KeepLinesTogether { get; set; }

    /// <summary>Page break before this paragraph</summary>
    public bool PageBreakBefore { get; set; }

    /// <summary>Tab stops defined for this paragraph</summary>
    public List<DocxTabStop> TabStops { get; set; } = [];

    /// <summary>Outline level for TOC (0-9, null = body text)</summary>
    public int? OutlineLevel { get; set; }

    /// <summary>Widow/orphan control enabled</summary>
    public bool WidowControl { get; set; } = true;

    /// <summary>Paragraph borders</summary>
    public DocxParagraphBorder? Border { get; set; }

    /// <summary>Paragraph shading/background</summary>
    public DocxParagraphShading? Shading { get; set; }

    /// <summary>Drop cap configuration (null if no drop cap)</summary>
    public DocxDropCap? DropCap { get; set; }

    /// <summary>Text direction: "ltr" or "rtl"</summary>
    public string TextDirection { get; set; } = "ltr";

    /// <summary>Footnote/endnote references in this paragraph</summary>
    public List<DocxNoteReference> NoteReferences { get; set; } = [];
}

/// <summary>
/// Tab stop definition.
/// </summary>
public class DocxTabStop
{
    /// <summary>Position of tab stop in mm</summary>
    public double Position { get; set; }

    /// <summary>Alignment: "left", "center", "right", "decimal", "bar"</summary>
    public string Alignment { get; set; } = "left";

    /// <summary>Leader character: "none", "dot", "hyphen", "underscore", "middleDot"</summary>
    public string Leader { get; set; } = "none";
}

/// <summary>
/// Text styling from DOCX - character-level formatting.
/// </summary>
public class DocxTextStyle
{
    public string FontFamily { get; set; } = "Inter";
    public double FontSize { get; set; } = 11;
    public bool IsBold { get; set; }
    public bool IsItalic { get; set; }
    public bool IsUnderline { get; set; }
    public bool IsStrikethrough { get; set; }
    public bool IsDoubleStrikethrough { get; set; }
    public string Color { get; set; } = "#000000";
    public string? BackgroundColor { get; set; }
    public string TextAlign { get; set; } = "left";

    // Enhanced text decorations
    /// <summary>Underline style: "single", "double", "thick", "dotted", "dashed", "wavy", "none"</summary>
    public string UnderlineStyle { get; set; } = "single";

    /// <summary>Underline/decoration color (null = same as text color)</summary>
    public string? DecorationColor { get; set; }

    // Vertical alignment
    /// <summary>Vertical alignment: "baseline", "superscript", "subscript"</summary>
    public string VerticalAlign { get; set; } = "baseline";

    // Typography enhancements
    /// <summary>Letter spacing in points (positive = wider, negative = tighter)</summary>
    public double LetterSpacing { get; set; }

    /// <summary>Font scale percentage (100 = normal, 50 = condensed, 150 = expanded)</summary>
    public double FontScale { get; set; } = 100;

    // Text effects
    public bool IsAllCaps { get; set; }
    public bool IsSmallCaps { get; set; }
    public bool IsHidden { get; set; }

    /// <summary>Text outline (hollow letters)</summary>
    public bool IsOutline { get; set; }

    /// <summary>Text shadow effect</summary>
    public bool HasShadow { get; set; }

    /// <summary>Emboss effect</summary>
    public bool IsEmbossed { get; set; }

    /// <summary>Engrave/imprint effect</summary>
    public bool IsImprinted { get; set; }
}

/// <summary>
/// Parsed table from DOCX.
/// </summary>
public class ParsedDocxTable : ParsedDocxElement
{
    public List<DocxTableRow> TableRows { get; set; } = [];
    public List<string> Headers { get; set; } = [];
    public List<List<string>> Rows { get; set; } = [];
    public int ColumnCount { get; set; }
    public bool HasHeaderRow { get; set; }
    public DocxTableStyle Style { get; set; } = new();
    public List<DocxColumnDefinition> ColumnDefinitions { get; set; } = [];
}

/// <summary>
/// Column definition with width information.
/// </summary>
public class DocxColumnDefinition
{
    /// <summary>Width type: "fixed", "auto", "percentage"</summary>
    public string WidthType { get; set; } = "auto";

    /// <summary>Width value in mm (for fixed) or percentage</summary>
    public double Width { get; set; }

    /// <summary>Preferred width as specified in the document</summary>
    public double? PreferredWidth { get; set; }
}

/// <summary>
/// A table row with cell information.
/// </summary>
public class DocxTableRow
{
    public List<DocxTableCell> Cells { get; set; } = [];
    public bool IsHeader { get; set; }
    public double? Height { get; set; }
    public string HeightRule { get; set; } = "auto"; // "auto", "exact", "atLeast"
}

/// <summary>
/// Cell-level styling.
/// </summary>
public class DocxCellStyle
{
    public string? BackgroundColor { get; set; }
    public string TextAlign { get; set; } = "left";
    public string VerticalAlign { get; set; } = "top"; // "top", "center", "bottom"

    // Individual border control
    public DocxBorder? BorderTop { get; set; }
    public DocxBorder? BorderBottom { get; set; }
    public DocxBorder? BorderLeft { get; set; }
    public DocxBorder? BorderRight { get; set; }

    // Padding/margins
    public double PaddingTop { get; set; } = 2;
    public double PaddingBottom { get; set; } = 2;
    public double PaddingLeft { get; set; } = 5;
    public double PaddingRight { get; set; } = 5;
}

/// <summary>
/// Border definition for cells and tables.
/// </summary>
public class DocxBorder
{
    public string Color { get; set; } = "#000000";
    public double Width { get; set; } = 0.5; // points
    public string Style { get; set; } = "single"; // "single", "double", "dashed", "dotted", "none"
}

/// <summary>
/// Table styling from DOCX.
/// </summary>
public class DocxTableStyle
{
    public string BorderColor { get; set; } = "#000000";
    public double BorderWidth { get; set; } = 1;
    public string HeaderBackground { get; set; } = "#f0f0f0";
    public bool AlternateRowColors { get; set; }
    public string? OddRowBackground { get; set; }
    public string? EvenRowBackground { get; set; }

    /// <summary>Table width type: "auto", "fixed", "percentage"</summary>
    public string TableWidthType { get; set; } = "auto";

    /// <summary>Table width value</summary>
    public double? TableWidth { get; set; }

    /// <summary>Table alignment: "left", "center", "right"</summary>
    public string TableAlignment { get; set; } = "left";

    /// <summary>Cell spacing (gap between cells)</summary>
    public double CellSpacing { get; set; }
}

/// <summary>
/// Parsed image from DOCX with enhanced positioning.
/// </summary>
public class ParsedDocxImage
{
    public string ImageId { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Data { get; set; } = Array.Empty<byte>();

    /// <summary>Width in mm (from EMU conversion)</summary>
    public double? Width { get; set; }

    /// <summary>Height in mm (from EMU conversion)</summary>
    public double? Height { get; set; }

    public string? AltText { get; set; }
    public string? Title { get; set; }

    /// <summary>Image position type: "inline", "anchor"</summary>
    public string PositionType { get; set; } = "inline";

    /// <summary>Horizontal position in mm (for anchored images)</summary>
    public double? HorizontalPosition { get; set; }

    /// <summary>Vertical position in mm (for anchored images)</summary>
    public double? VerticalPosition { get; set; }

    /// <summary>Text wrapping style: "inline", "square", "tight", "through", "topAndBottom", "behind", "inFront"</summary>
    public string WrapStyle { get; set; } = "inline";

    /// <summary>Original aspect ratio</summary>
    public double? AspectRatio { get; set; }
}

/// <summary>
/// Hyperlink reference from DOCX.
/// </summary>
public class ParsedDocxHyperlink
{
    public string Id { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Tooltip { get; set; }
    public bool IsExternal { get; set; } = true;
}

/// <summary>
/// Page settings from DOCX.
/// </summary>
public class DocxPageSettings
{
    public double PageWidth { get; set; } = 210; // A4 width in mm
    public double PageHeight { get; set; } = 297; // A4 height in mm
    public double MarginTop { get; set; } = 25.4; // 1 inch in mm
    public double MarginBottom { get; set; } = 25.4;
    public double MarginLeft { get; set; } = 25.4;
    public double MarginRight { get; set; } = 25.4;
    public string Orientation { get; set; } = "portrait";

    /// <summary>Header distance from top edge in mm</summary>
    public double HeaderDistance { get; set; } = 12.7; // 0.5 inch

    /// <summary>Footer distance from bottom edge in mm</summary>
    public double FooterDistance { get; set; } = 12.7;

    /// <summary>Gutter margin (extra margin for binding)</summary>
    public double Gutter { get; set; }

    /// <summary>Gutter position: "left", "top"</summary>
    public string GutterPosition { get; set; } = "left";

    /// <summary>Different first page header/footer</summary>
    public bool DifferentFirstPage { get; set; }

    /// <summary>Different odd/even page headers/footers</summary>
    public bool DifferentOddEven { get; set; }
}

/// <summary>
/// Header or footer content from DOCX.
/// </summary>
public class ParsedDocxHeaderFooter
{
    /// <summary>Type: "default", "first", "even"</summary>
    public string Type { get; set; } = "default";

    /// <summary>Content elements (paragraphs, tables, images)</summary>
    public List<ParsedDocxElement> Elements { get; set; } = [];

    /// <summary>Has page number field</summary>
    public bool HasPageNumber { get; set; }

    /// <summary>Has total pages field</summary>
    public bool HasTotalPages { get; set; }

    /// <summary>Has date field</summary>
    public bool HasDate { get; set; }
}

/// <summary>
/// Section break in DOCX document.
/// </summary>
public class ParsedDocxSection
{
    /// <summary>Section break type: "nextPage", "continuous", "evenPage", "oddPage", "nextColumn"</summary>
    public string BreakType { get; set; } = "nextPage";

    /// <summary>Page settings for this section (may differ from previous)</summary>
    public DocxPageSettings? PageSettings { get; set; }

    /// <summary>Starting element index for this section</summary>
    public int StartIndex { get; set; }

    /// <summary>Ending element index for this section</summary>
    public int EndIndex { get; set; }

    /// <summary>Column configuration for multi-column sections</summary>
    public DocxColumnConfig? Columns { get; set; }
}

/// <summary>
/// Column configuration for multi-column layouts.
/// </summary>
public class DocxColumnConfig
{
    /// <summary>Number of columns</summary>
    public int ColumnCount { get; set; } = 1;

    /// <summary>Space between columns in mm</summary>
    public double ColumnSpacing { get; set; } = 12.7; // 0.5 inch default

    /// <summary>Equal width columns</summary>
    public bool EqualWidth { get; set; } = true;

    /// <summary>Individual column widths (if not equal)</summary>
    public List<double> ColumnWidths { get; set; } = [];

    /// <summary>Draw line between columns</summary>
    public bool SeparatorLine { get; set; }
}

/// <summary>
/// Page break element.
/// </summary>
public class ParsedDocxPageBreak : ParsedDocxElement
{
    /// <summary>Break type: "page", "column", "textWrapping"</summary>
    public string BreakType { get; set; } = "page";
}

/// <summary>
/// Text run with tab character.
/// </summary>
public class DocxTabCharacter
{
    /// <summary>Position in the text where tab occurs</summary>
    public int Position { get; set; }

    /// <summary>Computed spacing to apply (based on tab stops)</summary>
    public double SpacingMm { get; set; }
}

/// <summary>
/// A table cell with enhanced merge support.
/// </summary>
public class DocxTableCell
{
    public string Text { get; set; } = string.Empty;
    public List<ParsedDocxTextRun> Runs { get; set; } = [];
    public DocxCellStyle Style { get; set; } = new();

    /// <summary>Number of columns this cell spans (GridSpan)</summary>
    public int ColumnSpan { get; set; } = 1;

    /// <summary>Number of rows this cell spans (computed from VMerge)</summary>
    public int RowSpan { get; set; } = 1;

    /// <summary>Row span merge type: "restart", "continue", or null</summary>
    public string? RowSpanType { get; set; }

    /// <summary>Is this cell merged and should be skipped in rendering</summary>
    public bool IsMergedContinuation { get; set; }

    /// <summary>Original cell width in mm</summary>
    public double? Width { get; set; }
}

// ========================
// TEXT BOX & SHAPE DTOs
// ========================

/// <summary>
/// Text box or shape container from DOCX.
/// </summary>
public class ParsedDocxTextBox : ParsedDocxElement
{
    /// <summary>Unique identifier for the text box</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Content elements inside the text box</summary>
    public List<ParsedDocxElement> Content { get; set; } = [];

    /// <summary>Text box position and size</summary>
    public DocxBoxPosition Position { get; set; } = new();

    /// <summary>Visual styling for the text box</summary>
    public DocxBoxStyle Style { get; set; } = new();

    /// <summary>Text direction inside the box: "horizontal", "vertical", "rotate90", "rotate270"</summary>
    public string TextDirection { get; set; } = "horizontal";

    /// <summary>Shape type if this is a shape: "rectangle", "roundedRectangle", "ellipse", etc.</summary>
    public string? ShapeType { get; set; }

    /// <summary>Name/title of the text box</summary>
    public string? Name { get; set; }
}

/// <summary>
/// Position and dimensions for floating elements.
/// </summary>
public class DocxBoxPosition
{
    /// <summary>X position in mm</summary>
    public double X { get; set; }

    /// <summary>Y position in mm</summary>
    public double Y { get; set; }

    /// <summary>Width in mm</summary>
    public double Width { get; set; } = 100;

    /// <summary>Height in mm</summary>
    public double Height { get; set; } = 50;

    /// <summary>Horizontal anchor: "margin", "page", "column", "character"</summary>
    public string HorizontalAnchor { get; set; } = "margin";

    /// <summary>Vertical anchor: "margin", "page", "paragraph", "line"</summary>
    public string VerticalAnchor { get; set; } = "paragraph";

    /// <summary>Horizontal alignment: "left", "center", "right", "inside", "outside", "absolute"</summary>
    public string HorizontalAlignment { get; set; } = "absolute";

    /// <summary>Vertical alignment: "top", "center", "bottom", "inside", "outside", "absolute"</summary>
    public string VerticalAlignment { get; set; } = "absolute";

    /// <summary>Z-index/layer order</summary>
    public int ZIndex { get; set; }

    /// <summary>Text wrapping: "none", "square", "tight", "through", "topAndBottom"</summary>
    public string TextWrap { get; set; } = "square";

    /// <summary>Wrap distance from text - top in mm</summary>
    public double WrapDistanceTop { get; set; } = 3.17;

    /// <summary>Wrap distance from text - bottom in mm</summary>
    public double WrapDistanceBottom { get; set; } = 3.17;

    /// <summary>Wrap distance from text - left in mm</summary>
    public double WrapDistanceLeft { get; set; } = 3.17;

    /// <summary>Wrap distance from text - right in mm</summary>
    public double WrapDistanceRight { get; set; } = 3.17;

    /// <summary>Rotation in degrees</summary>
    public double Rotation { get; set; }
}

/// <summary>
/// Visual styling for text boxes and shapes.
/// </summary>
public class DocxBoxStyle
{
    /// <summary>Background/fill color (null = transparent)</summary>
    public string? BackgroundColor { get; set; }

    /// <summary>Border color</summary>
    public string BorderColor { get; set; } = "#000000";

    /// <summary>Border width in points</summary>
    public double BorderWidth { get; set; } = 0.75;

    /// <summary>Border style: "solid", "dashed", "dotted", "double", "none"</summary>
    public string BorderStyle { get; set; } = "solid";

    /// <summary>Border radius for rounded corners in mm</summary>
    public double BorderRadius { get; set; }

    /// <summary>Opacity (0-100)</summary>
    public int Opacity { get; set; } = 100;

    /// <summary>Internal padding - top in mm</summary>
    public double PaddingTop { get; set; } = 3.5;

    /// <summary>Internal padding - bottom in mm</summary>
    public double PaddingBottom { get; set; } = 3.5;

    /// <summary>Internal padding - left in mm</summary>
    public double PaddingLeft { get; set; } = 7;

    /// <summary>Internal padding - right in mm</summary>
    public double PaddingRight { get; set; } = 7;

    /// <summary>Shadow effect</summary>
    public DocxShadowEffect? Shadow { get; set; }
}

/// <summary>
/// Shadow effect for shapes and text boxes.
/// </summary>
public class DocxShadowEffect
{
    public string Color { get; set; } = "#000000";
    public double OffsetX { get; set; } = 2;
    public double OffsetY { get; set; } = 2;
    public double Blur { get; set; } = 4;
    public int Opacity { get; set; } = 50;
}

// ========================
// FOOTNOTE & ENDNOTE DTOs
// ========================

/// <summary>
/// Footnote or endnote from DOCX.
/// </summary>
public class ParsedDocxNote
{
    /// <summary>Note ID (numeric identifier)</summary>
    public int Id { get; set; }

    /// <summary>Note type: "footnote" or "endnote"</summary>
    public string NoteType { get; set; } = "footnote";

    /// <summary>Content paragraphs of the note</summary>
    public List<ParsedDocxParagraph> Content { get; set; } = [];

    /// <summary>The text of the reference marker in the body</summary>
    public string ReferenceMarker { get; set; } = string.Empty;

    /// <summary>Custom marker text (if not auto-numbered)</summary>
    public string? CustomMarker { get; set; }
}

/// <summary>
/// Reference to a footnote/endnote in the document body.
/// </summary>
public class DocxNoteReference
{
    public int NoteId { get; set; }
    public string NoteType { get; set; } = "footnote";

    /// <summary>Position in the paragraph text</summary>
    public int PositionInText { get; set; }
}

// ========================
// BOOKMARK DTOs
// ========================

/// <summary>
/// Bookmark from DOCX for internal navigation.
/// </summary>
public class ParsedDocxBookmark
{
    /// <summary>Bookmark ID</summary>
    public int Id { get; set; }

    /// <summary>Bookmark name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Start position in document (element index)</summary>
    public int StartElementIndex { get; set; }

    /// <summary>End position in document (element index)</summary>
    public int EndElementIndex { get; set; }

    /// <summary>Start position in text (if within a paragraph)</summary>
    public int? StartTextOffset { get; set; }

    /// <summary>End position in text (if within a paragraph)</summary>
    public int? EndTextOffset { get; set; }

    /// <summary>The bookmarked text content</summary>
    public string BookmarkedText { get; set; } = string.Empty;
}

/// <summary>
/// Internal hyperlink (cross-reference) to a bookmark.
/// </summary>
public class DocxInternalLink
{
    /// <summary>Target bookmark name</summary>
    public string BookmarkName { get; set; } = string.Empty;

    /// <summary>Display text for the link</summary>
    public string DisplayText { get; set; } = string.Empty;
}

// ========================
// DOCUMENT PROPERTIES DTOs
// ========================

/// <summary>
/// Document properties/metadata from DOCX.
/// </summary>
public class DocxDocumentProperties
{
    // Core properties
    public string? Title { get; set; }
    public string? Subject { get; set; }
    public string? Creator { get; set; }
    public string? Keywords { get; set; }
    public string? Description { get; set; }
    public string? LastModifiedBy { get; set; }
    public DateTime? Created { get; set; }
    public DateTime? Modified { get; set; }
    public string? Category { get; set; }

    // Extended properties
    public string? Company { get; set; }
    public string? Manager { get; set; }
    public int? TotalTime { get; set; } // editing time in minutes
    public int? Pages { get; set; }
    public int? Words { get; set; }
    public int? Characters { get; set; }
    public int? CharactersWithSpaces { get; set; }
    public int? Lines { get; set; }
    public int? Paragraphs { get; set; }
    public string? Application { get; set; } // e.g., "Microsoft Office Word"
    public string? AppVersion { get; set; }
}

// ========================
// WATERMARK DTOs
// ========================

/// <summary>
/// Watermark from DOCX document.
/// </summary>
public class ParsedDocxWatermark
{
    /// <summary>Watermark type: "text" or "image"</summary>
    public string Type { get; set; } = "text";

    /// <summary>Text content (for text watermarks)</summary>
    public string? Text { get; set; }

    /// <summary>Font family for text watermark</summary>
    public string FontFamily { get; set; } = "Calibri";

    /// <summary>Font size for text watermark in points</summary>
    public double FontSize { get; set; } = 120;

    /// <summary>Text color (usually semi-transparent)</summary>
    public string Color { get; set; } = "#C0C0C0";

    /// <summary>Opacity (0-100)</summary>
    public int Opacity { get; set; } = 50;

    /// <summary>Rotation in degrees (diagonal = -45 or 315)</summary>
    public double Rotation { get; set; } = -45;

    /// <summary>Image data (for image watermarks)</summary>
    public byte[]? ImageData { get; set; }

    /// <summary>Image content type</summary>
    public string? ImageContentType { get; set; }

    /// <summary>Scale percentage for image</summary>
    public double Scale { get; set; } = 100;

    /// <summary>Washout/faded effect for images</summary>
    public bool IsWashout { get; set; } = true;
}

// ========================
// DROP CAP DTOs
// ========================

/// <summary>
/// Drop cap (large first letter) from DOCX.
/// </summary>
public class DocxDropCap
{
    /// <summary>Drop cap type: "drop" (in margin) or "margin" (dropped into text)</summary>
    public string Type { get; set; } = "drop";

    /// <summary>Number of lines the drop cap spans</summary>
    public int Lines { get; set; } = 3;

    /// <summary>Distance from following text in mm</summary>
    public double Distance { get; set; } = 0;

    /// <summary>The drop cap character(s)</summary>
    public string Character { get; set; } = string.Empty;

    /// <summary>Font family override</summary>
    public string? FontFamily { get; set; }

    /// <summary>Font size (calculated from lines)</summary>
    public double FontSize { get; set; }
}

// ========================
// PARAGRAPH BORDER DTOs
// ========================

/// <summary>
/// Paragraph border and shading from DOCX.
/// </summary>
public class DocxParagraphBorder
{
    public DocxBorder? Top { get; set; }
    public DocxBorder? Bottom { get; set; }
    public DocxBorder? Left { get; set; }
    public DocxBorder? Right { get; set; }
    public DocxBorder? Between { get; set; } // Border between paragraphs with same style

    /// <summary>Distance between border and text in points</summary>
    public double OffsetTop { get; set; } = 1;
    public double OffsetBottom { get; set; } = 1;
    public double OffsetLeft { get; set; } = 4;
    public double OffsetRight { get; set; } = 4;
}

/// <summary>
/// Paragraph shading/background from DOCX.
/// </summary>
public class DocxParagraphShading
{
    /// <summary>Fill/background color</summary>
    public string? Fill { get; set; }

    /// <summary>Pattern color</summary>
    public string? PatternColor { get; set; }

    /// <summary>Pattern type: "clear", "solid", "horzStripe", "vertStripe", "diagStripe", etc.</summary>
    public string Pattern { get; set; } = "clear";
}

// ========================
// COMMENT DTOs
// ========================

/// <summary>
/// Comment from DOCX document.
/// </summary>
public class ParsedDocxComment
{
    /// <summary>Comment ID</summary>
    public int Id { get; set; }

    /// <summary>Author of the comment</summary>
    public string Author { get; set; } = string.Empty;

    /// <summary>Author initials</summary>
    public string? Initials { get; set; }

    /// <summary>Date/time of the comment</summary>
    public DateTime? Date { get; set; }

    /// <summary>Comment text content</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Paragraph content (if comment has formatting)</summary>
    public List<ParsedDocxParagraph> Content { get; set; } = [];

    /// <summary>The text that was commented on</summary>
    public string CommentedText { get; set; } = string.Empty;

    /// <summary>Parent comment ID (for threaded comments)</summary>
    public int? ParentId { get; set; }

    /// <summary>Is this comment resolved</summary>
    public bool IsResolved { get; set; }
}

// ========================
// FIELD DTOs
// ========================

/// <summary>
/// Field code from DOCX (TOC, page numbers, dates, etc.).
/// </summary>
public class ParsedDocxField
{
    /// <summary>Field type: "TOC", "PAGE", "NUMPAGES", "DATE", "TIME", "REF", "HYPERLINK", etc.</summary>
    public string FieldType { get; set; } = string.Empty;

    /// <summary>Raw field instruction code</summary>
    public string FieldCode { get; set; } = string.Empty;

    /// <summary>Cached/displayed result text</summary>
    public string? ResultText { get; set; }

    /// <summary>Field parameters/switches</summary>
    public Dictionary<string, string> Parameters { get; set; } = new();

    /// <summary>Is this field locked (cannot be updated)</summary>
    public bool IsLocked { get; set; }
}

// ========================
// DRAWING/SHAPE DTOs
// ========================

/// <summary>
/// Drawing/shape from DOCX (lines, arrows, connectors).
/// </summary>
public class ParsedDocxShape : ParsedDocxElement
{
    /// <summary>Shape type: "line", "straightConnector", "arrow", "rectangle", "oval", etc.</summary>
    public string ShapeType { get; set; } = string.Empty;

    /// <summary>Position and dimensions</summary>
    public DocxBoxPosition Position { get; set; } = new();

    /// <summary>Start point (for lines/connectors)</summary>
    public DocxPoint? StartPoint { get; set; }

    /// <summary>End point (for lines/connectors)</summary>
    public DocxPoint? EndPoint { get; set; }

    /// <summary>Line/stroke color</summary>
    public string StrokeColor { get; set; } = "#000000";

    /// <summary>Line/stroke width in points</summary>
    public double StrokeWidth { get; set; } = 0.75;

    /// <summary>Line style: "solid", "dash", "dot", "dashDot", "dashDotDot"</summary>
    public string StrokeStyle { get; set; } = "solid";

    /// <summary>Fill color (null = no fill)</summary>
    public string? FillColor { get; set; }

    /// <summary>Start arrow type: "none", "triangle", "stealth", "diamond", "oval", "open"</summary>
    public string StartArrow { get; set; } = "none";

    /// <summary>End arrow type</summary>
    public string EndArrow { get; set; } = "none";

    /// <summary>Start arrow size: "small", "medium", "large"</summary>
    public string StartArrowSize { get; set; } = "medium";

    /// <summary>End arrow size</summary>
    public string EndArrowSize { get; set; } = "medium";
}

/// <summary>
/// Point coordinates.
/// </summary>
public class DocxPoint
{
    public double X { get; set; }
    public double Y { get; set; }
}

// ========================
// MATH EQUATION DTOs
// ========================

/// <summary>
/// Math equation from DOCX (Office Math Markup Language - OMML).
/// </summary>
public class ParsedDocxEquation : ParsedDocxElement
{
    /// <summary>Unique identifier for the equation</summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>LaTeX representation of the equation</summary>
    public string? LaTeX { get; set; }

    /// <summary>MathML representation</summary>
    public string? MathML { get; set; }

    /// <summary>Plain text fallback representation</summary>
    public string PlainText { get; set; } = string.Empty;

    /// <summary>Raw OMML XML content</summary>
    public string OmmlXml { get; set; } = string.Empty;

    /// <summary>Is this an inline equation or display (block) equation</summary>
    public bool IsInline { get; set; } = true;

    /// <summary>Equation justification: "left", "center", "right"</summary>
    public string Justification { get; set; } = "center";

    /// <summary>Components of the equation (for complex equations)</summary>
    public List<DocxMathComponent> Components { get; set; } = [];
}

/// <summary>
/// Component of a math equation.
/// </summary>
public class DocxMathComponent
{
    /// <summary>Component type: "fraction", "radical", "superscript", "subscript", "integral", "sum", "matrix", "text", "symbol"</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Text content (for text and symbol types)</summary>
    public string? Text { get; set; }

    /// <summary>Nested components (for complex structures)</summary>
    public List<DocxMathComponent> Children { get; set; } = [];

    /// <summary>Numerator (for fractions)</summary>
    public List<DocxMathComponent>? Numerator { get; set; }

    /// <summary>Denominator (for fractions)</summary>
    public List<DocxMathComponent>? Denominator { get; set; }

    /// <summary>Base (for superscript/subscript)</summary>
    public List<DocxMathComponent>? Base { get; set; }

    /// <summary>Exponent/subscript value</summary>
    public List<DocxMathComponent>? Script { get; set; }

    /// <summary>Radicand (for radicals)</summary>
    public List<DocxMathComponent>? Radicand { get; set; }

    /// <summary>Degree (for nth roots)</summary>
    public List<DocxMathComponent>? Degree { get; set; }

    /// <summary>Lower limit (for integrals/sums)</summary>
    public List<DocxMathComponent>? LowerLimit { get; set; }

    /// <summary>Upper limit (for integrals/sums)</summary>
    public List<DocxMathComponent>? UpperLimit { get; set; }

    /// <summary>Matrix rows (for matrices)</summary>
    public List<List<DocxMathComponent>>? MatrixRows { get; set; }
}

// ========================
// CHART DTOs
// ========================

/// <summary>
/// Embedded chart from DOCX.
/// </summary>
public class ParsedDocxChart : ParsedDocxElement
{
    /// <summary>Unique identifier for the chart</summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Chart type: "bar", "column", "line", "pie", "area", "scatter", "combo", "doughnut", "radar"</summary>
    public string ChartType { get; set; } = string.Empty;

    /// <summary>Chart title</summary>
    public string? Title { get; set; }

    /// <summary>Chart width in mm</summary>
    public double Width { get; set; } = 150;

    /// <summary>Chart height in mm</summary>
    public double Height { get; set; } = 100;

    /// <summary>Data series in the chart</summary>
    public List<DocxChartSeries> Series { get; set; } = [];

    /// <summary>Category axis labels</summary>
    public List<string> Categories { get; set; } = [];

    /// <summary>Legend position: "bottom", "top", "left", "right", "none"</summary>
    public string LegendPosition { get; set; } = "bottom";

    /// <summary>Show data labels</summary>
    public bool ShowDataLabels { get; set; }

    /// <summary>Chart styling</summary>
    public DocxChartStyle Style { get; set; } = new();

    /// <summary>Rendered image of the chart (base64)</summary>
    public string? RenderedImage { get; set; }
}

/// <summary>
/// Data series in a chart.
/// </summary>
public class DocxChartSeries
{
    /// <summary>Series name/label</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Data values</summary>
    public List<double> Values { get; set; } = [];

    /// <summary>Series color</summary>
    public string? Color { get; set; }

    /// <summary>Series type for combo charts</summary>
    public string? SeriesType { get; set; }
}

/// <summary>
/// Chart styling options.
/// </summary>
public class DocxChartStyle
{
    /// <summary>Background color</summary>
    public string? BackgroundColor { get; set; }

    /// <summary>Border color</summary>
    public string? BorderColor { get; set; }

    /// <summary>Show gridlines</summary>
    public bool ShowGridlines { get; set; } = true;

    /// <summary>3D chart effect</summary>
    public bool Is3D { get; set; }

    /// <summary>Color scheme/palette</summary>
    public List<string> ColorPalette { get; set; } = [];
}

// ========================
// SMARTART/DIAGRAM DTOs
// ========================

/// <summary>
/// SmartArt diagram from DOCX.
/// </summary>
public class ParsedDocxSmartArt : ParsedDocxElement
{
    /// <summary>Unique identifier</summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Diagram type: "list", "process", "cycle", "hierarchy", "relationship", "matrix", "pyramid"</summary>
    public string DiagramType { get; set; } = string.Empty;

    /// <summary>Diagram layout name</summary>
    public string? LayoutName { get; set; }

    /// <summary>Width in mm</summary>
    public double Width { get; set; } = 150;

    /// <summary>Height in mm</summary>
    public double Height { get; set; } = 100;

    /// <summary>Nodes in the diagram</summary>
    public List<DocxSmartArtNode> Nodes { get; set; } = [];

    /// <summary>Styling options</summary>
    public DocxSmartArtStyle Style { get; set; } = new();

    /// <summary>Rendered image of the SmartArt (base64)</summary>
    public string? RenderedImage { get; set; }
}

/// <summary>
/// Node in a SmartArt diagram.
/// </summary>
public class DocxSmartArtNode
{
    /// <summary>Node text content</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Node level (for hierarchies)</summary>
    public int Level { get; set; }

    /// <summary>Child nodes</summary>
    public List<DocxSmartArtNode> Children { get; set; } = [];

    /// <summary>Node color override</summary>
    public string? Color { get; set; }
}

/// <summary>
/// SmartArt styling options.
/// </summary>
public class DocxSmartArtStyle
{
    /// <summary>Color scheme name</summary>
    public string? ColorScheme { get; set; }

    /// <summary>Primary color</summary>
    public string? PrimaryColor { get; set; }

    /// <summary>Accent colors</summary>
    public List<string> AccentColors { get; set; } = [];

    /// <summary>3D effect</summary>
    public bool Is3D { get; set; }
}

// ========================
// FORM FIELD DTOs
// ========================

/// <summary>
/// Form field from DOCX (legacy form fields).
/// </summary>
public class ParsedDocxFormField : ParsedDocxElement
{
    /// <summary>Field name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Field type: "text", "checkbox", "dropdown"</summary>
    public string FieldType { get; set; } = string.Empty;

    /// <summary>Current value</summary>
    public string? Value { get; set; }

    /// <summary>Default value</summary>
    public string? DefaultValue { get; set; }

    /// <summary>Is checked (for checkboxes)</summary>
    public bool IsChecked { get; set; }

    /// <summary>Dropdown options</summary>
    public List<string> Options { get; set; } = [];

    /// <summary>Selected index (for dropdowns)</summary>
    public int SelectedIndex { get; set; }

    /// <summary>Max length (for text fields)</summary>
    public int? MaxLength { get; set; }

    /// <summary>Help text shown on F1</summary>
    public string? HelpText { get; set; }

    /// <summary>Status bar text</summary>
    public string? StatusText { get; set; }

    /// <summary>Is field enabled</summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>Calculate on exit</summary>
    public bool CalculateOnExit { get; set; }

    /// <summary>Entry/exit macros</summary>
    public string? EntryMacro { get; set; }
    public string? ExitMacro { get; set; }

    /// <summary>Bookmark name</summary>
    public string? BookmarkName { get; set; }
}

// ========================
// CONTENT CONTROL DTOs
// ========================

/// <summary>
/// Structured Document Tag (Content Control) from DOCX.
/// </summary>
public class ParsedDocxContentControl : ParsedDocxElement
{
    /// <summary>Unique ID</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Control tag (user-defined identifier)</summary>
    public string? Tag { get; set; }

    /// <summary>Control type: "richText", "plainText", "picture", "dropdownList", "comboBox", "date", "checkbox", "group", "repeatingSection"</summary>
    public string ControlType { get; set; } = string.Empty;

    /// <summary>Title/label for the control</summary>
    public string? Title { get; set; }

    /// <summary>Placeholder text</summary>
    public string? Placeholder { get; set; }

    /// <summary>Current text content</summary>
    public string? TextContent { get; set; }

    /// <summary>Is content control locked (cannot be deleted)</summary>
    public bool IsLocked { get; set; }

    /// <summary>Is content editable</summary>
    public bool IsEditable { get; set; } = true;

    /// <summary>Show as bounding box</summary>
    public bool ShowBoundingBox { get; set; }

    /// <summary>Dropdown/combobox items</summary>
    public List<DocxListItem> Items { get; set; } = [];

    /// <summary>Selected item value</summary>
    public string? SelectedValue { get; set; }

    /// <summary>Date format (for date controls)</summary>
    public string? DateFormat { get; set; }

    /// <summary>Date value (for date controls)</summary>
    public DateTime? DateValue { get; set; }

    /// <summary>Is checkbox checked</summary>
    public bool? IsChecked { get; set; }

    /// <summary>Checked symbol</summary>
    public string CheckedSymbol { get; set; } = "☑";

    /// <summary>Unchecked symbol</summary>
    public string UncheckedSymbol { get; set; } = "☐";

    /// <summary>Picture content (base64, for picture controls)</summary>
    public string? PictureContent { get; set; }

    /// <summary>Nested content controls (for groups/sections)</summary>
    public List<ParsedDocxContentControl> Children { get; set; } = [];

    /// <summary>Content paragraphs inside the control</summary>
    public List<ParsedDocxParagraph> Content { get; set; } = [];

    /// <summary>Data binding XPath</summary>
    public string? DataBinding { get; set; }

    /// <summary>Color for bounding box</summary>
    public string? Color { get; set; }
}

/// <summary>
/// List item for dropdown/combobox content controls.
/// </summary>
public class DocxListItem
{
    /// <summary>Display text</summary>
    public string DisplayText { get; set; } = string.Empty;

    /// <summary>Value</summary>
    public string Value { get; set; } = string.Empty;
}

// ========================
// TRACKED CHANGES DTOs
// ========================

/// <summary>
/// Revision/tracked change from DOCX.
/// </summary>
public class ParsedDocxRevision
{
    /// <summary>Revision ID</summary>
    public int Id { get; set; }

    /// <summary>Revision type: "insert", "delete", "moveFrom", "moveTo", "formatChange", "propertyChange"</summary>
    public string RevisionType { get; set; } = string.Empty;

    /// <summary>Author of the change</summary>
    public string Author { get; set; } = string.Empty;

    /// <summary>Date/time of the change</summary>
    public DateTime? Date { get; set; }

    /// <summary>Affected text content</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Affected elements</summary>
    public List<ParsedDocxElement> AffectedElements { get; set; } = [];

    /// <summary>Previous formatting (for format changes)</summary>
    public DocxTextStyle? PreviousStyle { get; set; }

    /// <summary>New formatting (for format changes)</summary>
    public DocxTextStyle? NewStyle { get; set; }

    /// <summary>Move destination ID (for move revisions)</summary>
    public int? MoveDestinationId { get; set; }
}

/// <summary>
/// Document revision settings.
/// </summary>
public class DocxRevisionSettings
{
    /// <summary>Track revisions enabled</summary>
    public bool TrackRevisions { get; set; }

    /// <summary>Show insertions</summary>
    public bool ShowInsertions { get; set; } = true;

    /// <summary>Show deletions</summary>
    public bool ShowDeletions { get; set; } = true;

    /// <summary>Show formatting changes</summary>
    public bool ShowFormatting { get; set; } = true;

    /// <summary>Show in balloons</summary>
    public bool ShowInBalloons { get; set; }

    /// <summary>Insertion color</summary>
    public string InsertionColor { get; set; } = "#0000FF";

    /// <summary>Deletion color</summary>
    public string DeletionColor { get; set; } = "#FF0000";

    /// <summary>Authors and their colors</summary>
    public Dictionary<string, string> AuthorColors { get; set; } = new();
}

// ========================
// DOCUMENT THEME DTOs
// ========================

/// <summary>
/// Document theme from DOCX.
/// </summary>
public class ParsedDocxTheme
{
    /// <summary>Theme name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Color scheme</summary>
    public DocxColorScheme ColorScheme { get; set; } = new();

    /// <summary>Font scheme</summary>
    public DocxFontScheme FontScheme { get; set; } = new();

    /// <summary>Format scheme (effects)</summary>
    public DocxFormatScheme FormatScheme { get; set; } = new();
}

/// <summary>
/// Color scheme from document theme.
/// </summary>
public class DocxColorScheme
{
    /// <summary>Scheme name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Dark 1 color (usually black)</summary>
    public string Dark1 { get; set; } = "#000000";

    /// <summary>Light 1 color (usually white)</summary>
    public string Light1 { get; set; } = "#FFFFFF";

    /// <summary>Dark 2 color</summary>
    public string Dark2 { get; set; } = "#1F497D";

    /// <summary>Light 2 color</summary>
    public string Light2 { get; set; } = "#EEECE1";

    /// <summary>Accent 1 color</summary>
    public string Accent1 { get; set; } = "#4F81BD";

    /// <summary>Accent 2 color</summary>
    public string Accent2 { get; set; } = "#C0504D";

    /// <summary>Accent 3 color</summary>
    public string Accent3 { get; set; } = "#9BBB59";

    /// <summary>Accent 4 color</summary>
    public string Accent4 { get; set; } = "#8064A2";

    /// <summary>Accent 5 color</summary>
    public string Accent5 { get; set; } = "#4BACC6";

    /// <summary>Accent 6 color</summary>
    public string Accent6 { get; set; } = "#F79646";

    /// <summary>Hyperlink color</summary>
    public string Hyperlink { get; set; } = "#0000FF";

    /// <summary>Followed hyperlink color</summary>
    public string FollowedHyperlink { get; set; } = "#800080";
}

/// <summary>
/// Font scheme from document theme.
/// </summary>
public class DocxFontScheme
{
    /// <summary>Scheme name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Major (heading) font - Latin</summary>
    public string MajorLatin { get; set; } = "Calibri Light";

    /// <summary>Major (heading) font - East Asian</summary>
    public string? MajorEastAsian { get; set; }

    /// <summary>Major (heading) font - Complex Script</summary>
    public string? MajorComplexScript { get; set; }

    /// <summary>Minor (body) font - Latin</summary>
    public string MinorLatin { get; set; } = "Calibri";

    /// <summary>Minor (body) font - East Asian</summary>
    public string? MinorEastAsian { get; set; }

    /// <summary>Minor (body) font - Complex Script</summary>
    public string? MinorComplexScript { get; set; }
}

/// <summary>
/// Format scheme (effects) from document theme.
/// </summary>
public class DocxFormatScheme
{
    /// <summary>Scheme name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Fill styles (for backgrounds)</summary>
    public List<DocxFillStyle> FillStyles { get; set; } = [];

    /// <summary>Line styles (for borders)</summary>
    public List<DocxLineStyle> LineStyles { get; set; } = [];

    /// <summary>Effect styles (shadows, glows, etc.)</summary>
    public List<DocxEffectStyle> EffectStyles { get; set; } = [];
}

/// <summary>
/// Fill style from format scheme.
/// </summary>
public class DocxFillStyle
{
    /// <summary>Fill type: "solid", "gradient", "pattern"</summary>
    public string Type { get; set; } = "solid";

    /// <summary>Fill color</summary>
    public string? Color { get; set; }

    /// <summary>Gradient stops (for gradient fills)</summary>
    public List<DocxGradientStop> GradientStops { get; set; } = [];

    /// <summary>Gradient angle (for linear gradients)</summary>
    public double GradientAngle { get; set; }
}

/// <summary>
/// Gradient stop.
/// </summary>
public class DocxGradientStop
{
    /// <summary>Position (0-100)</summary>
    public double Position { get; set; }

    /// <summary>Color at this position</summary>
    public string Color { get; set; } = string.Empty;
}

/// <summary>
/// Line style from format scheme.
/// </summary>
public class DocxLineStyle
{
    /// <summary>Line width in points</summary>
    public double Width { get; set; } = 1;

    /// <summary>Line color</summary>
    public string? Color { get; set; }

    /// <summary>Dash pattern</summary>
    public string DashPattern { get; set; } = "solid";

    /// <summary>Cap type: "flat", "square", "round"</summary>
    public string CapType { get; set; } = "flat";

    /// <summary>Join type: "bevel", "miter", "round"</summary>
    public string JoinType { get; set; } = "bevel";
}

/// <summary>
/// Effect style from format scheme.
/// </summary>
public class DocxEffectStyle
{
    /// <summary>Shadow effect</summary>
    public DocxShadowEffect? Shadow { get; set; }

    /// <summary>Glow effect</summary>
    public DocxGlowEffect? Glow { get; set; }

    /// <summary>Soft edge effect radius</summary>
    public double? SoftEdgeRadius { get; set; }

    /// <summary>Reflection effect</summary>
    public DocxReflectionEffect? Reflection { get; set; }
}

/// <summary>
/// Glow effect.
/// </summary>
public class DocxGlowEffect
{
    /// <summary>Glow color</summary>
    public string Color { get; set; } = "#000000";

    /// <summary>Glow radius in points</summary>
    public double Radius { get; set; }

    /// <summary>Opacity (0-100)</summary>
    public int Opacity { get; set; } = 50;
}

/// <summary>
/// Reflection effect.
/// </summary>
public class DocxReflectionEffect
{
    /// <summary>Blur radius</summary>
    public double BlurRadius { get; set; }

    /// <summary>Start opacity (0-100)</summary>
    public int StartOpacity { get; set; } = 50;

    /// <summary>End opacity (0-100)</summary>
    public int EndOpacity { get; set; }

    /// <summary>Distance from object</summary>
    public double Distance { get; set; }

    /// <summary>Direction angle</summary>
    public double Direction { get; set; }
}

// ========================
// DOCUMENT STYLE DTOs
// ========================

/// <summary>
/// Named style from DOCX.
/// </summary>
public class ParsedDocxStyle
{
    /// <summary>Style ID (internal identifier)</summary>
    public string StyleId { get; set; } = string.Empty;

    /// <summary>Style name (display name)</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Style type: "paragraph", "character", "table", "numbering"</summary>
    public string StyleType { get; set; } = string.Empty;

    /// <summary>Based on style ID</summary>
    public string? BasedOn { get; set; }

    /// <summary>Next paragraph style ID</summary>
    public string? NextStyle { get; set; }

    /// <summary>Is this a default style</summary>
    public bool IsDefault { get; set; }

    /// <summary>Is this a built-in style</summary>
    public bool IsBuiltIn { get; set; }

    /// <summary>Style is hidden from UI</summary>
    public bool IsHidden { get; set; }

    /// <summary>Priority for sorting in UI</summary>
    public int? Priority { get; set; }

    /// <summary>Quick format (appears in gallery)</summary>
    public bool QuickFormat { get; set; }

    /// <summary>Paragraph properties</summary>
    public DocxParagraphStyle? ParagraphStyle { get; set; }

    /// <summary>Text/run properties</summary>
    public DocxTextStyle? TextStyle { get; set; }

    /// <summary>Table properties</summary>
    public DocxTableStyle? TableStyle { get; set; }
}

// ========================
// TABLE OF CONTENTS DTOs
// ========================

/// <summary>
/// Table of contents from DOCX.
/// </summary>
public class ParsedDocxTableOfContents : ParsedDocxElement
{
    /// <summary>TOC entries</summary>
    public List<DocxTocEntry> Entries { get; set; } = [];

    /// <summary>Include heading levels 1-N</summary>
    public int HeadingLevels { get; set; } = 3;

    /// <summary>Include TOC style entries</summary>
    public bool IncludeTocStyles { get; set; } = true;

    /// <summary>Include outline level entries</summary>
    public bool IncludeOutlineLevels { get; set; } = true;

    /// <summary>Show page numbers</summary>
    public bool ShowPageNumbers { get; set; } = true;

    /// <summary>Right-align page numbers</summary>
    public bool RightAlignPageNumbers { get; set; } = true;

    /// <summary>Tab leader: "dot", "dash", "underscore", "none"</summary>
    public string TabLeader { get; set; } = "dot";

    /// <summary>Use hyperlinks</summary>
    public bool UseHyperlinks { get; set; } = true;

    /// <summary>Title text</summary>
    public string? Title { get; set; }
}

/// <summary>
/// Entry in a table of contents.
/// </summary>
public class DocxTocEntry
{
    /// <summary>Entry text</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Heading level (1-9)</summary>
    public int Level { get; set; } = 1;

    /// <summary>Page number</summary>
    public int? PageNumber { get; set; }

    /// <summary>Bookmark/anchor link</summary>
    public string? BookmarkRef { get; set; }
}

// ========================
// BIBLIOGRAPHY DTOs
// ========================

/// <summary>
/// Bibliography from DOCX.
/// </summary>
public class ParsedDocxBibliography : ParsedDocxElement
{
    /// <summary>Bibliography entries/sources</summary>
    public List<DocxBibliographySource> Sources { get; set; } = [];

    /// <summary>Bibliography style: "APA", "Chicago", "MLA", "IEEE", etc.</summary>
    public string Style { get; set; } = "APA";

    /// <summary>Title text</summary>
    public string? Title { get; set; }
}

/// <summary>
/// Bibliography source/entry.
/// </summary>
public class DocxBibliographySource
{
    /// <summary>Unique source tag</summary>
    public string Tag { get; set; } = string.Empty;

    /// <summary>Source type: "book", "article", "journalArticle", "website", "report", "thesis", etc.</summary>
    public string SourceType { get; set; } = string.Empty;

    /// <summary>Source title</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Authors</summary>
    public List<DocxPerson> Authors { get; set; } = [];

    /// <summary>Editors</summary>
    public List<DocxPerson> Editors { get; set; } = [];

    /// <summary>Translators</summary>
    public List<DocxPerson> Translators { get; set; } = [];

    /// <summary>Year of publication</summary>
    public string? Year { get; set; }

    /// <summary>Month of publication</summary>
    public string? Month { get; set; }

    /// <summary>Day of publication</summary>
    public string? Day { get; set; }

    /// <summary>Publisher name</summary>
    public string? Publisher { get; set; }

    /// <summary>City of publication</summary>
    public string? City { get; set; }

    /// <summary>State/province</summary>
    public string? StateProvince { get; set; }

    /// <summary>Country/region</summary>
    public string? CountryRegion { get; set; }

    /// <summary>Journal/periodical name</summary>
    public string? JournalName { get; set; }

    /// <summary>Volume number</summary>
    public string? Volume { get; set; }

    /// <summary>Issue number</summary>
    public string? Issue { get; set; }

    /// <summary>Page range</summary>
    public string? Pages { get; set; }

    /// <summary>Edition</summary>
    public string? Edition { get; set; }

    /// <summary>URL</summary>
    public string? Url { get; set; }

    /// <summary>Date accessed (for websites)</summary>
    public string? DateAccessed { get; set; }

    /// <summary>DOI</summary>
    public string? Doi { get; set; }

    /// <summary>ISBN</summary>
    public string? Isbn { get; set; }

    /// <summary>ISSN</summary>
    public string? Issn { get; set; }

    /// <summary>Abstract</summary>
    public string? Abstract { get; set; }

    /// <summary>Comments</summary>
    public string? Comments { get; set; }

    /// <summary>Short title</summary>
    public string? ShortTitle { get; set; }

    /// <summary>Standard number</summary>
    public string? StandardNumber { get; set; }
}

/// <summary>
/// Person (author/editor/translator).
/// </summary>
public class DocxPerson
{
    /// <summary>First name</summary>
    public string? First { get; set; }

    /// <summary>Middle name</summary>
    public string? Middle { get; set; }

    /// <summary>Last name</summary>
    public string? Last { get; set; }

    /// <summary>Corporate author name (if organization)</summary>
    public string? Corporate { get; set; }
}

/// <summary>
/// Citation reference in the document.
/// </summary>
public class DocxCitation
{
    /// <summary>Source tag reference</summary>
    public string SourceTag { get; set; } = string.Empty;

    /// <summary>Page number(s) cited</summary>
    public string? Pages { get; set; }

    /// <summary>Prefix text</summary>
    public string? Prefix { get; set; }

    /// <summary>Suffix text</summary>
    public string? Suffix { get; set; }

    /// <summary>Suppress author name</summary>
    public bool SuppressAuthor { get; set; }

    /// <summary>Suppress year</summary>
    public bool SuppressYear { get; set; }
}

// ========================
// CUSTOM XML DTOs
// ========================

/// <summary>
/// Custom XML data from DOCX.
/// </summary>
public class DocxCustomXmlData
{
    /// <summary>Custom XML part ID</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>XML namespace URI</summary>
    public string? Namespace { get; set; }

    /// <summary>Root element name</summary>
    public string? RootElement { get; set; }

    /// <summary>Raw XML content</summary>
    public string XmlContent { get; set; } = string.Empty;

    /// <summary>Parsed key-value pairs (for simple structures)</summary>
    public Dictionary<string, string> Data { get; set; } = new();
}

// ========================
// EMBEDDED OBJECT DTOs
// ========================

/// <summary>
/// Embedded object (OLE) from DOCX.
/// </summary>
public class ParsedDocxEmbeddedObject : ParsedDocxElement
{
    /// <summary>Object type: "excel", "word", "powerpoint", "pdf", "package", etc.</summary>
    public string ObjectType { get; set; } = string.Empty;

    /// <summary>Program ID (e.g., "Excel.Sheet.12")</summary>
    public string? ProgId { get; set; }

    /// <summary>Display name</summary>
    public string? Name { get; set; }

    /// <summary>Object icon representation (base64)</summary>
    public string? IconImage { get; set; }

    /// <summary>Object preview image (base64)</summary>
    public string? PreviewImage { get; set; }

    /// <summary>Binary content (base64)</summary>
    public string? BinaryContent { get; set; }

    /// <summary>Width in mm</summary>
    public double Width { get; set; }

    /// <summary>Height in mm</summary>
    public double Height { get; set; }

    /// <summary>Display as icon</summary>
    public bool DisplayAsIcon { get; set; }
}
