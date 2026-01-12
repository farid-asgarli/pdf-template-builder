using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PdfBuilder.Api.DTOs.Documents;
using static PdfBuilder.Api.Services.DocxImport.DocxConversionConstants;
using A = DocumentFormat.OpenXml.Drawing;
using Vml = DocumentFormat.OpenXml.Vml;

namespace PdfBuilder.Api.Services;

/// <summary>
/// Partial class containing document elements extraction methods:
/// Footnotes, Endnotes, Bookmarks, Document Properties, Watermarks, and Comments
/// </summary>
public partial class DocxImportService
{
    #region Footnotes and Endnotes Extraction

    private void ExtractFootnotesAndEndnotes(
        WordprocessingDocument wordDocument,
        ParsedDocxContent content
    )
    {
        var mainPart = wordDocument.MainDocumentPart;
        if (mainPart == null)
            return;

        ExtractFootnotes(mainPart, content);
        ExtractEndnotes(mainPart, content);
    }

    private void ExtractFootnotes(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var footnotesPart = mainPart.FootnotesPart;
        if (footnotesPart?.Footnotes == null)
            return;

        foreach (var footnote in footnotesPart.Footnotes.Elements<Footnote>())
        {
            // Skip separator and continuation footnotes (IDs -1 and 0)
            if (footnote.Id?.Value is not { } noteId || noteId <= 0)
                continue;

            var parsedNote = CreateParsedNote((int)noteId, "footnote");
            ParseNoteContent(footnote, mainPart, parsedNote);

            // Try to find the reference marker in the document body
            parsedNote.ReferenceMarker = FindNoteReferenceMarker(
                mainPart,
                (int)noteId,
                isFootnote: true
            );

            content.Footnotes.Add(parsedNote);
        }
    }

    private void ExtractEndnotes(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var endnotesPart = mainPart.EndnotesPart;
        if (endnotesPart?.Endnotes == null)
            return;

        foreach (var endnote in endnotesPart.Endnotes.Elements<Endnote>())
        {
            // Skip separator and continuation endnotes (IDs -1 and 0)
            if (endnote.Id?.Value is not { } noteId || noteId <= 0)
                continue;

            var parsedNote = CreateParsedNote((int)noteId, "endnote");
            ParseNoteContent(endnote, mainPart, parsedNote);

            // Try to find the reference marker in the document body
            parsedNote.ReferenceMarker = FindNoteReferenceMarker(
                mainPart,
                (int)noteId,
                isFootnote: false
            );

            content.Endnotes.Add(parsedNote);
        }
    }

    private static ParsedDocxNote CreateParsedNote(int id, string noteType) =>
        new() { Id = id, NoteType = noteType };

    private void ParseNoteContent(
        OpenXmlElement noteElement,
        MainDocumentPart mainPart,
        ParsedDocxNote parsedNote
    )
    {
        foreach (var para in noteElement.Elements<Paragraph>())
        {
            var parsedPara = ParseParagraph(para, mainPart);
            if (parsedPara != null)
            {
                parsedNote.Content.Add(parsedPara);
            }
        }
    }

    private static string FindNoteReferenceMarker(
        MainDocumentPart mainPart,
        int noteId,
        bool isFootnote
    )
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return noteId.ToString();

        // Find the reference in the document body
        if (isFootnote)
        {
            var reference = body.Descendants<FootnoteReference>()
                .FirstOrDefault(r => r.Id?.Value == noteId);
            if (reference != null)
            {
                // Check for custom mark
                var customMark =
                    reference.CustomMarkFollows?.Value == true
                        ? reference.NextSibling<Run>()?.InnerText
                        : null;
                return customMark ?? noteId.ToString();
            }
        }
        else
        {
            var reference = body.Descendants<EndnoteReference>()
                .FirstOrDefault(r => r.Id?.Value == noteId);
            if (reference != null)
            {
                var customMark =
                    reference.CustomMarkFollows?.Value == true
                        ? reference.NextSibling<Run>()?.InnerText
                        : null;
                return customMark ?? noteId.ToString();
            }
        }

