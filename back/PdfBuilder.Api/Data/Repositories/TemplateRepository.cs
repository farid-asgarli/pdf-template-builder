using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Data.Repositories;

/// <summary>
/// Repository implementation for Template entities.
/// </summary>
public class TemplateRepository(AppDbContext context) : ITemplateRepository
{
    private readonly AppDbContext _context = context;

    public async Task<IEnumerable<Template>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        return await _context
            .Templates.OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Template?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.Templates.FindAsync([id], cancellationToken);
    }

    public async Task<Template> CreateAsync(
        Template template,
        CancellationToken cancellationToken = default
    )
    {
        _context.Templates.Add(template);
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<Template> UpdateAsync(
        Template template,
        CancellationToken cancellationToken = default
    )
    {
        _context.Templates.Update(template);
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var template = await _context.Templates.FindAsync([id], cancellationToken);
        if (template == null)
            return false;

        _context.Templates.Remove(template);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Templates.AnyAsync(t => t.Id == id, cancellationToken);
    }
}
