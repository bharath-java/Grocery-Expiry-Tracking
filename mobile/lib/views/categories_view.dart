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
    {'name': 'Dairy & Eggs', 'icon': Icons.egg_outlined, 'color': Colors.amber},
    {'name': 'Fruits & Vegetables', 'icon': Icons.eco_outlined, 'color': Colors.green},
    {'name': 'Bakery', 'icon': Icons.bakery_dining_outlined, 'color': Colors.brown},
    {'name': 'Meat & Fish', 'icon': Icons.kebab_dining_outlined, 'color': Colors.red},
    {'name': 'Pantry', 'icon': Icons.kitchen_outlined, 'color': Colors.teal},
    {'name': 'Beverages', 'icon': Icons.local_drink_outlined, 'color': Colors.blue},
    {'name': 'Snacks', 'icon': Icons.cookie_outlined, 'color': Colors.deepOrange},
    {'name': 'Others', 'icon': Icons.shopping_basket_outlined, 'color': Colors.blueGrey},
  ];

  @override
  Widget build(BuildContext context) {
    final groceryProvider = Provider.of<GroceryProvider>(context);

    // If a category is selected, show filtered list; otherwise show grid
    if (_selectedCategory != null) {
      final List<GroceryItem> filteredList = groceryProvider.groceries
          .where((e) => e.category == _selectedCategory)
          .toList();

      return Scaffold(
        appBar: AppBar(
          title: Text(_selectedCategory!),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              setState(() {
                _selectedCategory = null;
              });
            },
          ),
        ),
        body: filteredList.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.category_outlined, size: 64, color: Colors.grey.withOpacity(0.5)),
                    const SizedBox(height: 16),
                    const Text('No items in this category.', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: filteredList.length,
                itemBuilder: (context, index) {
                  final item = filteredList[index];
                  final formattedDate = DateFormat('MMM dd, yyyy').format(item.expiryDate);
                  
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                    child: ListTile(
                      title: Text(item.itemName, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Expiry: $formattedDate'),
                      trailing: Text(item.quantity, style: const TextStyle(fontWeight: FontWeight.bold)),
                      onTap: () {
                        Navigator.pushNamed(context, '/add-grocery', arguments: item);
                      },
                    ),
                  );
                },
              ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.1,
        ),
        itemCount: _categoriesList.length,
        itemBuilder: (context, index) {
          final cat = _categoriesList[index];
          final String catName = cat['name'];
          final IconData icon = cat['icon'];
          final Color color = cat['color'];

          // Count active items matching this category
          final itemCount = groceryProvider.groceries.where((e) => e.category == catName).length;

          return Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: Colors.grey.withOpacity(0.15)),
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
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: color, size: 28),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      catName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$itemCount items',
                      style: TextStyle(color: Colors.grey[500], fontSize: 11),
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
