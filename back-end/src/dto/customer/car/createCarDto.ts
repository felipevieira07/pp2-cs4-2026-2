export interface CreateCarDto {
  brand: string;
  model: string;
  color: string;
  year_manufacture: number;
  imported: boolean;
  plates: string;
  customer_id?: number | null;
}