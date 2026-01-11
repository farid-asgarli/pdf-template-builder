using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders text field (input) components with full styling support.
/// Implements proper QuestPDF patterns for borders, rounded corners, and backgrounds.
/// </summary>
/// <remarks>
/// Key implementation notes based on QuestPDF documentation:
/// - CornerRadius must be applied BEFORE Border for proper rendering
/// - BorderAlignmentInside is automatically applied when using rounded corners
/// - Use Unit.Millimetre for consistent sizing across the document
/// - Padding values are in points by default
/// </remarks>
public static class TextFieldRenderer
{
    /// <summary>
    /// Configuration record for text field styling.
    /// All measurements use consistent units: millimetres for sizes, points for padding.
    /// </summary>
    private record TextFieldConfig(
        // Field identification
        string Label,
        string FieldName,
        string Placeholder,
        bool Required,
        // Label styling
        float LabelFontSize,
        string LabelColor,
        string LabelFontWeight,
        string LabelFontFamily,
        // Input styling
        float FontSize,
        string FontFamily,
        float InputHeight,
        float InputPaddingVertical,
        float InputPaddingHorizontal,
        // Border styling
        float BorderWidth,
        string BorderColor,
        float BorderRadius,
        // Colors
        string? BackgroundColor,
        string PlaceholderColor,
        // Layout
        float LabelSpacing,
        bool FullWidth
    );

    public static void Render(IContainer container, Dictionary<string, JsonElement> properties)
    {
        var config = ExtractTextFieldConfig(properties);
        RenderTextField(container, config);
    }

