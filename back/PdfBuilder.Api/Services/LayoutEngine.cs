using System.Text.Json;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Layout engine for calculating component positions with auto-expansion support.
/// Handles the logic of expanding components vertically and pushing down dependent components.
/// </summary>
public static class LayoutEngine
{
    /// <summary>
    /// Represents a component with its calculated layout position.
    /// </summary>
    public record LayoutComponent
    {
        public required ComponentData Component { get; init; }

        /// <summary>
        /// The calculated Y position after accounting for auto-expansion of components above.
        /// </summary>
        public double AdjustedY { get; set; }

        /// <summary>
        /// The actual height of the component (may differ from Size.Height for auto-expand components).
        /// For non-auto-expand components, this equals Size.Height.
        /// For auto-expand components, this is the measured content height.
        /// </summary>
        public double ActualHeight { get; set; }

        /// <summary>
        /// Whether this component uses auto-expansion.
        /// </summary>
        public bool IsAutoExpand => Component.Layout?.AutoExpand ?? false;

        /// <summary>
        /// Whether this component pushes siblings when it expands.
        /// </summary>
        public bool PushesSiblings => Component.Layout?.PushSiblings ?? true;

        /// <summary>
        /// Original bottom edge (Y + Height) before any adjustments.
        /// </summary>
        public double OriginalBottom => Component.Position.Y + Component.Size.Height;

        /// <summary>
        /// Adjusted bottom edge (AdjustedY + ActualHeight) after adjustments.
        /// </summary>
        public double AdjustedBottom => AdjustedY + ActualHeight;
    }

    /// <summary>
    /// Result of layout calculation containing all positioned components.
    /// </summary>
    public record LayoutResult
    {
        public required List<LayoutComponent> Components { get; init; }
    }

    /// <summary>
    /// Calculates the layout positions for all components, taking into account auto-expansion.
    ///
    /// Algorithm:
    /// 1. Sort components by their Y position (top to bottom)
    /// 2. For each component:
    ///    a. Calculate its adjusted Y based on expansion of components above
    ///    b. If it's an auto-expand component, measure its actual height
    ///    c. If it expanded and pushes siblings, track the expansion delta
    /// 3. Apply accumulated deltas to components below
    /// </summary>
    public static LayoutResult CalculateLayout(
        List<ComponentData> components,
        RenderContext? renderContext = null
    )
    {
        if (components.Count == 0)
        {
            return new LayoutResult { Components = [] };
        }

        // Create layout components with initial values
        var layoutComponents = components
            .Select(c => new LayoutComponent
            {
                Component = c,
                AdjustedY = c.Position.Y,
                ActualHeight = c.Size.Height,
            })
            .ToList();

        // Sort by Y position (top to bottom), then by X for consistent ordering
        layoutComponents = layoutComponents
            .OrderBy(lc => lc.Component.Position.Y)
            .ThenBy(lc => lc.Component.Position.X)
            .ToList();

        // Process components and track expansions
        for (int i = 0; i < layoutComponents.Count; i++)
        {
            var current = layoutComponents[i];

            // For auto-expand components, we can't measure actual height at this stage
            // because QuestPDF measures during rendering. The actual height will be
            // determined during the two-pass rendering in PdfDocument.
            // Here we just set up the initial layout relationships.

            if (!current.IsAutoExpand || !current.PushesSiblings)
            {
                continue;
            }

            // Calculate expansion delta for this component
            // Note: At this point, ActualHeight == Size.Height (min height)
            // The real expansion happens during rendering
            var expansionDelta = current.ActualHeight - current.Component.Size.Height;

            if (expansionDelta <= 0)
            {
                continue;
            }

            // Push down all components that are below this one and have horizontal overlap
            var currentRight = current.Component.Position.X + current.Component.Size.Width;

            for (int j = i + 1; j < layoutComponents.Count; j++)
            {
                var below = layoutComponents[j];

                // Check if this component is below the current one's original bottom
                if (below.Component.Position.Y < current.OriginalBottom)
                {
                    continue;
                }

                // Check for horizontal overlap
                var belowRight = below.Component.Position.X + below.Component.Size.Width;
                var hasHorizontalOverlap =
                    current.Component.Position.X < belowRight
                    && currentRight > below.Component.Position.X;

                if (hasHorizontalOverlap)
                {
                    below.AdjustedY += expansionDelta;
                }
            }
        }

        return new LayoutResult { Components = layoutComponents };
    }

    /// <summary>
    /// Determines if component B should be pushed down when component A expands.
    ///
    /// Criteria:
    /// 1. B's top edge is at or below A's original bottom edge (B is below A)
    /// 2. B has horizontal overlap with A
    /// 3. A has PushSiblings enabled (checked by caller)
    /// </summary>
    public static bool ShouldPushDown(ComponentData componentA, ComponentData componentB)
    {
        var aBottom = componentA.Position.Y + componentA.Size.Height;
        var bTop = componentB.Position.Y;

        // B must be at or below A's bottom
        if (bTop < aBottom)
        {
            return false;
        }

        // Check horizontal overlap
        var aLeft = componentA.Position.X;
        var aRight = componentA.Position.X + componentA.Size.Width;
        var bLeft = componentB.Position.X;
        var bRight = componentB.Position.X + componentB.Size.Width;

        return aLeft < bRight && aRight > bLeft;
    }

    /// <summary>
    /// Gets all components that would be affected (pushed down) if the given component expands.
    /// </summary>
    public static List<ComponentData> GetAffectedComponents(
        ComponentData expandingComponent,
        List<ComponentData> allComponents
    )
    {
        return allComponents
            .Where(c => c.Id != expandingComponent.Id && ShouldPushDown(expandingComponent, c))
            .OrderBy(c => c.Position.Y)
            .ToList();
    }

    /// <summary>
    /// Checks if two components have any overlap (both horizontal and vertical).
    /// Used to determine if components are already overlapping by design.
    /// </summary>
    public static bool HasOverlap(ComponentData a, ComponentData b)
    {
        var aLeft = a.Position.X;
        var aRight = a.Position.X + a.Size.Width;
        var aTop = a.Position.Y;
        var aBottom = a.Position.Y + a.Size.Height;

        var bLeft = b.Position.X;
        var bRight = b.Position.X + b.Size.Width;
        var bTop = b.Position.Y;
        var bBottom = b.Position.Y + b.Size.Height;

        // Check horizontal overlap
        var horizontalOverlap = aLeft < bRight && aRight > bLeft;

        // Check vertical overlap
        var verticalOverlap = aTop < bBottom && aBottom > bTop;

        return horizontalOverlap && verticalOverlap;
    }

    /// <summary>
    /// Component types that support auto-expansion (have variable content height).
    /// </summary>
    public static readonly HashSet<string> AutoExpandableTypes = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        "paragraph",
        "text-label",
        "table",
    };

    /// <summary>
    /// Checks if a component type supports auto-expansion.
    /// </summary>
    public static bool SupportsAutoExpand(string componentType)
    {
        return AutoExpandableTypes.Contains(componentType);
    }
}

/// <summary>
/// Context for rendering operations, containing variables and page info.
/// </summary>
public record RenderContext
{
    public int PageNumber { get; init; }
    public int TotalPages { get; init; }
    public Dictionary<string, string> Variables { get; init; } = [];
    public Dictionary<string, JsonElement>? ComplexVariables { get; init; }
}
