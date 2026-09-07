import { z } from "zod";
export const initializeCheckoutSchema = z.object({ body: z.object({ tier: z.enum(["basic", "pro", "gold"]) }) });