        return noteId.ToString();
    }

    #endregion

    #region Bookmark Extraction

    private void ExtractBookmarks(MainDocumentPart mainPart, ParsedDocxContent content)
    {
        var body = mainPart.Document.Body;
        if (body == null)
            return;

        var bookmarkStarts = body.Descendants<BookmarkStart>().ToList();
        var bookmarkEnds = body.Descendants<BookmarkEnd>().ToDictionary(b => b.Id?.Value ?? "");

        // Build element index map for position tracking
        var elementIndexMap = BuildElementIndexMap(body);

        foreach (var bookmarkStart in bookmarkStarts)
        {
            // Skip internal bookmarks (starting with _)
            var bookmarkName = bookmarkStart.Name?.Value;
            if (string.IsNullOrEmpty(bookmarkName) || bookmarkName.StartsWith('_'))
                continue;

            var bookmarkId = bookmarkStart.Id?.Value;
            if (string.IsNullOrEmpty(bookmarkId))
                continue;

            var bookmark = new ParsedDocxBookmark
            {
                Id = int.TryParse(bookmarkId, out var id) ? id : 0,
                Name = bookmarkName,
            };

            // Calculate element indices
            bookmark.StartElementIndex = GetElementIndex(bookmarkStart, elementIndexMap);
            bookmark.StartTextOffset = GetTextOffset(bookmarkStart);

            if (bookmarkEnds.TryGetValue(bookmarkId, out var bookmarkEnd))
            {
                bookmark.EndElementIndex = GetElementIndex(bookmarkEnd, elementIndexMap);
                bookmark.EndTextOffset = GetTextOffset(bookmarkEnd);
                bookmark.BookmarkedText = ExtractTextBetweenMarkers(bookmarkStart, bookmarkEnd);
            }

            content.Bookmarks.Add(bookmark);
        }
    }

    private static Dictionary<OpenXmlElement, int> BuildElementIndexMap(Body body)
    {
        var map = new Dictionary<OpenXmlElement, int>();
        var index = 0;

        foreach (var element in body.ChildElements)
        {
            if (element is Paragraph or Table)
            {
                map[element] = index++;
            }
        }

        return map;
    }

    private static int GetElementIndex(
        OpenXmlElement marker,
        Dictionary<OpenXmlElement, int> elementIndexMap
    )
    {
        // Walk up to find the containing block-level element
        var current = marker;
        while (current != null)
        {
            if (elementIndexMap.TryGetValue(current, out var index))
                return index;
            current = current.Parent;
        }

        return 0;
    }

    private static int? GetTextOffset(OpenXmlElement marker)
    {
        // Find the text offset within the containing paragraph
        var paragraph = marker.Ancestors<Paragraph>().FirstOrDefault();
        if (paragraph == null)
            return null;

        var offset = 0;
        foreach (var element in paragraph.ChildElements)
        {
            if (element == marker || element.Descendants().Contains(marker))
                return offset;

            if (element is Run run)
                offset += run.InnerText.Length;
        }

        return offset;
    }

    private static string ExtractTextBetweenMarkers(OpenXmlElement start, OpenXmlElement end)
    {
        var textBuilder = new StringBuilder();
        var currentNode = start.NextSibling();
        var reachedEnd = false;

        while (currentNode != null && !reachedEnd)
        {
            if (currentNode == end)
            {
                reachedEnd = true;
                break;
            }

            switch (currentNode)
            {
                case Run run:
                    textBuilder.Append(run.InnerText);
                    break;
                case Paragraph para:
                    if (textBuilder.Length > 0)
                        textBuilder.AppendLine();
                    textBuilder.Append(para.InnerText);
                    break;
            }

            // Check if end marker is a descendant of current node
            if (currentNode.Descendants().Contains(end))
            {
                // Extract text up to the end marker
                foreach (var child in currentNode.ChildElements)
                {
                    if (child == end || child.Descendants().Contains(end))
                        break;
                    if (child is Run childRun)
                        textBuilder.Append(childRun.InnerText);
                }
                break;
            }

            currentNode = currentNode.NextSibling();
        }

        return textBuilder.ToString();
    }

    #endregion

    #region Document Properties Extraction

    private DocxDocumentProperties? ExtractDocumentProperties(WordprocessingDocument wordDocument)
    {
        var props = new DocxDocumentProperties();
        var hasProps = false;

        // Core properties (title, subject, creator, etc.)
        var coreProps = wordDocument.PackageProperties;
        if (coreProps != null)
        {
            props.Title = coreProps.Title;
            props.Subject = coreProps.Subject;
            props.Creator = coreProps.Creator;
            props.Keywords = coreProps.Keywords;
            props.Description = coreProps.Description;
            props.LastModifiedBy = coreProps.LastModifiedBy;
            props.Created = coreProps.Created;
            props.Modified = coreProps.Modified;
            props.Category = coreProps.Category;

            hasProps =
                !string.IsNullOrEmpty(props.Title)
                || !string.IsNullOrEmpty(props.Creator)
                || props.Created != null;
        }

        // Extended properties (company, manager, statistics)
        var extendedProps = wordDocument.ExtendedFilePropertiesPart;
        if (extendedProps?.Properties != null)
        {
            var ep = extendedProps.Properties;

            props.Company = ep.Company?.Text;
            props.Manager = ep.Manager?.Text;
            props.Application = ep.Application?.Text;
            props.AppVersion = ep.ApplicationVersion?.Text;

            if (int.TryParse(ep.TotalTime?.Text, out var totalTime))
                props.TotalTime = totalTime;
            if (int.TryParse(ep.Pages?.Text, out var pages))
                props.Pages = pages;
            if (int.TryParse(ep.Words?.Text, out var words))
                props.Words = words;
            if (int.TryParse(ep.Characters?.Text, out var chars))
                props.Characters = chars;
            if (int.TryParse(ep.CharactersWithSpaces?.Text, out var charsWithSpaces))
                props.CharactersWithSpaces = charsWithSpaces;
            if (int.TryParse(ep.Lines?.Text, out var lines))
                props.Lines = lines;
            if (int.TryParse(ep.Paragraphs?.Text, out var paragraphs))
                props.Paragraphs = paragraphs;

            hasProps = hasProps || !string.IsNullOrEmpty(props.Company);
        }

        return hasProps ? props : null;
    }

    #endregion

    #region Watermark Extraction

    private ParsedDocxWatermark? ExtractWatermark(MainDocumentPart mainPart)
    {
        // Watermarks are typically in headers
        foreach (var headerPart in mainPart.HeaderParts)
        {
            if (headerPart.Header == null)
                continue;

            // Look for VML shape with watermark properties
            var vmlWatermark = ExtractVmlWatermark(headerPart);
            if (vmlWatermark != null)
                return vmlWatermark;

            // Also look for DrawingML watermarks (newer format)
            var drawingWatermark = ExtractDrawingWatermark(headerPart);
            if (drawingWatermark != null)
                return drawingWatermark;
        }

        return null;
    }

    private ParsedDocxWatermark? ExtractVmlWatermark(HeaderPart headerPart)
    {
        foreach (var pict in headerPart.Header!.Descendants<Picture>())
        {
            var shape = pict.Descendants<Vml.Shape>().FirstOrDefault();
            if (shape == null)
                continue;

            // Check for text watermark
            var textPath = shape.Descendants<Vml.TextPath>().FirstOrDefault();
            if (textPath != null)
            {
                return CreateTextWatermark(shape, textPath);
            }

            // Check for image watermark
            var imageData = shape.Descendants<Vml.ImageData>().FirstOrDefault();
            if (imageData?.RelId?.Value != null)
            {
                var watermark = ExtractVmlImageWatermark(headerPart, imageData);
                if (watermark != null)
                    return watermark;
            }
        }

        return null;
    }

    private static ParsedDocxWatermark CreateTextWatermark(Vml.Shape shape, Vml.TextPath textPath)
    {
        var fillColor = ExtractVmlFillColor(shape) ?? DefaultWatermarkColor;
        var (fontFamily, fontSize) = ExtractVmlFont(textPath, shape);

        return new ParsedDocxWatermark
        {
            Type = "text",
            Text = textPath.String?.Value ?? string.Empty,
            Color = fillColor,
            FontFamily = fontFamily,
            FontSize = fontSize,
            Rotation = ParseRotation(shape.Style?.Value),
            Opacity = ExtractVmlOpacity(shape),
        };
    }

    private static (string FontFamily, double FontSize) ExtractVmlFont(
        Vml.TextPath textPath,
        Vml.Shape shape
    )
    {
        var fontFamily = DefaultWatermarkFont;
        var fontSize = DefaultWatermarkFontSize;

        // Try to get font from textPath style
        var textPathStyle = textPath.Style?.Value;
        if (!string.IsNullOrEmpty(textPathStyle))
        {
            fontFamily =
                ExtractStyleValue(textPathStyle, "font-family")?.Trim('"', '\'') ?? fontFamily;
            var fontSizeStr = ExtractStyleValue(textPathStyle, "font-size");
            if (!string.IsNullOrEmpty(fontSizeStr))
            {
                fontSize = ParseFontSize(fontSizeStr);
            }
        }

        // Fallback to shape style
        var shapeStyle = shape.Style?.Value;
        if (!string.IsNullOrEmpty(shapeStyle) && fontFamily == DefaultWatermarkFont)
        {
            fontFamily =
                ExtractStyleValue(shapeStyle, "font-family")?.Trim('"', '\'') ?? fontFamily;
        }

        return (fontFamily, fontSize);
    }

    private static double ParseFontSize(string fontSizeStr)
    {
        // Handle various font size formats: "72pt", "72", "1in"
        fontSizeStr = fontSizeStr.Trim().ToLowerInvariant();

        if (fontSizeStr.EndsWith("pt"))
        {
            if (double.TryParse(fontSizeStr[..^2], out var ptSize))
                return ptSize;
        }
        else if (fontSizeStr.EndsWith("in"))
        {
            if (double.TryParse(fontSizeStr[..^2], out var inSize))
                return inSize * 72; // 72 points per inch
        }
        else if (double.TryParse(fontSizeStr, out var size))
        {
            return size;
        }

        return DefaultWatermarkFontSize;
    }

    private static int ExtractVmlOpacity(Vml.Shape shape)
    {
        // Try to get opacity from fill element
        var fill = shape.Descendants<Vml.Fill>().FirstOrDefault();
        if (fill?.Opacity?.Value != null)
        {
            // Opacity can be "0.5" or "50%"
            var opacityStr = fill.Opacity.Value;
            if (opacityStr.EndsWith('%'))
            {
                if (double.TryParse(opacityStr[..^1], out var pctValue))
                    return (int)pctValue;
            }
            else if (double.TryParse(opacityStr, out var decValue))
            {
                return (int)(decValue * 100);
            }
        }

        return DefaultWatermarkOpacity;
    }

    private ParsedDocxWatermark? ExtractVmlImageWatermark(
        HeaderPart headerPart,
        Vml.ImageData imageData
    )
    {
        try
        {
            if (headerPart.GetPartById(imageData.RelId!.Value!) is not ImagePart imagePart)
                return null;

            using var stream = imagePart.GetStream();
            using var memoryStream = new MemoryStream();
            stream.CopyTo(memoryStream);

            return new ParsedDocxWatermark
            {
                Type = "image",
                ImageData = memoryStream.ToArray(),
                ImageContentType = imagePart.ContentType,
                IsWashout = true,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract VML watermark image");
            return null;
        }
    }

    private ParsedDocxWatermark? ExtractDrawingWatermark(HeaderPart headerPart)
    {
        foreach (var drawing in headerPart.Header!.Descendants<Drawing>())
        {
            var anchor = drawing.Anchor;
            if (anchor == null)
                continue;

            // Check if this is a behind-text element (potential watermark)
            var blip = anchor.Descendants<A.Blip>().FirstOrDefault();
            if (blip?.Embed?.Value == null)
                continue;

            try
            {
                if (headerPart.GetPartById(blip.Embed.Value) is not ImagePart imagePart)
                    continue;

                using var stream = imagePart.GetStream();
                using var memoryStream = new MemoryStream();
                stream.CopyTo(memoryStream);

                var extent = anchor.Extent;
                var scale = CalculateWatermarkScale(extent);

                return new ParsedDocxWatermark
                {
                    Type = "image",
                    ImageData = memoryStream.ToArray(),
                    ImageContentType = imagePart.ContentType,
                    Scale = scale,
                    IsWashout = true,
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract DrawingML watermark");
            }
        }

        return null;
    }

    private static double CalculateWatermarkScale(
        DocumentFormat.OpenXml.Drawing.Wordprocessing.Extent? extent
    )
    {
        if (extent?.Cx?.HasValue != true)
            return 100;

        // Calculate scale based on size
        var widthMm = extent.Cx.Value / EmuPerMm;
        var scale = widthMm / 200 * 100; // Estimate based on typical watermark size
        return Math.Clamp(scale, 10, 100);
    }

    private static double ParseRotation(string? style)
    {
        if (string.IsNullOrEmpty(style))
            return DefaultWatermarkRotation;

        var rotationStr = ExtractStyleValue(style, "rotation");
        if (!string.IsNullOrEmpty(rotationStr) && double.TryParse(rotationStr, out var rotation))
            return rotation;

        return DefaultWatermarkRotation;
    }

    // Watermark-specific constants
    private const string DefaultWatermarkColor = "#C0C0C0";
    private const string DefaultWatermarkFont = "Calibri";
    private const double DefaultWatermarkFontSize = 120;
    private const int DefaultWatermarkOpacity = 50;
    private const double DefaultWatermarkRotation = -45;

    #endregion

    #region Comment Extraction

    private void ExtractComments(WordprocessingDocument wordDocument, ParsedDocxContent content)
    {
        var mainPart = wordDocument.MainDocumentPart;
        var commentsPart = mainPart?.WordprocessingCommentsPart;

        if (commentsPart?.Comments == null || mainPart == null)
            return;

        // First pass: collect all comments
        var commentsById = new Dictionary<int, ParsedDocxComment>();

        foreach (var comment in commentsPart.Comments.Elements<Comment>())
        {
            if (comment.Id?.Value == null)
                continue;

            var commentId = int.TryParse(comment.Id.Value, out var id) ? id : 0;
            var parsedComment = CreateParsedComment(comment, mainPart);

            commentsById[commentId] = parsedComment;
        }

        // Second pass: resolve parent references and add to content
        // (Word stores parent comment references in extended comments part if threaded)
        ResolveCommentHierarchy(wordDocument, commentsById);

        foreach (var comment in commentsById.Values)
        {
            content.Comments.Add(comment);
        }
    }

    private ParsedDocxComment CreateParsedComment(Comment comment, MainDocumentPart mainPart)
    {
        var commentId = int.TryParse(comment.Id?.Value, out var id) ? id : 0;

        var parsedComment = new ParsedDocxComment
        {
            Id = commentId,
            Author = comment.Author?.Value ?? "Unknown",
            Initials = comment.Initials?.Value,
            Date = comment.Date?.Value,
        };

        // Parse comment content
        var textBuilder = new StringBuilder();
        foreach (var para in comment.Elements<Paragraph>())
        {
            if (textBuilder.Length > 0)
                textBuilder.AppendLine();
            textBuilder.Append(para.InnerText);

            var parsedPara = ParseParagraph(para, mainPart);
            if (parsedPara != null)
            {
                parsedComment.Content.Add(parsedPara);
            }
        }
        parsedComment.Text = textBuilder.ToString().Trim();

        // Find the commented text in the main document
        var body = mainPart.Document.Body;
        if (body != null)
        {
            var commentStart = body.Descendants<CommentRangeStart>()
                .FirstOrDefault(c => c.Id?.Value == comment.Id?.Value);
            var commentEnd = body.Descendants<CommentRangeEnd>()
                .FirstOrDefault(c => c.Id?.Value == comment.Id?.Value);

            if (commentStart != null && commentEnd != null)
            {
                parsedComment.CommentedText = ExtractTextBetweenMarkers(commentStart, commentEnd);
            }
        }

        return parsedComment;
    }

    private static void ResolveCommentHierarchy(
        WordprocessingDocument wordDocument,
        Dictionary<int, ParsedDocxComment> commentsById
    )
    {
        // Try to get extended comments part (Word 2013+) for threaded comments
        var mainPart = wordDocument.MainDocumentPart;
        if (mainPart == null)
            return;

        // Check for comments extended part (stores parent comment references)
        try
        {
            var extendedPart = mainPart
                .GetPartsOfType<WordprocessingCommentsExPart>()
                .FirstOrDefault();
            if (extendedPart?.CommentsEx == null)
                return;

            foreach (var commentEx in extendedPart.CommentsEx.Descendants())
            {
                // Look for w15:commentEx elements with paraIdParent attribute
                var paraId = commentEx
                    .GetAttributes()
                    .FirstOrDefault(a => a.LocalName == "paraId")
                    .Value;
                var parentParaId = commentEx
                    .GetAttributes()
                    .FirstOrDefault(a => a.LocalName == "paraIdParent")
                    .Value;

                if (!string.IsNullOrEmpty(paraId) && !string.IsNullOrEmpty(parentParaId))
                {
                    // Find the comment with this paraId and set its parent
                    // This is a simplified implementation - full implementation would
                    // need to correlate paraId with comment paragraphs
                }
            }
        }
        catch
        {
            // Extended comments part not available or not accessible
        }
    }

    #endregion
}
