import { z } from "zod";

// Product option value schema
export const productOptionValueSchema = z.object({
  label: z.string(),
  value: z.string(),
  priceModifier: z.number().optional(),
  description: z.string().optional(),
});

// Product option schema
export const productOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  type: z.enum(["select", "radio", "checkbox", "text", "textarea", "number", "size", "file"]),
  required: z.boolean(),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  values: z.array(productOptionValueSchema).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  displayOrder: z.number().optional(),
});

// Product configuration (user selection)
export const productConfigurationSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  selectedOptions: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  notes: z.string().max(1000).optional(),
});

// Filter params validation
export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  featured: z.enum(["true", "false"]).optional(),
  q: z.string().max(100).optional(),
});

// Sort params validation
export const productSortSchema = z.enum([
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "popular",
  "rating",
]).default("newest");

// Combined search params
export const productSearchParamsSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  featured: z.enum(["true", "false"]).optional(),
  q: z.string().max(100).optional(),
  sort: productSortSchema.optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type ProductConfiguration = z.infer<typeof productConfigurationSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
export type ProductSort = z.infer<typeof productSortSchema>;
export type ProductSearchParams = z.infer<typeof productSearchParamsSchema>;

// Validate configuration against product options
export function validateConfiguration(
  config: ProductConfiguration,
  options: z.infer<typeof productOptionSchema>[],
  minOrder: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate quantity
  if (config.quantity < minOrder) {
    errors.push(`Minimum order adalah ${minOrder}`);
  }

  // Validate required options
  for (const option of options) {
    if (option.required) {
      const value = config.selectedOptions[option.key];
      if (value === undefined || value === null || value === "") {
        errors.push(`${option.name} wajib diisi`);
      }
    }

    // Validate select/radio options have valid values
    if ((option.type === "select" || option.type === "radio") && option.values) {
      const value = config.selectedOptions[option.key];
      if (value !== undefined && value !== "") {
        const validValues = option.values.map(v => v.value);
        if (!validValues.includes(String(value))) {
          errors.push(`Nilai ${option.name} tidak valid`);
        }
      }
    }

    // Validate number options
    if (option.type === "number" && option.validation) {
      const value = config.selectedOptions[option.key];
      if (value !== undefined) {
        const numValue = Number(value);
        if (option.validation.min !== undefined && numValue < option.validation.min) {
          errors.push(`${option.name} minimal ${option.validation.min}`);
        }
        if (option.validation.max !== undefined && numValue > option.validation.max) {
          errors.push(`${option.name} maksimal ${option.validation.max}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Calculate price with options
export function calculateTotalPrice(
  basePrice: number,
  quantity: number,
  selectedOptions: Record<string, unknown>,
  options: z.infer<typeof productOptionSchema>[]
): { unitPrice: number; subtotal: number; breakdown: { label: string; amount: number }[] } {
  let unitPrice = basePrice;
  const breakdown: { label: string; amount: number }[] = [
    { label: "Harga Dasar", amount: basePrice },
  ];

  for (const option of options) {
    if (option.type === "select" || option.type === "radio") {
      const selectedValue = selectedOptions[option.key];
      if (selectedValue && option.values) {
        const optionValue = option.values.find(v => v.value === selectedValue);
        if (optionValue?.priceModifier) {
          unitPrice += optionValue.priceModifier;
          breakdown.push({
            label: `${option.name}: ${optionValue.label}`,
            amount: optionValue.priceModifier,
          });
        }
      }
    }
  }

  const subtotal = unitPrice * quantity;

  return { unitPrice, subtotal, breakdown };
}
