using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Contracts;
using PdfBuilder.Api.Data;
using PdfBuilder.Api.Data.Repositories;
using PdfBuilder.Api.Infrastructure;
using PdfBuilder.Api.Services;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ========================
// QuestPDF Configuration
// ========================
QuestPDF.Settings.License = LicenseType.Community;

// ========================
// Core Services
// ========================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "PDF Template Builder API",
            Version = "v1",
            Description = "API for creating and generating PDF documents from templates",
        }
    );
});

// ========================
// CORS Configuration
// ========================
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:3000", "http://localhost:3001")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});

// ========================
// Database Configuration
// ========================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// ========================
// Repository Registration
// ========================
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<ITemplateRepository, TemplateRepository>();
builder.Services.AddScoped<IVariableHistoryRepository, VariableHistoryRepository>();

// ========================
// Service Registration
// ========================
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IPdfGenerationService, PdfGenerationService>();
builder.Services.AddScoped<IHtmlGenerationService, HtmlGenerationService>();
builder.Services.AddScoped<IVariableService, VariableServiceWrapper>();
builder.Services.AddScoped<IVariableHistoryService, VariableHistoryService>();
builder.Services.AddScoped<IBulkGenerationService, BulkGenerationServiceWrapper>();

// ========================
// Infrastructure Services
// ========================
builder.Services.AddSingleton<BulkJobStore>();

var app = builder.Build();

// ========================
// Database Migration & Seeding
// ========================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();

    // Seed sample templates with variables and conditions
    await DbSeeder.SeedAsync(dbContext);
}

// ========================
// HTTP Pipeline Configuration
// ========================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "PDF Template Builder API v1");
    });
}

app.UseCors("AllowFrontend");
app.MapControllers();
app.Run();
