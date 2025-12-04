import { z } from 'zod';

/**
 * Invoice line item schema
 */
export const InvoiceLineItemSchema = z.object({
  description: z.string().describe('Item or service description'),
  quantity: z.number().min(0).describe('Quantity of items'),
  unitPrice: z.number().describe('Price per unit'),
  total: z.number().describe('Total price for this line item'),
});

/**
 * Invoice extraction schema for receipts/invoices
 * Optimized for LATAM invoices (Colombia primary)
 */
export const InvoiceDataSchema = z.object({
  vendor: z.string().optional().describe('Vendor or merchant name'),

  nit: z.string().optional().describe('Colombian NIT (tax ID)'),

  invoiceNumber: z.string().optional().describe('Invoice or receipt number'),

  date: z.string().optional().describe('Invoice date (ISO 8601 format preferred)'),

  items: z.array(InvoiceLineItemSchema).describe('List of items or services on the invoice'),

  subtotal: z.number().optional().describe('Subtotal before tax'),

  tax: z.number().optional().describe('Tax amount (IVA in Colombia)'),

  discount: z.number().optional().describe('Discount amount if present'),

  total: z.number().describe('Total amount including tax'),

  currency: z.string().default('COP').describe('Currency code (default COP for Colombia)'),

  confidence: z.number().min(0).max(1).optional().describe('Confidence score for extraction (0-1)'),

  metadata: z
    .record(z.unknown())
    .optional()
    .describe('Additional invoice metadata or extracted fields'),
});

export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;
