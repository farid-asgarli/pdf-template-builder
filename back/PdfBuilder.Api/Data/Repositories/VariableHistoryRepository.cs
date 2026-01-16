using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Data.Repositories;

/// <summary>
/// Repository implementation for VariableHistory entities.
/// </summary>
public class VariableHistoryRepository(AppDbContext context) : IVariableHistoryRepository
{
    private readonly AppDbContext _context = context;

    public async Task<IEnumerable<VariableHistory>> GetByDocumentIdAsync(
        Guid documentId,
        int skip = 0,
        int take = 20,
        CancellationToken cancellationToken = default
    )
    {
        return await _context
            .VariableHistories.Where(h => h.DocumentId == documentId)
            .OrderByDescending(h => h.Version)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountByDocumentIdAsync(
        Guid documentId,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.VariableHistories.CountAsync(
            h => h.DocumentId == documentId,
            cancellationToken
        );
    }

    public async Task<VariableHistory?> GetByDocumentIdAndVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.VariableHistories.FirstOrDefaultAsync(
            h => h.DocumentId == documentId && h.Version == version,
            cancellationToken
        );
    }

    public async Task<int> GetNextVersionAsync(
        Guid documentId,
        CancellationToken cancellationToken = default
    )
    {
        var lastVersion =
            await _context
                .VariableHistories.Where(h => h.DocumentId == documentId)
                .MaxAsync(h => (int?)h.Version, cancellationToken) ?? 0;

        return lastVersion + 1;
    }

    public async Task<VariableHistory> CreateAsync(
        VariableHistory history,
        CancellationToken cancellationToken = default
    )
    {
        _context.VariableHistories.Add(history);
        await _context.SaveChangesAsync(cancellationToken);
        return history;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var history = await _context.VariableHistories.FindAsync([id], cancellationToken);
        if (history == null)
            return false;

        _context.VariableHistories.Remove(history);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteByDocumentIdAndVersionAsync(
        Guid documentId,
        int version,
        CancellationToken cancellationToken = default
    )
    {
        var history = await GetByDocumentIdAndVersionAsync(documentId, version, cancellationToken);
        if (history == null)
            return false;

        _context.VariableHistories.Remove(history);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
