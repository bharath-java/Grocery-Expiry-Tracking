import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/grocery_provider.dart';
import '../../models/grocery_item.dart';
import 'package:intl/intl.dart';
import '../../core/constants/colors.dart';

class AllGroceriesView extends StatefulWidget {
  const AllGroceriesView({super.key});

  @override
  State<AllGroceriesView> createState() => _AllGroceriesViewState();
}

class _AllGroceriesViewState extends State<AllGroceriesView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _sortBy = 'expiryDate';
  String _order = 'asc';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Listen to tab changes to fetch archived items
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      _fetchItems();
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchItems();
    });
  }

  void _fetchItems() {
    final gp = Provider.of<GroceryProvider>(context, listen: false);
    final isArchived = _tabController.index == 1;
    gp.fetchGroceries(
      sortBy: _sortBy,
      order: _order,
      archived: isArchived,
    );
  }

  void _changeSort(String field) {
    setState(() {
      if (_sortBy == field) {
        _order = _order == 'asc' ? 'desc' : 'asc';
      } else {
        _sortBy = field;
        _order = 'asc';
      }
    });
    _fetchItems();
  }

  String _getCategoryEmoji(String category) {
    switch (category) {
      case 'Dairy & Eggs':
        return '🥛';
      case 'Fruits & Vegetables':
        return '🍎';
      case 'Bakery':
        return '🍞';
      case 'Meat & Fish':
        return '🥩';
      case 'Pantry':
        return '🥫';
      case 'Beverages':
        return '🥤';
      case 'Snacks':
        return '🍪';
      case 'Others':
      default:
        return '📦';
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final groceryProvider = Provider.of<GroceryProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Groceries', style: TextStyle(fontWeight: FontWeight.w900)),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF2E7D32),
          labelColor: const Color(0xFF2E7D32),
          unselectedLabelColor: const Color(0xFF94A3B8),
          labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5),
          tabs: const [
            Tab(text: 'Active List'),
            Tab(text: 'Archived Storage'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Sorting Chips Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Row(
              children: [
                const Text('Sort by:', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF64748B))),
                const SizedBox(width: 8),
                _buildSortChip('Expiry Date', 'expiryDate'),
                const SizedBox(width: 8),
                _buildSortChip('Name', 'itemName'),
                const SizedBox(width: 8),
                _buildSortChip('Date Added', 'createdAt'),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildList(groceryProvider.groceries, groceryProvider.loading, false),
                _buildList(groceryProvider.archivedGroceries, groceryProvider.loading, true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortChip(String label, String field) {
    final isSelected = _sortBy == field;
    return InkWell(
      onTap: () => _changeSort(field),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2E7D32).withOpacity(0.08) : Colors.transparent,
          border: Border.all(
            color: isSelected ? const Color(0xFF2E7D32) : const Color(0xFFCBD5E1),
            width: 1,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.bold,
                color: isSelected ? const Color(0xFF2E7D32) : const Color(0xFF64748B),
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 4),
              Icon(
                _order == 'asc' ? Icons.arrow_upward : Icons.arrow_downward,
                size: 10,
                color: const Color(0xFF2E7D32),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildList(List<GroceryItem> list, bool loading, bool isArchivedTab) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF2E7D32)));
    }

    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('📦', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text(
              isArchivedTab ? 'NO ARCHIVED ITEMS' : 'NO ACTIVE ITEMS',
              style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = list[index];
        final formattedDate = DateFormat('d MMM yyyy').format(item.expiryDate);
        
        Color statusColor;
        if (item.status == 'Expired') {
          statusColor = AppColors.statusExpired;
        } else if (item.status == 'Expiring Soon') {
          statusColor = AppColors.statusExpiringSoon;
        } else {
          statusColor = AppColors.statusFresh;
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
              // Product Thumbnail Emoji
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                alignment: Alignment.center,
                child: Text(
                  _getCategoryEmoji(item.category),
                  style: const TextStyle(fontSize: 20),
                ),
              ),
              const SizedBox(width: 14),
              // Name & Dates
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.itemName,
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Expires: $formattedDate • Qty: ${item.quantity}',
                      style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Quick restore / archive action buttons
              if (isArchivedTab)
                IconButton(
                  icon: const Icon(Icons.unarchive_outlined, color: Colors.green, size: 20),
                  onPressed: () async {
                    final gp = Provider.of<GroceryProvider>(context, listen: false);
                    await gp.restoreGrocery(item.id);
                  },
                  tooltip: 'Restore',
                )
              else
                IconButton(
                  icon: const Icon(Icons.archive_outlined, color: Colors.grey, size: 20),
                  onPressed: () async {
                    final gp = Provider.of<GroceryProvider>(context, listen: false);
                    await gp.archiveGrocery(item.id);
                  },
                  tooltip: 'Archive',
                ),
            ],
          ),
        );
      },
    );
  }
}
