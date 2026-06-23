import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/grocery_provider.dart';
import '../../models/grocery_item.dart';
import 'package:intl/intl.dart';

class CategoriesView extends StatefulWidget {
  const CategoriesView({super.key});

  @override
  State<CategoriesView> createState() => _CategoriesViewState();
}

class _CategoriesViewState extends State<CategoriesView> {
  String? _selectedCategory;

  final List<Map<String, dynamic>> _categoriesList = [
    {'name': 'Dairy & Eggs', 'emoji': '🥛', 'color': Colors.amber},
    {'name': 'Fruits & Vegetables', 'emoji': '🍎', 'color': Colors.green},
    {'name': 'Bakery', 'emoji': '🍞', 'color': Colors.brown},
    {'name': 'Meat & Fish', 'emoji': '🥩', 'color': Colors.red},
    {'name': 'Pantry', 'emoji': '🥫', 'color': Colors.teal},
    {'name': 'Beverages', 'emoji': '🥤', 'color': Colors.blue},
    {'name': 'Snacks', 'emoji': '🍪', 'color': Colors.deepOrange},
    {'name': 'Others', 'emoji': '📦', 'color': Colors.blueGrey},
  ];

  int _getDaysLeft(DateTime expiryDate) {
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final expDate = DateTime(expiryDate.year, expiryDate.month, expiryDate.day);
    final diff = expDate.difference(todayDate);
    return diff.inDays;
  }

  @override
  Widget build(BuildContext context) {
    final groceryProvider = Provider.of<GroceryProvider>(context);

    if (_selectedCategory != null) {
      final List<GroceryItem> filteredList = groceryProvider.groceries
          .where((e) => e.category == _selectedCategory)
          .toList();

      return Scaffold(
        appBar: AppBar(
          title: Text(_selectedCategory!, style: const TextStyle(fontWeight: FontWeight.w900)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              setState(() {
                _selectedCategory = null;
              });
            },
          ),
          elevation: 0,
        ),
        body: filteredList.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('📂', style: TextStyle(fontSize: 48, color: Colors.grey.withOpacity(0.5))),
                    const SizedBox(height: 16),
                    const Text(
                      'NO ACTIVE ITEMS',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5),
                    ),
                  ],
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: filteredList.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = filteredList[index];
                  final formattedDate = DateFormat('d MMM yyyy').format(item.expiryDate);
                  final daysLeft = _getDaysLeft(item.expiryDate);

                  Color badgeColor = const Color(0xFF4CAF50);
                  if (item.status == 'Expired') {
                    badgeColor = const Color(0xFFEF5350);
                  } else if (item.status == 'Expiring Soon') {
                    badgeColor = const Color(0xFFFFA726);
                  }

                  String countdownText;
                  if (daysLeft < 0) {
                    countdownText = 'Expired';
                  } else if (daysLeft == 0) {
                    countdownText = 'Expires Today';
                  } else if (daysLeft == 1) {
                    countdownText = 'Tomorrow';
                  } else {
                    countdownText = '$daysLeft days';
                  }

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF1F5F9)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.itemName,
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Text(
                                    'Expiry: $formattedDate • Qty: ${item.quantity}',
                                    style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: badgeColor.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: badgeColor.withOpacity(0.2)),
                                    ),
                                    child: Text(
                                      countdownText,
                                      style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w900, color: badgeColor),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        // Actions
                        IconButton(
                          icon: const Icon(Icons.done, color: Colors.green, size: 20),
                          onPressed: () async {
                            final ok = await groceryProvider.archiveGrocery(item.id);
                            if (ok && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Item marked as consumed.'), backgroundColor: Colors.green),
                              );
                            }
                          },
                          tooltip: 'Consume & Archive',
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                          onPressed: () async {
                            final ok = await groceryProvider.deleteGrocery(item.id);
                            if (ok && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Item deleted successfully.'), backgroundColor: Colors.red),
                              );
                            }
                          },
                          tooltip: 'Delete',
                        ),
                      ],
                    ),
                  );
                },
              ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories', style: TextStyle(fontWeight: FontWeight.w900)),
        elevation: 0,
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.15,
        ),
        itemCount: _categoriesList.length,
        itemBuilder: (context, index) {
          final cat = _categoriesList[index];
          final String catName = cat['name'];
          final String emoji = cat['emoji'];
          final Color color = cat['color'];

          // Count active items matching this category
          final itemCount = groceryProvider.groceries.where((e) => e.category == catName).length;

          return Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFF1F5F9)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x02000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () {
                setState(() {
                  _selectedCategory = catName;
                });
              },
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.08),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        emoji,
                        style: const TextStyle(fontSize: 22),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      catName,
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12.5),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$itemCount active items',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
