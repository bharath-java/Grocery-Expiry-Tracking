import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password is too short')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    type: z.enum(['register', 'reset'])
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

export const grocerySchema = z.object({
  body: z.object({
    itemName: z.string().min(1, 'Item name is required'),
    category: z.enum(['Dairy & Eggs', 'Fruits & Vegetables', 'Bakery', 'Meat & Fish', 'Pantry', 'Beverages', 'Snacks', 'Others']),
    quantity: z.string().min(1, 'Quantity is required'),
    purchaseDate: z.string().or(z.date()).transform((val) => new Date(val)),
    expiryDate: z.string().or(z.date()).transform((val) => new Date(val)),
    notes: z.string().optional(),
    brand: z.string().optional()
  })
});
