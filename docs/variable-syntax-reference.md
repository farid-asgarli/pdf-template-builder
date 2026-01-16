# Variable Syntax Reference

This document provides copy-paste examples for all variable expressions and conditional rules supported by the PDF Template Builder.

---

## 📋 Variables to Create

Before testing, create these variables in the Variable Manager:

| Name            | Type    | Sample Value                 |
| --------------- | ------- | ---------------------------- |
| `customerName`  | string  | John Smith                   |
| `companyName`   | string  | Acme Corp                    |
| `invoiceNumber` | string  | INV-2026-001                 |
| `amount`        | number  | 1250.50                      |
| `quantity`      | number  | 5                            |
| `price`         | number  | 250.10                       |
| `discount`      | number  | 10                           |
| `isPaid`        | boolean | true                         |
| `isOverdue`     | boolean | false                        |
| `hasDiscount`   | boolean | true                         |
| `invoiceDate`   | date    | 2026-01-16                   |
| `dueDate`       | date    | 2026-02-16                   |
| `notes`         | string  | Thank you for your business! |
| `items`         | array   | (see array section)          |

---

## 1️⃣ Simple Variables

Basic variable insertion - just wrap the variable name in double curly braces.

```
Hello, {{customerName}}!
```

**Output:** Hello, John Smith!

```
Invoice #{{invoiceNumber}} for {{companyName}}
```

**Output:** Invoice #INV-2026-001 for Acme Corp

```
Total Amount: ${{amount}}
```

**Output:** Total Amount: $1250.50

---

## 2️⃣ Built-in Variables

These are automatically available without creating them.

```
Page {{pageNumber}} of {{totalPages}}
```

**Output:** Page 1 of 5

```
Generated on: {{date}}
```

**Output:** Generated on: 01/16/2026

```
Current Year: {{year}}
```

**Output:** Current Year: 2026

```
Generated at: {{time}}
```

**Output:** Generated at: 14:30:45

```
Full timestamp: {{datetime}}
```

**Output:** Full timestamp: 01/16/2026 14:30:45

---

## 3️⃣ Formatted Variables

Add a format specifier after a colon for custom formatting.

### Date Formatting

> **Important:** Date format patterns use .NET conventions. Use lowercase `d` for day and `y` for year.
> Common aliases like `MM/DD/YYYY` are automatically converted to `MM/dd/yyyy`.

| Pattern              | Example Output             | Description        |
| -------------------- | -------------------------- | ------------------ |
| `MM/dd/yyyy`         | 01/15/2026                 | US format          |
| `dd/MM/yyyy`         | 15/01/2026                 | European format    |
| `yyyy-MM-dd`         | 2026-01-15                 | ISO format         |
| `MMMM d, yyyy`       | January 15, 2026           | Full month name    |
| `MMM d, yyyy`        | Jan 15, 2026               | Abbreviated month  |
| `dddd, MMMM d, yyyy` | Thursday, January 15, 2026 | Full date with day |

```
Invoice Date: {{invoiceDate:MM/dd/yyyy}}
```

**Output:** Invoice Date: 01/16/2026

```
Due: {{dueDate:MMMM D, YYYY}}
```

**Output:** Due: February 16, 2026

```
Short date: {{invoiceDate:DD-MMM-YY}}
```

**Output:** Short date: 16-Jan-26

### Number Formatting

```
Amount: {{amount:currency}}
```

**Output:** Amount: $1,250.50

```
Quantity: {{quantity:number}}
```

**Output:** Quantity: 5

```
Percentage: {{discount:percent}}
```

**Output:** Percentage: 10%

### Currency Objects

Currency values can be passed as objects with `value` and `currency` properties. They will be automatically formatted with the correct symbol.

**Input data:**

```json
{
  "subtotal": { "value": 500, "currency": "USD" },
  "total": { "value": 1800, "currency": "EUR" }
}
```

**Template:** (no `$` prefix needed!)

```
Subtotal: {{subtotal}}
Total: {{total}}
```

**Output:**

```
Subtotal: $500.00
Total: €1,800.00
```

**Supported Currency Codes:**
| Code | Symbol | Code | Symbol |
|------|--------|------|--------|
| USD | $ | EUR | € |
| GBP | £ | JPY | ¥ |
| CNY | ¥ | CAD | CA$ |
| AUD | A$ | CHF | CHF |
| INR | ₹ | KRW | ₩ |
| BRL | R$ | MXN | MX$ |

---

## 4️⃣ Conditional Expressions

### Ternary Operator (if ? then : else)

Show different text based on a condition.

```
Status: {{isPaid ? "PAID" : "UNPAID"}}
```

**Output (if isPaid=true):** Status: PAID  
**Output (if isPaid=false):** Status: UNPAID

```
Payment: {{isPaid ? "Thank you for your payment!" : "Please pay by the due date."}}
```

```
{{isOverdue ? "⚠️ OVERDUE" : "Current"}}
```

### Using Variables in Ternary

You can use variable names instead of strings:

```
Contact: {{isPaid ? customerName : companyName}}
```

---

## 5️⃣ Null Coalescing (??)

Provide a fallback value if the variable is null or undefined.

```
Notes: {{notes ?? "No notes provided"}}
```

**Output (if notes exists):** Notes: Thank you for your business!  
**Output (if notes is empty):** Notes: No notes provided

