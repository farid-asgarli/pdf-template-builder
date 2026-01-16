using DocumentFormat.OpenXml.Drawing.Wordprocessing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using static PdfBuilder.Api.Services.DocxImport.DocxConversionConstants;
using A = DocumentFormat.OpenXml.Drawing;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing image extraction logic.
/// </summary>
public partial class DocxImportService
{
    #region Image Extraction

    /// <summary>
    /// Extracts all images from the document body with their dimensions and positioning.
    /// Images are collected separately; inline images within paragraphs are tracked by their
    /// relationship ID which can be correlated with paragraph runs.
    /// </summary>
    private List<ParsedDocxImage> ExtractImagesWithDimensions(MainDocumentPart mainPart)
    {
        var images = new List<ParsedDocxImage>();
        var imagePartsMap = BuildImagePartsMap(mainPart);
        var processedRelIds = new HashSet<string>();

        // Find all drawings in the document body
        var drawings = mainPart.Document.Body?.Descendants<Drawing>().ToList() ?? [];

        foreach (var drawing in drawings)
        {
            try
            {
                var parsedImage = ParseDrawing(drawing, imagePartsMap);
                if (parsedImage != null)
                {
                    images.Add(parsedImage);
                    processedRelIds.Add(parsedImage.ImageId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse drawing element");
            }
        }

        // Handle orphan images (images that exist but weren't found in drawings)
        // This can happen with legacy VML images or corrupted documents
        AddOrphanImages(images, imagePartsMap, processedRelIds);

        return images;
    }

    /// <summary>
    /// Builds a map of relationship IDs to ImageParts for quick lookup.
    /// </summary>
    private Dictionary<string, ImagePart> BuildImagePartsMap(MainDocumentPart mainPart)
    {
        var map = new Dictionary<string, ImagePart>();

        foreach (var imagePart in mainPart.ImageParts)
        {
            try
            {
                var relationshipId = mainPart.GetIdOfPart(imagePart);
                map[relationshipId] = imagePart;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to map image part relationship");
            }
        }

        return map;
    }

    /// <summary>
    /// Adds any images that weren't found via Drawing elements (orphans).
    /// </summary>
    private void AddOrphanImages(
        List<ParsedDocxImage> images,
        Dictionary<string, ImagePart> imagePartsMap,
        HashSet<string> processedRelIds
    )
    {
        foreach (var (relId, imagePart) in imagePartsMap)
        {
            if (processedRelIds.Contains(relId))
                continue;

            try
            {
                var imageData = ExtractImageData(imagePart);
                if (imageData != null)
                {
                    images.Add(
                        new ParsedDocxImage
                        {
                            ImageId = relId,
                            ContentType = imagePart.ContentType,
                            Data = imageData,
                            PositionType = ImagePositionType.Inline,
                            WrapStyle = ImageWrapStyle.Inline,
                        }
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract orphan image: {RelId}", relId);
            }
        }
    }

    /// <summary>
    /// Extracts image binary data from an ImagePart.
    /// </summary>
    private static byte[]? ExtractImageData(ImagePart imagePart)
    {
        using var stream = imagePart.GetStream();
        using var memoryStream = new MemoryStream();
        stream.CopyTo(memoryStream);
        var data = memoryStream.ToArray();
        return data.Length > 0 ? data : null;
    }

    #endregion

    #region Drawing Parsing

    /// <summary>
    /// Parses a Drawing element and extracts the image information.
    /// </summary>
    private static ParsedDocxImage? ParseDrawing(
        Drawing drawing,
        Dictionary<string, ImagePart> imagePartsMap
    )
    {
        // Handle inline images (flow with text)
        var inline = drawing.Inline;
        if (inline != null)
        {
            return ParseInlineImage(inline, imagePartsMap);
        }

        // Handle anchored (floating) images
        var anchor = drawing.Anchor;
        if (anchor != null)
        {
            return ParseAnchoredImage(anchor, imagePartsMap);
        }

        return null;
    }

    /// <summary>
    /// Parses an inline image (embedded in text flow).
    /// </summary>
    private static ParsedDocxImage? ParseInlineImage(
        Inline inline,
        Dictionary<string, ImagePart> imagePartsMap
    )
    {
        var blip = inline.Descendants<A.Blip>().FirstOrDefault();
        if (blip?.Embed?.Value == null)
            return null;

        var relId = blip.Embed.Value;
        if (!imagePartsMap.TryGetValue(relId, out var imagePart))
            return null;

        var imageData = ExtractImageData(imagePart);
        if (imageData == null)
            return null;

        // Extract dimensions (convert EMU to mm)
        var extent = inline.Extent;
        double? widthMm = extent?.Cx?.HasValue == true ? extent.Cx.Value / EmuPerMm : null;
        double? heightMm = extent?.Cy?.HasValue == true ? extent.Cy.Value / EmuPerMm : null;

        // Extract document properties (alt text, title)
        var docProperties = inline.DocProperties;

        return new ParsedDocxImage
        {
            ImageId = relId,
            ContentType = imagePart.ContentType,
            Data = imageData,
            Width = widthMm,
            Height = heightMm,
            AltText = docProperties?.Description?.Value,
            Title = docProperties?.Title?.Value ?? docProperties?.Name?.Value,
            PositionType = ImagePositionType.Inline,
            WrapStyle = ImageWrapStyle.Inline,
            AspectRatio = CalculateAspectRatio(widthMm, heightMm),
        };
    }

    /// <summary>
    /// Parses an anchored (floating) image with positioning information.
    /// </summary>
    private static ParsedDocxImage? ParseAnchoredImage(
        Anchor anchor,
        Dictionary<string, ImagePart> imagePartsMap
    )
    {
        var blip = anchor.Descendants<A.Blip>().FirstOrDefault();
        if (blip?.Embed?.Value == null)
            return null;

        var relId = blip.Embed.Value;
        if (!imagePartsMap.TryGetValue(relId, out var imagePart))
            return null;

        var imageData = ExtractImageData(imagePart);
        if (imageData == null)
            return null;

        // Extract dimensions
        var extent = anchor.Extent;
        double? widthMm = extent?.Cx?.HasValue == true ? extent.Cx.Value / EmuPerMm : null;
        double? heightMm = extent?.Cy?.HasValue == true ? extent.Cy.Value / EmuPerMm : null;

        // Extract position offsets
        var (hPos, vPos) = ExtractAnchorPositions(anchor);

        // Extract wrap style
        var wrapStyle = ExtractWrapStyle(anchor);

        // Extract document properties
        var docProperties = anchor.Descendants<DocProperties>().FirstOrDefault();

        // Determine if image is behind text
        var isBehindText = anchor.BehindDoc?.Value ?? false;

        return new ParsedDocxImage
        {
            ImageId = relId,
            ContentType = imagePart.ContentType,
            Data = imageData,
            Width = widthMm,
            Height = heightMm,
            AltText = docProperties?.Description?.Value,
            Title = docProperties?.Title?.Value ?? docProperties?.Name?.Value,
            PositionType = ImagePositionType.Anchor,
            HorizontalPosition = hPos,
            VerticalPosition = vPos,
            WrapStyle =
                isBehindText && wrapStyle == ImageWrapStyle.InFront
                    ? ImageWrapStyle.Behind
                    : wrapStyle,
            AspectRatio = CalculateAspectRatio(widthMm, heightMm),
        };
    }

    /// <summary>
    /// Extracts horizontal and vertical position offsets from an anchor.
    /// </summary>
    private static (double? horizontal, double? vertical) ExtractAnchorPositions(Anchor anchor)
    {
        double? hPos = null;
        double? vPos = null;

        var hPosOffset = anchor.HorizontalPosition?.PositionOffset?.Text;
        if (!string.IsNullOrEmpty(hPosOffset) && long.TryParse(hPosOffset, out var hEmu))
        {
            hPos = hEmu / EmuPerMm;
        }

        var vPosOffset = anchor.VerticalPosition?.PositionOffset?.Text;
        if (!string.IsNullOrEmpty(vPosOffset) && long.TryParse(vPosOffset, out var vEmu))
        {
            vPos = vEmu / EmuPerMm;
        }

        return (hPos, vPos);
    }

    /// <summary>
    /// Determines the text wrap style from an anchor element.
    /// </summary>
    private static string ExtractWrapStyle(Anchor anchor)
    {
        if (anchor.GetFirstChild<WrapNone>() != null)
            return ImageWrapStyle.InFront;
        if (anchor.GetFirstChild<WrapSquare>() != null)
            return ImageWrapStyle.Square;
        if (anchor.GetFirstChild<WrapTight>() != null)
            return ImageWrapStyle.Tight;
        if (anchor.GetFirstChild<WrapThrough>() != null)
            return ImageWrapStyle.Through;
        if (anchor.GetFirstChild<WrapTopBottom>() != null)
            return ImageWrapStyle.TopAndBottom;

        // Default to square wrapping for anchored images
        return ImageWrapStyle.Square;
    }

    /// <summary>
    /// Calculates aspect ratio from dimensions.
    /// </summary>
    private static double? CalculateAspectRatio(double? width, double? height)
    {
        if (width.HasValue && height.HasValue && height.Value > 0)
        {
            return width.Value / height.Value;
        }
        return null;
    }

    #endregion
}
