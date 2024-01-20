import { z } from "zod";


function parseAndSetYear(dateString: string): Date {
  const [day, month] = dateString.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNumber = months.indexOf(month) + 1; // Months in JavaScript are 0-indexed

  return new Date(2023, monthNumber - 1, Number(day));
}

export const rowSchema = z.object({
  tanggal: z.string().transform((date) => parseAndSetYear(date)),
  companyName: z.string(),
  masuk: z.coerce.number(),
  keluar: z.coerce.number(),
})

export type RowSchema = z.infer<typeof rowSchema>

export const dataSchema = z.array(rowSchema)

export type DataSchema = z.infer<typeof dataSchema>
