/**
 * AI Expiry Prediction Module
 * Predicts estimated shelf-life in days based on itemName keywords and category.
 */
export const predictExpiryDays = (itemName: string, category: string): number => {
  const name = itemName.toLowerCase().trim();

  // Match key grocery items
  if (name.includes('milk')) return 7;
  if (name.includes('yogurt') || name.includes('curd')) return 10;
  if (name.includes('cheese')) return 21;
  if (name.includes('butter')) return 30;
  if (name.includes('egg')) return 14;
  if (name.includes('bread') || name.includes('toast') || name.includes('croissant')) return 5;
  if (name.includes('chicken') || name.includes('poultry')) return 3;
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) return 2;
  if (name.includes('beef') || name.includes('pork') || name.includes('meat')) return 4;
  if (name.includes('banana')) return 6;
  if (name.includes('apple')) return 15;
  if (name.includes('orange') || name.includes('lemon')) return 14;
  if (name.includes('spinach') || name.includes('lettuce') || name.includes('cabbage')) return 4;
  if (name.includes('tomato') || name.includes('potato') || name.includes('onion')) return 20;
  if (name.includes('juice') || name.includes('soda') || name.includes('cola')) return 14;
  if (name.includes('beer') || name.includes('wine')) return 120;
  if (name.includes('cookie') || name.includes('biscuit') || name.includes('chip')) return 60;
  if (name.includes('rice') || name.includes('pasta') || name.includes('flour')) return 365;

  // Fallbacks by Category
  switch (category) {
    case 'Dairy & Eggs':
      return 10;
    case 'Fruits & Vegetables':
      return 7;
    case 'Bakery':
      return 5;
    case 'Meat & Fish':
      return 3;
    case 'Pantry':
      return 180;
    case 'Beverages':
      return 90;
    case 'Snacks':
      return 45;
    default:
      return 14; // Default to 2 weeks
  }
};
