using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Document> Documents { get; set; }
    public DbSet<Template> Templates { get; set; }
    public DbSet<VariableHistory> VariableHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Content).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        modelBuilder.Entity<Template>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Content).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.IsBuiltIn).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        modelBuilder.Entity<VariableHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityAlwaysColumn();
            entity.Property(e => e.VariablesJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.GeneratedBy).HasMaxLength(255);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.PdfHash).HasMaxLength(128);

            // Create index on DocumentId for fast lookups
            entity.HasIndex(e => e.DocumentId);

            // Create composite index for version lookups
            entity.HasIndex(e => new { e.DocumentId, e.Version });

            // Foreign key relationship
            entity
                .HasOne(e => e.Document)
                .WithMany()
                .HasForeignKey(e => e.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
