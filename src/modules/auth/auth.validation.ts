import { z } from 'zod';

abstract class AuthValidator {
  static signUp = z
    .strictObject({
      username: z.string().min(2),
      email: z.email(),
      password: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: "confirmPassword doesn't match password",
        });
      }
    });
}

export default AuthValidator;
