export interface PosterProduct {
  // Code info
  code?: string;
  compoundItems?: Array<{
    description: string;
    quantity: number;
  }>;
  compoundItemsCount?: number;
  compoundTotalQuantity?: number;
  ean?: string;
  id: string;

  internalId?: string;
  isCompound?: boolean;
  name: string;
  originalPrice: number;
  price: number;

  // Promo fields
  promoType?: number;
  qtdPagar?: number;
  qtdPromocao?: number;
  showCompoundUnitInfo?: boolean;
  showOriginalPrice?: boolean;
  unit: string;
}
