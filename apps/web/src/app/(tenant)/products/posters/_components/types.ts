export interface PosterProduct {
  // Code info
  code?: string;
  ean?: string;
  id: string;

  internalId?: string;
  name: string;
  originalPrice: number;
  price: number;

  // Promo fields
  promoType?: number;
  qtdPagar?: number;
  qtdPromocao?: number;
  showOriginalPrice?: boolean;
  unit: string;
}
