namespace PdfBuilder.Api.Services.DocxImport;

/// <summary>
/// Constants used for converting DOCX measurements to standard units and default values.
/// All partial classes of DocxImportService should reference these constants.
/// </summary>
public static class DocxConversionConstants
{
    #region Unit Conversion Constants

    /// <summary>Twips per millimeter (1 inch = 1440 twips, 1 inch = 25.4 mm)</summary>
    public const double TwipsPerMm = 56.6929;

    /// <summary>EMUs (English Metric Units) per millimeter</summary>
    public const double EmuPerMm = 36000.0;

    /// <summary>Half-points per point (font sizes in OOXML are stored in half-points)</summary>
    public const double HalfPointsPerPoint = 2.0;

    /// <summary>Eighths of a point per point (border widths are stored in eighths)</summary>
    public const double EighthsPerPoint = 8.0;

    /// <summary>Twips per point</summary>
    public const double TwipsPerPoint = 20.0;

    /// <summary>Twentieths of a point per point (same as twips per point)</summary>
    public const double TwentiethsPerPoint = 20.0;

    /// <summary>Points per millimeter (for converting font sizes)</summary>
    public const double PointsPerMm = 2.8346456693;

    /// <summary>Millimeters per point (inverse of PointsPerMm)</summary>
    public const double MmPerPoint = 0.3527777778;

    /// <summary>Line spacing units - line spacing values are in 240ths of a line</summary>
    public const double LineSpacingUnits = 240.0;

    #endregion

    #region Page Sizes (in mm)

    public const double A4WidthMm = 210;
    public const double A4HeightMm = 297;
    public const double A3WidthMm = 297;
    public const double A3HeightMm = 420;
    public const double LetterWidthMm = 215.9;
    public const double LetterHeightMm = 279.4;
    public const double LegalWidthMm = 215.9;
    public const double LegalHeightMm = 355.6;

    /// <summary>Tolerance for page size comparison (in mm)</summary>
    public const double PageSizeTolerance = 2.0;

    #endregion

    #region Default Colors

    public const string DefaultBlack = "#000000";
    public const string DefaultWhite = "#FFFFFF";
    public const string HyperlinkBlue = "#0563C1";
    public const string DefaultBorderColor = "#000000";

    #endregion

    #region Default Typography

    /// <summary>Default font family when mapping unknown fonts</summary>
    public const string DefaultFontFamily = "Inter";

    /// <summary>Default font size in points</summary>
    public const double DefaultFontSize = 11.0;

    /// <summary>Default line spacing multiplier</summary>
    public const double DefaultLineSpacing = 1.15;

    /// <summary>Default space after paragraph in points</summary>
    public const double DefaultSpaceAfterPoints = 8.0;

    #endregion

    #region Default Spacing and Layout

    /// <summary>Default spacing between elements in mm</summary>
    public const double DefaultElementSpacingMm = 2.0;

    /// <summary>Default table row spacing in mm</summary>
    public const double DefaultTableSpacingMm = 4.0;

    /// <summary>Default image spacing in mm</summary>
    public const double DefaultImageSpacingMm = 4.0;

    /// <summary>Default list indent per level in mm (0.25 inch)</summary>
    public const double DefaultListIndentMm = 6.35;

    /// <summary>Default border width in points</summary>
    public const double DefaultBorderWidthPt = 0.5;

    #endregion

    #region Image Constants

    /// <summary>
    /// Image position type constants for consistent values across the codebase.
    /// </summary>
    public static class ImagePositionType
    {
        public const string Inline = "inline";
        public const string Anchor = "anchor";
    }

    /// <summary>
    /// Image wrap style constants matching Word's text wrapping options.
    /// </summary>
    public static class ImageWrapStyle
    {
        /// <summary>Image flows with text (inline)</summary>
        public const string Inline = "inline";

        /// <summary>Text wraps in a square around the image</summary>
        public const string Square = "square";

        /// <summary>Text wraps tightly around the image shape</summary>
        public const string Tight = "tight";

        /// <summary>Text wraps through transparent areas</summary>
        public const string Through = "through";

        /// <summary>Text appears above and below the image only</summary>
        public const string TopAndBottom = "topAndBottom";

        /// <summary>Image appears behind text</summary>
        public const string Behind = "behind";

        /// <summary>Image appears in front of text (no wrap)</summary>
        public const string InFront = "inFront";
    }

    #endregion

    #region Heading Font Sizes

    /// <summary>Get heading font size based on heading level (1-6)</summary>
    public static double GetHeadingFontSize(int level) =>
        level switch
        {
            0 => 26, // Title
            1 => 24,
            2 => 20,
            3 => 16,
            4 => 14,
            5 => 12,
            6 => 11,
            _ => DefaultFontSize,
        };

    #endregion
}
