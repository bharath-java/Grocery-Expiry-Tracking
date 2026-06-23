class AIPredictor {
  static int predictExpiryDays(String itemName, String category) {
    final name = itemName.toLowerCase().trim();

    if (name.contains('milk')) return 7;
    if (name.contains('yogurt') || name.contains('curd')) return 10;
    if (name.contains('cheese')) return 21;
    if (name.contains('butter')) return 30;
    if (name.contains('egg')) return 14;
    if (name.contains('bread') || name.contains('toast') || name.contains('croissant')) return 5;
    if (name.contains('chicken') || name.contains('poultry')) return 3;
    if (name.contains('fish') || name.contains('salmon') || name.contains('tuna')) return 2;
    if (name.contains('beef') || name.contains('pork') || name.contains('meat')) return 4;
    if (name.contains('banana')) return 6;
    if (name.contains('apple')) return 15;
    if (name.contains('orange') || name.contains('lemon')) return 14;
    if (name.contains('spinach') || name.contains('lettuce') || name.contains('cabbage')) return 4;
    if (name.contains('tomato') || name.contains('potato') || name.contains('onion')) return 20;
    if (name.contains('juice') || name.contains('soda')) return 14;
    if (name.contains('cookie') || name.contains('biscuit') || name.contains('chip')) return 60;
    if (name.contains('rice') || name.contains('pasta')) return 365;

    switch (category) {
      case 'Dairy & Eggs': return 10;
      case 'Fruits & Vegetables': return 7;
      case 'Bakery': return 5;
      case 'Meat & Fish': return 3;
      case 'Pantry': return 180;
      case 'Beverages': return 90;
      case 'Snacks': return 45;
      default: return 14;
    }
  }
}
