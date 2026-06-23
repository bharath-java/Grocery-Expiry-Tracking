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
        title: const Text('All Groceries', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Theme.of(context).colorScheme.primary,
          labelColor: Theme.of(context).colorScheme.primary,
          unselectedLabelColor: Colors.grey,
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
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                const Text('Sort by:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(width: 8),
                _buildSortChip('Expiry Date', 'expiryDate'),
                const SizedBox(width: 8),
                _buildSortChip('Name', 'itemName'),
                const SizedBox(width: 8),
                _buildSortChip('Date Added', 'createdAt'),
              ],
            ),
          ),
          const Divider(height: 1),
          
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
          color: isSelected ? Theme.of(context).colorScheme.primary.withOpacity(0.12) : Colors.transparent,
          border: Border.all(
            color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.withOpacity(0.3),
            width: 1,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey[600],
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 4),
              Icon(
                _order == 'asc' ? Icons.arrow_upward : Icons.arrow_downward,
                size: 12,
                color: Theme.of(context).colorScheme.primary,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildList(List<GroceryItem> list, bool loading, bool isArchivedTab) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.withOpacity(0.5)),
            const SizedBox(height: 16),
            Text(
              isArchivedTab ? 'No archived items.' : 'No active items.',
              style: const TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        final formattedDate = DateFormat('MMM dd, yyyy').format(item.expiryDate);
        
        Color statusColor;
        if (item.status == 'Expired') {
          statusColor = AppColors.statusExpired;
        } else if (item.status == 'Expiring Soon') {
          statusColor = AppColors.statusExpiringSoon;
        } else {
          statusColor = AppColors.statusFresh;
        }

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
          color: Theme.of(context).cardColor,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                // Product Thumbnail
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.cookie, color: statusColor),
                ),
                const SizedBox(width: 16),
                // Name & Dates
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.itemName,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Expires: $formattedDate',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Quick restore / archive action buttons
                if (isArchivedTab)
                  IconButton(
                    icon: const Icon(Icons.unarchive, color: Colors.blue),
                    onPressed: () async {
                      final gp = Provider.of<GroceryProvider>(context, listen: false);
                      await gp.restoreGrocery(item.id);
                    },
                    tooltip: 'Restore',
                  )
                else
                  IconButton(
                    icon: const Icon(Icons.archive_outlined, color: Colors.grey),
                    onPressed: () async {
                      final gp = Provider.of<GroceryProvider>(context, listen: false);
                      await gp.archiveGrocery(item.id);
                    },
                    tooltip: 'Archive',
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