```
Company: {{companyName ?? "Individual Customer"}}
```

---

## 6️⃣ Elvis Operator (?:)

Similar to null coalescing, but also handles empty strings and zero values.

```
Discount: {{discount ?: "No discount applied"}}
```

**Output (if discount > 0):** Discount: 10  
**Output (if discount = 0):** Discount: No discount applied

---

## 7️⃣ Block Conditionals

### If Block

Show content only when a condition is true.

```
{{#if isPaid}}
✅ This invoice has been paid in full.
{{/if}}
```

```
{{#if hasDiscount}}
Discount Applied: {{discount}}%
{{/if}}
```

### Unless Block

Show content only when a condition is false (opposite of if).

```
{{#unless isPaid}}
⚠️ PAYMENT REQUIRED

Please remit payment by {{dueDate:MM/DD/YYYY}}.
{{/unless}}
```

```
{{#unless isOverdue}}
Thank you for your timely payment!
{{/unless}}
```

---

## 8️⃣ Loops (Each Block)

Iterate over array variables.

### Simple Array Loop

First, create an `items` array variable with this structure:

```json
[
  { "name": "Widget A", "qty": 2, "price": 100 },
  { "name": "Widget B", "qty": 1, "price": 250 },
  { "name": "Service Fee", "qty": 1, "price": 50 }
]
```

Then use:

```
{{#each items}}
- {{this.name}}: {{this.qty}} x ${{this.price}}
{{/each}}
```

**Output:**

- Widget A: 2 x $100
- Widget B: 1 x $250
- Service Fee: 1 x $50

### Loop Context Variables

Inside a loop, you have access to special variables:

```
{{#each items}}
{{@number}}. {{this.name}} (Index: {{@index}})
{{/each}}
```

| Variable      | Description                   |
| ------------- | ----------------------------- |
| `{{@index}}`  | Zero-based index (0, 1, 2...) |
| `{{@number}}` | One-based number (1, 2, 3...) |
| `{{@first}}`  | True if first item            |
| `{{@last}}`   | True if last item             |

### Using @first and @last

```
{{#each items}}
{{#if @first}}=== ITEMS START ===
{{/if}}
{{@number}}. {{this.name}}
{{#if @last}}=== ITEMS END ===
{{/if}}
{{/each}}
```

---

## 9️⃣ Combined Examples

### Invoice Header

```
INVOICE

Invoice #: {{invoiceNumber}}
Date: {{invoiceDate:MMMM D, YYYY}}
Due Date: {{dueDate:MMMM D, YYYY}}

Bill To:
{{customerName}}
{{companyName ?? ""}}

Status: {{isPaid ? "✅ PAID" : "⏳ PENDING"}}
```

### Invoice with Conditional Discount

```
Subtotal: ${{amount}}
{{#if hasDiscount}}
Discount ({{discount}}%): -${{discountAmount}}
{{/if}}
Total: ${{total}}
```

### Footer with Conditional Message

```
{{#if isPaid}}
Thank you for your payment!
{{/if}}
{{#unless isPaid}}
Please pay by {{dueDate:MM/DD/YYYY}} to avoid late fees.
{{/unless}}

Page {{pageNumber}} of {{totalPages}} | Generated: {{datetime}}
```

### Line Items Table

```
{{#each items}}
{{@number}}. {{this.name}}
   Quantity: {{this.qty}}
   Unit Price: ${{this.price}}
   Line Total: ${{this.total}}
{{#unless @last}}
---
{{/unless}}
{{/each}}
```

---

## 🧪 Quick Test Snippets

Copy these one at a time to test each feature:

### Test 1: Simple Variable

```
Customer: {{customerName}}
```

### Test 2: Built-in

```
Page {{pageNumber}} of {{totalPages}}
```

### Test 3: Formatted Date

```
Date: {{invoiceDate:MMMM D, YYYY}}
```

### Test 4: Ternary

```
{{isPaid ? "PAID" : "UNPAID"}}
```

### Test 5: Null Coalescing

```
{{notes ?? "No notes"}}
```

### Test 6: If Block

```
{{#if isPaid}}Payment received{{/if}}
```

### Test 7: Unless Block

```
{{#unless isPaid}}Payment pending{{/unless}}
```

### Test 8: Loop (requires items array)

```
{{#each items}}• {{this.name}}
{{/each}}
```

---

## ⚠️ Common Mistakes

| ❌ Wrong                  | ✅ Correct                     | Issue                            |
| ------------------------- | ------------------------------ | -------------------------------- |
| `{customerName}`          | `{{customerName}}`             | Missing double braces            |
| `{{ customerName }}`      | `{{customerName}}`             | Spaces inside braces             |
| `{{Customer Name}}`       | `{{customerName}}`             | Variable names can't have spaces |
| `{{#if isPaid}}...`       | `{{#if isPaid}}...{{/if}}`     | Missing closing tag              |
| `{{#each items}}{{name}}` | `{{#each items}}{{this.name}}` | Need `this.` prefix in loops     |

---

## 📝 Notes

- Variable names are **case-sensitive**: `CustomerName` ≠ `customerName`
- All variables must be defined before generating the PDF
- Undefined variables will show as empty or with an error indicator
- Date formats follow standard date formatting patterns (YYYY, MM, DD, etc.)
