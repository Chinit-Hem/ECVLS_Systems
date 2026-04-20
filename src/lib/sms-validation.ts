import { z } from 'zod';
import type { SmsStatus } from './sms-types';

export const smsAssetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name too long'),
  itemCode: z.string().max(64, 'Item code too long').optional(),
  type: z.string().min(2, 'Type required').max(64, 'Type too long'),
  category: z.string().max(64, 'Category too long').optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be positive').max(999, 'Quantity too high'),
  location: z.string().max(128, 'Location too long').optional(),
  assignedTo: z.string().max(128, 'Assigned to too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  status: z.enum(['Available', 'In Use', 'Borrowed'] as [SmsStatus, ...SmsStatus[]]),
});

export type SmsAssetFormData = z.infer<typeof smsAssetSchema>;

export function validateAssetForm(data: any): { errors: Record<string, string[]>, isValid: boolean } {
  const result = smsAssetSchema.safeParse(data);
  if (result.success) return { errors: {}, isValid: true };
  
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path[0] as string;
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  });
  return { errors, isValid: false };
}

