export interface PosterProduct {
  id: string;
  name: string;
  price: number;
  unit: string;

  internalId?: string;
  originalPrice: number;
  showOriginalPrice?: boolean;

  // Promo fields
  promoType?: number;
  qtdPromocao?: number;
  qtdPagar?: number;

  // Code info
  code?: string;
  ean?: string;
}
