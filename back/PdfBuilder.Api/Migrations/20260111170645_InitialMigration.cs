using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PdfBuilder.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(
                        type: "uuid",
                        nullable: false,
                        defaultValueSql: "gen_random_uuid()"
                    ),
                    Title = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    Content = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "NOW()"
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "NOW()"
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "Templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(
                        type: "uuid",
                        nullable: false,
                        defaultValueSql: "gen_random_uuid()"
                    ),
                    Name = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    Description = table.Column<string>(
                        type: "character varying(1000)",
                        maxLength: 1000,
                        nullable: false
                    ),
                    Category = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: false
                    ),
                    Content = table.Column<string>(type: "jsonb", nullable: false),
                    IsBuiltIn = table.Column<bool>(
                        type: "boolean",
                        nullable: false,
                        defaultValue: false
                    ),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "NOW()"
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "NOW()"
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Templates", x => x.Id);
                }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Documents");

            migrationBuilder.DropTable(name: "Templates");
        }
    }
}
