using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PdfBuilder.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVariableHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VariableHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    GeneratedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    VariablesJson = table.Column<string>(type: "jsonb", nullable: false),
                    PdfHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    PdfSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VariableHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VariableHistories_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VariableHistories_DocumentId",
                table: "VariableHistories",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_VariableHistories_DocumentId_Version",
                table: "VariableHistories",
                columns: new[] { "DocumentId", "Version" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VariableHistories");
        }
    }
}
