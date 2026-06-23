class GroceryItem {
  final String id;
  final String itemName;
  final String image;
  final String brand;
  final String category;
  final String quantity;
  final DateTime purchaseDate;
  final DateTime expiryDate;
  final String notes;
  final String status;
  final bool archived;
  final DateTime createdAt;

  GroceryItem({
    required this.id,
    required this.itemName,
    this.image = '',
    this.brand = '',
    required this.category,
    required this.quantity,
    required this.purchaseDate,
    required this.expiryDate,
    this.notes = '',
    required this.status,
    required this.archived,
    required this.createdAt,
  });

  factory GroceryItem.fromJson(Map<String, dynamic> json) {
    return GroceryItem(
      id: json['_id'] ?? json['id'] ?? '',
      itemName: json['itemName'] ?? '',
      image: json['image'] ?? '',
      brand: json['brand'] ?? '',
      category: json['category'] ?? 'Others',
      quantity: json['quantity'] ?? '',
      purchaseDate: json['purchaseDate'] != null 
          ? DateTime.parse(json['purchaseDate']) 
          : DateTime.now(),
      expiryDate: json['expiryDate'] != null 
          ? DateTime.parse(json['expiryDate']) 
          : DateTime.now(),
      notes: json['notes'] ?? '',
      status: json['status'] ?? 'Fresh',
      archived: json['archived'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'itemName': itemName,
      'image': image,
      'brand': brand,
      'category': category,
      'quantity': quantity,
      'purchaseDate': purchaseDate.toIso8601String(),
      'expiryDate': expiryDate.toIso8601String(),
      'notes': notes,
      'status': status,
      'archived': archived,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // Calculate days remaining till expiry
  int get daysRemaining {
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    final exp = DateTime(expiryDate.year, expiryDate.month, expiryDate.day);
    return exp.difference(today).inDays;
  }
}
