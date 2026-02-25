import { z } from "zod";

export const vsnSchema = z.enum(["1.0.0", "2.0.0"]);
export type Vsn = z.infer<typeof vsnSchema>;

const positiveIntStr = z
  .string()
  .optional()
  .refine(
    (v) =>
      v === undefined ||
      v === "" ||
      (Number.isFinite(Number(v)) && Number(v) > 0),
    { message: "Must be a positive number" },
  );

export const realtimeClientSchema = z.object({
  url: z.string().min(1, "URL is required"),
  apiKey: z.string().min(1, "API key is required"),
  worker: z.boolean(),
  vsn: vsnSchema,
  timeout: positiveIntStr,
  heartbeatIntervalMs: positiveIntStr,
});

export type RealtimeClientFormValues = z.infer<typeof realtimeClientSchema>;
