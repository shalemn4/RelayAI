import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(4000, 'Message is too long'),
  metadata: z.record(z.any()).optional(),
});

export const FilterOperatorSchema = z.enum([
  'eq',
  'neq',
  'contains',
  'in',
  'gt',
  'lt',
  'between',
]);

export const FilterConditionSchema = z.object({
  id: z.string(),
  field: z.string().min(1, 'Field is required'),
  operator: FilterOperatorSchema,
  value: z.any().refine((v: any) => v !== undefined && v !== null && v !== '', {
    message: 'Condition value cannot be empty',
  }),
});

// Recursive FilterGroup Schema
export const FilterGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    operator: z.enum(['AND', 'OR']),
    conditions: z
      .array(z.union([FilterConditionSchema, FilterGroupSchema]))
      .min(1, 'A group must have at least one condition'),
  })
);

export const SaveFilterSchema = z.object({
  name: z.string().min(1, 'Filter name is required').max(60, 'Filter name must be under 60 characters'),
  ast: FilterGroupSchema,
  is_favorite: z.boolean().optional(),
});

export const LeadStageUpdateSchema = z.object({
  stage: z.enum(['new', 'contacted', 'qualified', 'demo', 'won', 'lost']),
  notes: z.string().optional(),
});

export const BulkLeadStageUpdateSchema = z.object({
  lead_ids: z.array(z.number()).min(1, 'Select at least one lead'),
  stage: z.enum(['new', 'contacted', 'qualified', 'demo', 'won', 'lost']),
});

export const FeedbackAISuggestionSchema = z.object({
  action: z.enum(['accept', 'reject', 'edit', 'regenerate']),
  original_text: z.string().optional(),
  final_text: z.string().optional(),
  feedback_reason: z.string().optional(),
});
