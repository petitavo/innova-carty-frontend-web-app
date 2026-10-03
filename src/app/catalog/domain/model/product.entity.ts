export interface Product {
  /** SKU code, e.g. SKU-10021. */
  id: string;
  name: string;
  category: string;
  price: number;
  /** Grams. */
  nominalWeight: number;
  /** Percentage of the nominal weight accepted by the cart's weight check. */
  tolerance: number;
  rfidPrefix: string;
  icon: string;
  updatedAt: string;
}

export const PRODUCT_CATEGORIES = ['Bakery', 'Beverages', 'Dairy', 'Grocery', 'Household', 'Meat', 'Produce', 'Seafood'];

/** Weight range the cart accepts for one unit, in grams. */
export function allowedRange(nominalWeight: number, tolerance: number): { min: number; max: number } {
  const delta = (nominalWeight * tolerance) / 100;
  return { min: Math.round(nominalWeight - delta), max: Math.round(nominalWeight + delta) };
}