    /// <summary>
    /// Render a text field component with variable substitution.
    /// Variables in label and placeholder are substituted.
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables
    )
    {
        RenderWithVariables(container, properties, pageNumber, totalPages, variables, null);
    }

    /// <summary>
    /// Render a text field with full variable substitution support.
    /// </summary>
    public static void RenderWithVariables(
        IContainer container,
        Dictionary<string, JsonElement> properties,
        int pageNumber,
        int totalPages,
        Dictionary<string, string> variables,
        Dictionary<string, JsonElement>? complexVariables
    )
    {
        var config = ExtractTextFieldConfig(properties);

        // Substitute variables in text content using the full template engine
        var configWithVars = config with
        {
            Label = TextHelpers.SubstituteVariables(
                config.Label,
                pageNumber,
                totalPages,
                variables,
                complexVariables
            ),
            Placeholder = TextHelpers.SubstituteVariables(
                config.Placeholder,
                pageNumber,
                totalPages,
                variables,
                complexVariables
            ),
        };

        RenderTextField(container, configWithVars);
    }

    /// <summary>
    /// Extract all text field configuration from properties dictionary.
    /// </summary>
    private static TextFieldConfig ExtractTextFieldConfig(
        Dictionary<string, JsonElement> properties
    )
    {
        // Support legacy inputPadding property for backwards compatibility
        var legacyPadding = PropertyHelpers.GetFloat(properties, "inputPadding", -1);
        var defaultPaddingV = legacyPadding >= 0 ? legacyPadding : 4;
        var defaultPaddingH = legacyPadding >= 0 ? legacyPadding : 6;

        return new TextFieldConfig(
            Label: PropertyHelpers.GetString(properties, "label", "Field Label"),
            FieldName: PropertyHelpers.GetString(properties, "fieldName", "field_name"),
            Placeholder: PropertyHelpers.GetString(properties, "placeholder", ""),
            Required: PropertyHelpers.GetBool(properties, "required", false),
            // Label styling
            LabelFontSize: PropertyHelpers.GetFloat(properties, "labelFontSize", 10),
            LabelColor: PropertyHelpers.GetString(properties, "labelColor", "#666666"),
            LabelFontWeight: PropertyHelpers.GetString(properties, "labelFontWeight", "normal"),
            LabelFontFamily: PropertyHelpers.GetString(properties, "labelFontFamily", ""),
            // Input styling
            FontSize: PropertyHelpers.GetFloat(properties, "fontSize", 12),
            FontFamily: PropertyHelpers.GetString(properties, "fontFamily", ""),
            InputHeight: PropertyHelpers.GetFloat(properties, "inputHeight", 8),
            InputPaddingVertical: PropertyHelpers.GetFloat(
                properties,
                "inputPaddingVertical",
                defaultPaddingV
            ),
            InputPaddingHorizontal: PropertyHelpers.GetFloat(
                properties,
                "inputPaddingHorizontal",
                defaultPaddingH
            ),
            // Border styling
            BorderWidth: PropertyHelpers.GetFloat(properties, "borderWidth", 1),
            BorderColor: PropertyHelpers.GetString(properties, "borderColor", "#000000"),
            BorderRadius: PropertyHelpers.GetFloat(properties, "borderRadius", 0),
            // Colors
            BackgroundColor: PropertyHelpers.GetString(properties, "backgroundColor", null!),
            PlaceholderColor: PropertyHelpers.GetString(properties, "placeholderColor", "#999999"),
            // Layout
            LabelSpacing: PropertyHelpers.GetFloat(properties, "labelSpacing", 2),
            FullWidth: PropertyHelpers.GetBool(properties, "fullWidth", true)
        );
    }

    /// <summary>
    /// Render the text field with the given configuration.
    /// </summary>
    private static void RenderTextField(IContainer container, TextFieldConfig config)
    {
        container.Column(column =>
        {
            // Spacing between label and input
            column.Spacing(config.LabelSpacing);

            // Label row with optional required indicator
            RenderLabel(column, config);

            // Input box
            RenderInputBox(column, config);
        });
    }

    /// <summary>
    /// Renders the label row with optional required indicator.
    /// </summary>
    private static void RenderLabel(ColumnDescriptor column, TextFieldConfig config)
    {
        column
            .Item()
            .Row(labelRow =>
            {
                labelRow
                    .AutoItem()
                    .Text(text =>
                    {
                        var span = text.Span(config.Label)
                            .FontSize(config.LabelFontSize)
                            .FontColor(config.LabelColor)
                            .ApplyFontWeight(config.LabelFontWeight)
                            .ApplyFontFamily(config.LabelFontFamily);
                    });

                if (config.Required)
                {
                    labelRow
                        .AutoItem()
                        .PaddingLeft(2)
                        .Text(text =>
                        {
                            text.Span("*")
                                .FontSize(config.LabelFontSize)
                                .FontColor(Colors.Red.Medium);
                        });
                }
            });
    }

    /// <summary>
    /// Renders the input box with border, background, and placeholder.
    /// Follows QuestPDF best practices for element composition.
    /// </summary>
    private static void RenderInputBox(ColumnDescriptor column, TextFieldConfig config)
    {
        column
            .Item()
            .Element(inputContainer =>
            {
                // Start building the container with proper order:
                // 1. CornerRadius (must come first for rounded corners)
                // 2. Border (includes border color)
                // 3. Background
                // 4. Padding
                // 5. Content

                IContainer box = inputContainer;

                // Apply corner radius first (required before border for proper rendering)
                if (config.BorderRadius > 0)
                {
                    box = box.CornerRadius(config.BorderRadius);
                }

                // Apply border - use the combined Border overload for cleaner code
                if (config.BorderWidth > 0)
                {
                    box = box.Border(config.BorderWidth, config.BorderColor);
                }

                // Apply background color
                if (!string.IsNullOrEmpty(config.BackgroundColor))
                {
                    box = box.Background(config.BackgroundColor);
                }

                // Apply height constraint in millimetres for consistency
                box = box.MinHeight(config.InputHeight, Unit.Millimetre);

                // Apply padding (vertical and horizontal separately for more control)
                box = box.PaddingVertical(config.InputPaddingVertical)
                    .PaddingHorizontal(config.InputPaddingHorizontal);

                // Render the placeholder content with vertical centering
                RenderPlaceholder(box, config);
            });
    }

    /// <summary>
    /// Renders the placeholder text inside the input box.
    /// </summary>
    private static void RenderPlaceholder(IContainer container, TextFieldConfig config)
    {
        // Use AlignMiddle for vertical centering within the input box
        container
            .AlignMiddle()
            .Text(text =>
            {
                // Use a non-breaking space if no placeholder to maintain height
                var displayText = !string.IsNullOrEmpty(config.Placeholder)
                    ? config.Placeholder
                    : "\u00A0"; // Non-breaking space

                var span = text.Span(displayText)
                    .FontSize(config.FontSize)
                    .FontColor(config.PlaceholderColor)
                    .ApplyFontFamily(config.FontFamily);
            });
    }
}
