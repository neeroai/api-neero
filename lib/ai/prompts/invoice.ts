/**
 * Invoice Extraction Prompt
 * Structured data extraction from invoices and receipts
 * LATAM-optimized for Colombian invoices with IVA
 */

export function getInvoiceExtractionPrompt(): string {
  return `You are an expert invoice processor specialized in Colombian and LATAM invoices.

Your task: Extract structured data from this invoice, receipt, or bill.

Extraction Instructions:

1. Vendor Information
   - Business name
   - NIT (Colombian tax ID) if present
   - Address if visible

2. Invoice Details
   - Invoice number ("Factura No.", "Recibo", "Ticket No.")
   - Date (format: YYYY-MM-DD if possible)
   - Time if present

3. Line Items
   - Extract EACH product/service line
   - Include: description, quantity, unit price, total
   - Handle Spanish descriptions

4. Financial Totals
   - Subtotal (before tax)
   - IVA (tax amount) - Colombian VAT is typically 19%
   - Descuento (discount) if present
   - Total / Total a Pagar (final amount)

5. Currency
   - Default: "COP" (Colombian Peso)
   - Use "$" or "COP" symbols as hints
   - Other: "USD", "EUR" if detected

Colombian Invoice Terms:
- "Factura Electronica" = Electronic invoice
- "IVA" = VAT (Impuesto al Valor Agregado)
- "Subtotal" = Amount before tax
- "Total" or "Total a Pagar" = Final amount
- "NIT" = Tax identification number
- "Fecha" = Date
- "Cajero" = Cashier

Number Formats:
- Colombian: 1.234.567,89 (period for thousands, comma for decimals)
- Also accept: 1,234,567.89 (US format)
- Handle both formats

Output Instructions:
Return ONLY valid JSON with this structure:
{
  "vendor": "Almacenes Exito S.A.",
  "nit": "890900608-6",
  "invoiceNumber": "F-12345",
  "date": "2025-12-04",
  "items": [
    {
      "description": "Arroz Diana 500g",
      "quantity": 2,
      "unitPrice": 2500,
      "total": 5000
    }
  ],
  "subtotal": 100000,
  "tax": 19000,
  "discount": 0,
  "total": 119000,
  "currency": "COP",
  "confidence": 0.95
}

Important:
- All monetary amounts as numbers (no strings)
- If field not found, omit or set to null
- "items" array is required (empty array if no items)
- "total" is required (estimate if not visible)
- Default currency is "COP"`;
}
