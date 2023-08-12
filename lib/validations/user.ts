import * as z from 'zod';

export const userValidation = z.object({
    profile_photo: z.string().url().nonempty(),
    name: z.string().min(3).max(70),
    username: z.string().min(3).max(70),
    bio: z.string().min(1).max(1000),
});