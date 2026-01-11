using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services.Renderers;

/// <summary>
/// Renders placeholder elements using QuestPDF's built-in Placeholder API.
/// Used for:
/// - Unknown component types (fallback rendering)
/// - Missing/error states (e.g., image not found)
/// - Development/prototyping visualization
/// </summary>
public static class PlaceholderRenderer
{
    /// <summary>
    /// Renders a placeholder with a text label.
    /// Uses QuestPDF's built-in Placeholder element for consistent styling.
    /// </summary>
    /// <param name="container">The container to render into.</param>
    /// <param name="label">The label to display (e.g., component type or error message).</param>
    public static void Render(IContainer container, string label)
    {
        // Use QuestPDF's built-in Placeholder with label text
        container.Placeholder(label);
    }

    /// <summary>
    /// Renders a placeholder without a label (shows default icon).
    /// Useful for empty content areas or generic placeholders.
    /// </summary>
    /// <param name="container">The container to render into.</param>
    public static void Render(IContainer container)
    {
        container.Placeholder();
    }

    /// <summary>
    /// Renders a styled error placeholder with custom appearance.
    /// Used for error states where the default placeholder style may not be appropriate.
    /// </summary>
    /// <param name="container">The container to render into.</param>
    /// <param name="errorMessage">The error message to display.</param>
    public static void RenderError(IContainer container, string errorMessage)
    {
        container
            .Border(1)
            .BorderColor(Colors.Red.Medium)
            .Background(Colors.Red.Lighten5)
            .Padding(4)
            .AlignCenter()
            .AlignMiddle()
            .Text(text =>
            {
                text.AlignCenter();
                text.Span("⚠ ").FontSize(10).FontColor(Colors.Red.Darken1);
                text.Span(TruncateMessage(errorMessage, 100))
                    .FontSize(9)
                    .FontColor(Colors.Red.Darken2);
            });
    }

    /// <summary>
    /// Renders a warning placeholder with custom appearance.
    /// Used for missing content that isn't necessarily an error (e.g., optional image not provided).
    /// </summary>
    /// <param name="container">The container to render into.</param>
    /// <param name="warningMessage">The warning message to display.</param>
    public static void RenderWarning(IContainer container, string warningMessage)
    {
        container
            .Border(1)
            .BorderColor(Colors.Orange.Medium)
            .Background(Colors.Orange.Lighten5)
            .Padding(4)
            .AlignCenter()
            .AlignMiddle()
            .Text(text =>
            {
                text.AlignCenter();
                text.Span("⚡ ").FontSize(10).FontColor(Colors.Orange.Darken1);
                text.Span(TruncateMessage(warningMessage, 100))
                    .FontSize(9)
                    .FontColor(Colors.Orange.Darken2);
            });
    }

    /// <summary>
    /// Renders an informational placeholder.
    /// Used for development/debugging purposes.
    /// </summary>
    /// <param name="container">The container to render into.</param>
    /// <param name="infoMessage">The informational message to display.</param>
    public static void RenderInfo(IContainer container, string infoMessage)
    {
        container
            .Border(1)
            .BorderColor(Colors.Blue.Medium)
            .Background(Colors.Blue.Lighten5)
            .Padding(4)
            .AlignCenter()
            .AlignMiddle()
            .Text(text =>
            {
                text.AlignCenter();
                text.Span("ℹ ").FontSize(10).FontColor(Colors.Blue.Darken1);
                text.Span(TruncateMessage(infoMessage, 100))
                    .FontSize(9)
                    .FontColor(Colors.Blue.Darken2);
            });
    }

    /// <summary>
    /// Truncates a message to prevent overflow in placeholder display.
    /// </summary>
    private static string TruncateMessage(string message, int maxLength)
    {
        if (string.IsNullOrEmpty(message))
            return "Unknown";

        return message.Length <= maxLength
            ? message
            : string.Concat(message.AsSpan(0, maxLength - 3), "...");
    }
}
