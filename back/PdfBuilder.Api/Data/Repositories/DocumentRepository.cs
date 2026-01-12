using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Data.Repositories;

/// <summary>
/// Repository implementation for Document entities.
/// </summary>
public class DocumentRepository : IDocumentRepository
{
    private readonly AppDbContext _context;

    public DocumentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Document>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        return await _context
            .Documents.OrderByDescending(d => d.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Document?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.Documents.FindAsync([id], cancellationToken);
    }

    public async Task<Document> CreateAsync(
        Document document,
        CancellationToken cancellationToken = default
    )
    {
        _context.Documents.Add(document);
        await _context.SaveChangesAsync(cancellationToken);
        return document;
    }

    public async Task<Document> UpdateAsync(
        Document document,
        CancellationToken cancellationToken = default
    )
    {
        _context.Documents.Update(document);
        await _context.SaveChangesAsync(cancellationToken);
        return document;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents.FindAsync([id], cancellationToken);
        if (document == null)
            return false;

        _context.Documents.Remove(document);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Documents.AnyAsync(d => d.Id == id, cancellationToken);
    }
}
