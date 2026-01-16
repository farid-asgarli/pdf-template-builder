using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Data;

/// <summary>
/// Database seeder for sample templates with variables and conditional logic.
/// </summary>
public static class DbSeeder
{
    /// <summary>
    /// Seeds the database with sample templates if they don't exist.
    /// </summary>
    public static async Task SeedAsync(AppDbContext context)
    {
        // Only seed if no built-in templates exist
        if (await context.Templates.AnyAsync(t => t.IsBuiltIn))
        {
            return;
        }

        var templates = new List<Template>
        {
            CreateInvoiceTemplate(),
            CreateSimpleLetterTemplate(),
            CreateConditionalDemoTemplate(),
        };

        await context.Templates.AddRangeAsync(templates);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Creates a sample invoice template with variables and conditions.
    /// </summary>
    private static Template CreateInvoiceTemplate()
    {
        var content = new
        {
            id = Guid.NewGuid().ToString(),
            title = "Invoice Template",
            createdAt = DateTime.UtcNow.ToString("O"),
            updatedAt = DateTime.UtcNow.ToString("O"),
            pages = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    pageNumber = 1,
                    headerType = "default",
                    footerType = "default",
                    components = new object[]
                    {
                        // Invoice Title
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 10 },
                            size = new { width = 100, height = 15 },
                            properties = new
                            {
                                content = "INVOICE",
                                fontSize = 28,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#1f2937",
                                textAlign = "left",
                            },
                        },
                        // Invoice Number
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 130, y = 10 },
                            size = new { width = 60, height = 8 },
                            properties = new
                            {
                                content = "#{{invoiceNumber}}",
                                fontSize = 14,
                                fontFamily = "Inter",
                                fontWeight = "medium",
                                color = "#6b7280",
                                textAlign = "right",
                            },
                        },
                        // Invoice Date
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 130, y = 20 },
                            size = new { width = 60, height = 6 },
                            properties = new
                            {
                                content = "Date: {{invoiceDate:MM/dd/yyyy}}",
                                fontSize = 10,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#6b7280",
                                textAlign = "right",
                            },
                        },
                        // Due Date
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 130, y = 27 },
                            size = new { width = 60, height = 6 },
                            properties = new
                            {
                                content = "Due: {{dueDate:MM/dd/yyyy}}",
                                fontSize = 10,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#6b7280",
                                textAlign = "right",
                            },
                        },
                        // Bill To Section
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 45 },
                            size = new { width = 30, height = 6 },
                            properties = new
                            {
                                content = "BILL TO",
                                fontSize = 10,
                                fontFamily = "Inter",
                                fontWeight = "semibold",
                                color = "#9ca3af",
                                textAlign = "left",
                                letterSpacing = 0.1,
                            },
                        },
                        // Customer Name
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 53 },
                            size = new { width = 80, height = 7 },
                            properties = new
                            {
                                content = "{{customerName}}",
                                fontSize = 12,
                                fontFamily = "Inter",
                                fontWeight = "medium",
                                color = "#1f2937",
                                textAlign = "left",
                            },
                        },
                        // Company Name (conditional - only show if exists)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 61 },
                            size = new { width = 80, height = 6 },
                            properties = new
                            {
                                content = "{{companyName ?? \"\"}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#4b5563",
                                textAlign = "left",
                            },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "companyName", @operator = "is_not_empty" },
                                },
                            },
                        },
                        // Status Badge - PAID (conditional)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 160, y = 10 },
                            size = new { width = 30, height = 10 },
                            properties = new
                            {
                                content = "PAID",
                                fontSize = 12,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#059669",
                                backgroundColor = "#d1fae5",
                                textAlign = "center",
                            },
                            style = new { borderRadius = 4, padding = 2 },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "isPaid", @operator = "is_true" },
                                },
                            },
                        },
                        // Status Badge - UNPAID (conditional)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 160, y = 10 },
                            size = new { width = 30, height = 10 },
                            properties = new
                            {
                                content = "UNPAID",
                                fontSize = 12,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#dc2626",
                                backgroundColor = "#fee2e2",
                                textAlign = "center",
                            },
                            style = new { borderRadius = 4, padding = 2 },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "isPaid", @operator = "is_false" },
                                },
                            },
                        },
                        // Items Header
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 85 },
                            size = new { width = 180, height = 8 },
                            properties = new
                            {
                                content = "Description                                          Qty        Price         Amount",
                                fontSize = 10,
                                fontFamily = "JetBrains Mono",
                                fontWeight = "semibold",
                                color = "#6b7280",
                                backgroundColor = "#f3f4f6",
                                textAlign = "left",
                            },
                            style = new { padding = 2 },
                        },
                        // Line Items (using each loop)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 95 },
                            size = new { width = 180, height = 40 },
                            properties = new
                            {
                                content = "{{#each items}}\n{{this.name}}                                                  {{this.qty}}          {{this.price}}        {{this.total}}\n{{/each}}",
                                fontSize = 10,
                                fontFamily = "JetBrains Mono",
                                fontWeight = "normal",
                                color = "#374151",
                                lineHeight = 1.8,
                                textAlign = "left",
                            },
                        },
                        // Subtotal
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 120, y = 145 },
                            size = new { width = 70, height = 7 },
                            properties = new
                            {
                                content = "Subtotal: {{subtotal}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#4b5563",
                                textAlign = "right",
                            },
                        },
                        // Discount Line (conditional - only show if hasDiscount)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 120, y = 153 },
                            size = new { width = 70, height = 7 },
                            properties = new
                            {
                                content = "Discount ({{discount}}%): -{{discountAmount}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#059669",
                                textAlign = "right",
                            },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "hasDiscount", @operator = "is_true" },
                                },
                            },
                        },
                        // Tax
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 120, y = 161 },
                            size = new { width = 70, height = 7 },
                            properties = new
                            {
                                content = "Tax ({{taxRate}}%): {{taxAmount}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#4b5563",
                                textAlign = "right",
                            },
                        },
                        // Total
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 120, y = 172 },
                            size = new { width = 70, height = 10 },
                            properties = new
                            {
                                content = "Total: {{total}}",
                                fontSize = 16,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#1f2937",
                                textAlign = "right",
                            },
                        },
                        // Payment Instructions (conditional - only show if not paid)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 200 },
                            size = new { width = 180, height = 25 },
                            properties = new
                            {
                                content = "{{#unless isPaid}}\n⚠️ Payment is due by {{dueDate:MMMM d, yyyy}}.\n\nPlease make payment to:\nBank: First National Bank\nAccount: 1234567890\nRouting: 021000021\n{{/unless}}",
                                fontSize = 10,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#b45309",
                                backgroundColor = "#fef3c7",
                                lineHeight = 1.5,
                                textAlign = "left",
                            },
                            style = new { padding = 3, borderRadius = 4 },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "isPaid", @operator = "is_false" },
                                },
                            },
                        },
                        // Thank You Message (conditional - only show if paid)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 200 },
                            size = new { width = 180, height = 10 },
                            properties = new
                            {
                                content = "✅ Thank you for your payment!",
                                fontSize = 12,
                                fontFamily = "Inter",
                                fontWeight = "medium",
                                color = "#059669",
                                textAlign = "center",
                            },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "isPaid", @operator = "is_true" },
                                },
                            },
                        },
                        // Notes Section
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 235 },
                            size = new { width = 180, height = 15 },
                            properties = new
                            {
                                content = "Notes: {{notes ?? \"No additional notes.\"}}",
                                fontSize = 10,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#6b7280",
                                lineHeight = 1.4,
                                textAlign = "left",
                            },
                        },
                    },
                    pageSettings = new { predefinedSize = "a4", orientation = "portrait" },
                },
            },
            headerFooter = new
            {
                defaultHeader = new { height = 0, components = Array.Empty<object>() },
                defaultFooter = new
                {
                    height = 15,
                    components = new object[]
                    {
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 3 },
                            size = new { width = 180, height = 6 },
                            properties = new
                            {
                                content = "Page {{pageNumber}} of {{totalPages}} | Generated: {{datetime}}",
                                fontSize = 8,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#9ca3af",
                                textAlign = "center",
                            },
                        },
                    },
                },
            },
            variables = new { },
            variableDefinitions = new object[]
            {
                new
                {
                    name = "invoiceNumber",
                    type = "string",
                    label = "Invoice Number",
                    required = true,
                    order = 0,
                    isComputed = false,
                },
                new
                {
                    name = "invoiceDate",
                    type = "date",
                    label = "Invoice Date",
                    required = true,
                    format = "MM/dd/yyyy",
                    order = 1,
                    isComputed = false,
                },
                new
                {
                    name = "dueDate",
                    type = "date",
                    label = "Due Date",
                    required = true,
                    format = "MM/dd/yyyy",
                    order = 2,
                    isComputed = false,
                },
                new
                {
                    name = "customerName",
                    type = "string",
                    label = "Customer Name",
                    required = true,
                    order = 3,
                    isComputed = false,
                },
                new
                {
                    name = "companyName",
                    type = "string",
                    label = "Company Name",
                    required = false,
                    order = 4,
                    isComputed = false,
                },
                new
                {
                    name = "isPaid",
                    type = "boolean",
                    label = "Is Paid?",
                    required = true,
                    defaultValue = "false",
                    order = 5,
                    isComputed = false,
                },
                new
                {
                    name = "hasDiscount",
                    type = "boolean",
                    label = "Has Discount?",
                    required = false,
                    defaultValue = "false",
                    order = 6,
                    isComputed = false,
                },
                new
                {
                    name = "discount",
                    type = "number",
                    label = "Discount %",
                    required = false,
                    defaultValue = "0",
                    order = 7,
                    isComputed = false,
                },
                new
                {
                    name = "discountAmount",
                    type = "currency",
                    label = "Discount Amount",
                    required = false,
                    order = 8,
                    isComputed = false,
                },
                new
                {
                    name = "taxRate",
                    type = "number",
                    label = "Tax Rate %",
                    required = false,
                    defaultValue = "8.25",
                    order = 9,
                    isComputed = false,
                },
                new
                {
                    name = "taxAmount",
                    type = "currency",
                    label = "Tax Amount",
                    required = false,
                    order = 10,
                    isComputed = false,
                },
                new
                {
                    name = "subtotal",
                    type = "currency",
                    label = "Subtotal",
                    required = true,
                    order = 11,
                    isComputed = false,
                },
                new
                {
                    name = "total",
                    type = "currency",
                    label = "Total",
                    required = true,
                    order = 12,
                    isComputed = false,
                },
                new
                {
                    name = "notes",
                    type = "string",
                    label = "Notes",
                    required = false,
                    order = 13,
                    isComputed = false,
                },
                new
                {
                    name = "items",
                    type = "array",
                    label = "Line Items",
                    required = true,
                    order = 14,
                    isComputed = false,
                    itemSchema = new object[]
                    {
                        new
                        {
                            name = "name",
                            type = "string",
                            label = "Item Name",
                            required = true,
                            order = 0,
                            isComputed = false,
                        },
                        new
                        {
                            name = "qty",
                            type = "number",
                            label = "Quantity",
                            required = true,
                            order = 1,
                            isComputed = false,
                        },
                        new
                        {
                            name = "price",
                            type = "currency",
                            label = "Unit Price",
                            required = true,
                            order = 2,
                            isComputed = false,
                        },
                        new
                        {
                            name = "total",
                            type = "currency",
                            label = "Line Total",
                            required = true,
                            order = 3,
                            isComputed = false,
                        },
                    },
                },
            },
            settings = new
            {
                predefinedSize = "a4",
                orientation = "portrait",
                backgroundColor = "#FFFFFF",
                contentDirection = "ltr",
                margins = new
                {
                    top = 0,
                    right = 0,
                    bottom = 0,
                    left = 0,
                },
            },
        };

        return new Template
        {
            Id = Guid.NewGuid(),
            Name = "Professional Invoice",
            Description =
                "A complete invoice template with variables, conditional status badges, discount handling, and payment instructions. Demonstrates ternary operators, conditionals, and loops.",
            Category = "business",
            Content = JsonSerializer.Serialize(
                content,
                new JsonSerializerOptions { WriteIndented = false }
            ),
            IsBuiltIn = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    /// <summary>
    /// Creates a simple letter template with basic variables.
    /// </summary>
    private static Template CreateSimpleLetterTemplate()
    {
        var content = new
        {
            id = Guid.NewGuid().ToString(),
            title = "Simple Letter",
            createdAt = DateTime.UtcNow.ToString("O"),
            updatedAt = DateTime.UtcNow.ToString("O"),
            pages = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    pageNumber = 1,
                    headerType = "default",
                    footerType = "default",
                    components = new object[]
                    {
                        // Date
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 10 },
                            size = new { width = 80, height = 7 },
                            properties = new
                            {
                                content = "{{currentDate:MMMM D, YYYY}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#374151",
                                textAlign = "left",
                            },
                        },
                        // Recipient Name
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 30 },
                            size = new { width = 100, height = 7 },
                            properties = new
                            {
                                content = "{{recipientName}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#374151",
                                textAlign = "left",
                            },
                        },
                        // Recipient Company (conditional)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 38 },
                            size = new { width = 100, height = 7 },
                            properties = new
                            {
                                content = "{{recipientCompany}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#374151",
                                textAlign = "left",
                            },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new
                                    {
                                        variable = "recipientCompany",
                                        @operator = "is_not_empty",
                                    },
                                },
                            },
                        },
                        // Greeting
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 60 },
                            size = new { width = 100, height = 7 },
                            properties = new
                            {
                                content = "Dear {{recipientName}},",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#374151",
                                textAlign = "left",
                            },
                        },
                        // Body
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 75 },
                            size = new { width = 180, height = 80 },
                            properties = new
                            {
                                content = "{{letterBody}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#374151",
                                lineHeight = 1.6,
                                textAlign = "left",
                            },
                        },
                        // Closing
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 170 },
                            size = new { width = 60, height = 7 },
                            properties = new
                            {
                                content = "{{closing ?? \"Sincerely\"}},",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#374151",
                                textAlign = "left",
                            },
                        },
                        // Sender Name
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 190 },
                            size = new { width = 80, height = 7 },
                            properties = new
                            {
                                content = "{{senderName}}",
                                fontSize = 11,
                                fontFamily = "Inter",
                                fontWeight = "medium",
                                color = "#374151",
                                textAlign = "left",
                            },
                        },
                        // Sender Title (conditional)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 198 },
                            size = new { width = 80, height = 6 },
                            properties = new
                            {
                                content = "{{senderTitle}}",
                                fontSize = 10,
                                fontFamily = "Inter",
                                fontWeight = "normal",
                                color = "#6b7280",
                                textAlign = "left",
                            },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "senderTitle", @operator = "is_not_empty" },
                                },
                            },
                        },
                    },
                    pageSettings = new { predefinedSize = "a4", orientation = "portrait" },
                },
            },
            headerFooter = new
            {
                defaultHeader = new { height = 0, components = Array.Empty<object>() },
                defaultFooter = new { height = 0, components = Array.Empty<object>() },
            },
            variables = new { },
            variableDefinitions = new object[]
            {
                new
                {
                    name = "currentDate",
                    type = "date",
                    label = "Letter Date",
                    required = true,
                    format = "MMMM D, YYYY",
                    order = 0,
                    isComputed = false,
                },
                new
                {
                    name = "recipientName",
                    type = "string",
                    label = "Recipient Name",
                    required = true,
                    order = 1,
                    isComputed = false,
                },
                new
                {
                    name = "recipientCompany",
                    type = "string",
                    label = "Recipient Company",
                    required = false,
                    order = 2,
                    isComputed = false,
                },
                new
                {
                    name = "letterBody",
                    type = "string",
                    label = "Letter Body",
                    required = true,
                    description = "Main content of the letter",
                    order = 3,
                    isComputed = false,
                },
                new
                {
                    name = "closing",
                    type = "string",
                    label = "Closing",
                    required = false,
                    defaultValue = "Sincerely",
                    order = 4,
                    isComputed = false,
                },
                new
                {
                    name = "senderName",
                    type = "string",
                    label = "Your Name",
                    required = true,
                    order = 5,
                    isComputed = false,
                },
                new
                {
                    name = "senderTitle",
                    type = "string",
                    label = "Your Title",
                    required = false,
                    order = 6,
                    isComputed = false,
                },
            },
            settings = new
            {
                predefinedSize = "a4",
                orientation = "portrait",
                backgroundColor = "#FFFFFF",
                contentDirection = "ltr",
                margins = new
                {
                    top = 0,
                    right = 0,
                    bottom = 0,
                    left = 0,
                },
            },
        };

        return new Template
        {
            Id = Guid.NewGuid(),
            Name = "Simple Letter",
            Description =
                "A basic business letter template with variables for recipient, body, and sender information. Includes conditional fields for company and title.",
            Category = "business",
            Content = JsonSerializer.Serialize(
                content,
                new JsonSerializerOptions { WriteIndented = false }
            ),
            IsBuiltIn = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    /// <summary>
    /// Creates a demo template showcasing all conditional and variable features.
    /// </summary>
    private static Template CreateConditionalDemoTemplate()
    {
        var content = new
        {
            id = Guid.NewGuid().ToString(),
            title = "Variable & Condition Demo",
            createdAt = DateTime.UtcNow.ToString("O"),
            updatedAt = DateTime.UtcNow.ToString("O"),
            pages = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    pageNumber = 1,
                    headerType = "default",
                    footerType = "default",
                    components = new object[]
                    {
                        // Title
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 10 },
                            size = new { width = 180, height = 12 },
                            properties = new
                            {
                                content = "Variable & Conditional Demo",
                                fontSize = 22,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#1f2937",
                                textAlign = "center",
                            },
                        },
                        // Section 1: Simple Variables
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 30 },
                            size = new { width = 180, height = 8 },
                            properties = new
                            {
                                content = "1️⃣ Simple Variables",
                                fontSize = 14,
                                fontFamily = "Inter",
                                fontWeight = "semibold",
                                color = "#3b82f6",
                                textAlign = "left",
                            },
                        },
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 40 },
                            size = new { width = 180, height = 30 },
                            properties = new
                            {
                                content = "Name: {{userName}}\nEmail: {{userEmail}}\nAmount: ${{amount}}",
                                fontSize = 11,
                                fontFamily = "JetBrains Mono",
                                fontWeight = "normal",
                                color = "#374151",
                                lineHeight = 1.6,
                                textAlign = "left",
                            },
                        },
                        // Section 2: Formatted Variables
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 75 },
                            size = new { width = 180, height = 8 },
                            properties = new
                            {
                                content = "2️⃣ Formatted Variables",
                                fontSize = 14,
                                fontFamily = "Inter",
                                fontWeight = "semibold",
                                color = "#8b5cf6",
                                textAlign = "left",
                            },
                        },
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 85 },
                            size = new { width = 180, height = 30 },
                            properties = new
                            {
                                content = "Short Date: {{eventDate:MM/DD/YYYY}}\nLong Date: {{eventDate:MMMM D, YYYY}}\nYear Only: {{eventDate:YYYY}}",
                                fontSize = 11,
                                fontFamily = "JetBrains Mono",
                                fontWeight = "normal",
                                color = "#374151",
                                lineHeight = 1.6,
                                textAlign = "left",
                            },
                        },
                        // Section 3: Ternary Operator
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 120 },
                            size = new { width = 180, height = 8 },
                            properties = new
                            {
                                content = "3️⃣ Ternary Operator (inline if/else)",
                                fontSize = 14,
                                fontFamily = "Inter",
                                fontWeight = "semibold",
                                color = "#059669",
                                textAlign = "left",
                            },
                        },
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 130 },
                            size = new { width = 180, height = 25 },
                            properties = new
                            {
                                content = "Status: {{isActive ? \"✅ Active\" : \"❌ Inactive\"}}\nMembership: {{isPremium ? \"Premium Member\" : \"Free User\"}}",
                                fontSize = 11,
                                fontFamily = "JetBrains Mono",
                                fontWeight = "normal",
                                color = "#374151",
                                lineHeight = 1.6,
                                textAlign = "left",
                            },
                        },
                        // Section 4: Null Coalescing
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 160 },
                            size = new { width = 180, height = 8 },
                            properties = new
                            {
                                content = "4️⃣ Null Coalescing (default values)",
                                fontSize = 14,
                                fontFamily = "Inter",
                                fontWeight = "semibold",
                                color = "#ea580c",
                                textAlign = "left",
                            },
                        },
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 170 },
                            size = new { width = 180, height = 25 },
                            properties = new
                            {
                                content = "Nickname: {{nickname ?? \"No nickname set\"}}\nBio: {{bio ?? \"This user hasn't written a bio yet.\"}}",
                                fontSize = 11,
                                fontFamily = "JetBrains Mono",
                                fontWeight = "normal",
                                color = "#374151",
                                lineHeight = 1.6,
                                textAlign = "left",
                            },
                        },
                        // Section 5: Block Conditionals (visual)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 200 },
                            size = new { width = 180, height = 8 },
                            properties = new
                            {
                                content = "5️⃣ Block Conditionals (component visibility)",
                                fontSize = 14,
                                fontFamily = "Inter",
                                fontWeight = "semibold",
                                color = "#dc2626",
                                textAlign = "left",
                            },
                        },
                        // Active user badge (conditional)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 212 },
                            size = new { width = 50, height = 10 },
                            properties = new
                            {
                                content = "🟢 ACTIVE",
                                fontSize = 12,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#059669",
                                backgroundColor = "#d1fae5",
                                textAlign = "center",
                            },
                            style = new { borderRadius = 4, padding = 2 },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "isActive", @operator = "is_true" },
                                },
                            },
                        },
                        // Inactive user badge (conditional)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 212 },
                            size = new { width = 50, height = 10 },
                            properties = new
                            {
                                content = "🔴 INACTIVE",
                                fontSize = 12,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#dc2626",
                                backgroundColor = "#fee2e2",
                                textAlign = "center",
                            },
                            style = new { borderRadius = 4, padding = 2 },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "isActive", @operator = "is_false" },
                                },
                            },
                        },
                        // Premium badge (conditional)
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 65, y = 212 },
                            size = new { width = 50, height = 10 },
                            properties = new
                            {
                                content = "⭐ PREMIUM",
                                fontSize = 12,
                                fontFamily = "Inter",
                                fontWeight = "bold",
                                color = "#7c3aed",
                                backgroundColor = "#ede9fe",
                                textAlign = "center",
                            },
                            style = new { borderRadius = 4, padding = 2 },
                            condition = new
                            {
                                enabled = true,
                                logic = "all",
                                rules = new[]
                                {
                                    new { variable = "isPremium", @operator = "is_true" },
                                },
                            },
                        },
                        // Section 6: Built-in Variables
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "text-label",
                            position = new { x = 10, y = 235 },
                            size = new { width = 180, height = 8 },
                            properties = new
                            {
                                content = "6️⃣ Built-in Variables",
                                fontSize = 14,
                                fontFamily = "Inter",
                                fontWeight = "semibold",
                                color = "#0891b2",
                                textAlign = "left",
                            },
                        },
                        new
                        {
                            id = Guid.NewGuid().ToString(),
                            type = "paragraph",
                            position = new { x = 10, y = 245 },
                            size = new { width = 180, height = 35 },
                            properties = new
                            {
                                content = "Page: {{pageNumber}} of {{totalPages}}\nGenerated: {{datetime}}\nYear: {{year}}",
                                fontSize = 11,
                                fontFamily = "JetBrains Mono",
                                fontWeight = "normal",
                                color = "#374151",
                                lineHeight = 1.6,
                                textAlign = "left",
                            },
                        },
                    },
                    pageSettings = new { predefinedSize = "a4", orientation = "portrait" },
                },
            },
            headerFooter = new
            {
                defaultHeader = new { height = 0, components = Array.Empty<object>() },
                defaultFooter = new { height = 0, components = Array.Empty<object>() },
            },
            variables = new { },
            variableDefinitions = new object[]
            {
                new
                {
                    name = "userName",
                    type = "string",
                    label = "User Name",
                    required = true,
                    defaultValue = "John Doe",
                    order = 0,
                    isComputed = false,
                },
                new
                {
                    name = "userEmail",
                    type = "string",
                    label = "Email",
                    required = true,
                    defaultValue = "john@example.com",
                    order = 1,
                    isComputed = false,
                },
                new
                {
                    name = "amount",
                    type = "number",
                    label = "Amount",
                    required = true,
                    defaultValue = "1250.50",
                    order = 2,
                    isComputed = false,
                },
                new
                {
                    name = "eventDate",
                    type = "date",
                    label = "Event Date",
                    required = true,
                    order = 3,
                    isComputed = false,
                },
                new
                {
                    name = "isActive",
                    type = "boolean",
                    label = "Is Active?",
                    required = true,
                    defaultValue = "true",
                    order = 4,
                    isComputed = false,
                },
                new
                {
                    name = "isPremium",
                    type = "boolean",
                    label = "Is Premium?",
                    required = true,
                    defaultValue = "false",
                    order = 5,
                    isComputed = false,
                },
                new
                {
                    name = "nickname",
                    type = "string",
                    label = "Nickname",
                    required = false,
                    description = "Leave empty to test null coalescing",
                    order = 6,
                    isComputed = false,
                },
                new
                {
                    name = "bio",
                    type = "string",
                    label = "Bio",
                    required = false,
                    description = "Leave empty to test null coalescing",
                    order = 7,
                    isComputed = false,
                },
            },
            settings = new
            {
                predefinedSize = "a4",
                orientation = "portrait",
                backgroundColor = "#FFFFFF",
                contentDirection = "ltr",
                margins = new
                {
                    top = 0,
                    right = 0,
                    bottom = 0,
                    left = 0,
                },
            },
        };

        return new Template
        {
            Id = Guid.NewGuid(),
            Name = "Variable & Condition Demo",
            Description =
                "A comprehensive demo showcasing all variable syntax features: simple variables, formatted dates, ternary operators, null coalescing, component-level conditionals, and built-in variables.",
            Category = "demo",
            Content = JsonSerializer.Serialize(
                content,
                new JsonSerializerOptions { WriteIndented = false }
            ),
            IsBuiltIn = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }
}
