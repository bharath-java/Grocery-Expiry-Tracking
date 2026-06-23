import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/grocery_provider.dart';
import '../../models/grocery_item.dart';
import '../../core/constants/colors.dart';
import 'package:intl/intl.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  final _searchController = TextEditingController();
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<GroceryProvider>(context, listen: false).fetchGroceries();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String text) {
    Provider.of<GroceryProvider>(context, listen: false).fetchGroceries(
      search: text,
      status: _selectedFilter == 'All' ? null : _selectedFilter,
    );
  }

  void _selectFilter(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
    Provider.of<GroceryProvider>(context, listen: false).fetchGroceries(
      search: _searchController.text.isNotEmpty ? _searchController.text : null,
      status: filter == 'All' ? null : filter,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final groceryProvider = Provider.of<GroceryProvider>(context);

    // Filtered lists local checks
    final List<GroceryItem> listToShow = groceryProvider.groceries;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Grocery Dashboard', style: TextStyle(fontWeight: FontWeight.w900)),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: Colors.purple),
            onPressed: () {
              Navigator.pushNamed(context, '/ai-assistant');
            },
            tooltip: 'AI Assistant',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              groceryProvider.fetchGroceries();
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              currentAccountPicture: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                child: Text(
                  authProvider.user?.name.substring(0, 1).toUpperCase() ?? 'U',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary),
                ),
              ),
              accountName: Text(authProvider.user?.name ?? 'User', style: const TextStyle(fontWeight: FontWeight.bold)),
              accountEmail: Text(authProvider.user?.email ?? 'user@gmail.com'),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_outlined),
              title: const Text('Dashboard'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.list_alt_outlined),
              title: const Text('All Groceries'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/all-groceries');
              },
            ),
            ListTile(
              leading: const Icon(Icons.category_outlined),
              title: const Text('Categories'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/categories');
              },
            ),
            ListTile(
              leading: const Icon(Icons.notifications_active_outlined),
              title: const Text('Reminders & Alerts'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/reminders');
              },
            ),
            ListTile(
              leading: const Icon(Icons.psychology_outlined, color: Colors.purple),
              title: const Text('Smart AI Assistants'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/ai-assistant');
              },
            ),
            const Spacer(),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red)),
              onTap: () async {
                await authProvider.logout();
                if (context.mounted) {
                  Navigator.pushNamedAndRemoveUntil(context, '/landing', (route) => false);
                }
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      body: Column(
        children: [
          // 1. Counter Statistics Card Widget
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                _buildStatCard('Expired', groceryProvider.expiredCount, AppColors.statusExpired),
                const SizedBox(width: 8),
                _buildStatCard('Expiring Soon', groceryProvider.expiringSoonCount, AppColors.statusExpiringSoon),
                const SizedBox(width: 8),
                _buildStatCard('Fresh', groceryProvider.goodCount, AppColors.statusFresh),
              ],
            ),
          ),

          // 2. Search & Filter Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Search groceries...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              ),
            ),
          ),

          // 3. Status Filters Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: ['All', 'Expired', 'Expiring Soon', 'Fresh'].map((filter) {
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    label: Text(filter),
                    selected: isSelected,
                    onSelected: (_) => _selectFilter(filter),
                    selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.15),
                    checkmarkColor: Theme.of(context).colorScheme.primary,
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // 4. Grocery List View
          Expanded(
            child: groceryProvider.loading
                ? const Center(child: CircularProgressIndicator())
                : listToShow.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.cookie, size: 64, color: Colors.grey.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            const Text('No groceries found.', style: TextStyle(color: Colors.grey, fontSize: 16)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        itemCount: listToShow.length,
                        itemBuilder: (context, index) {
                          final item = listToShow[index];
                          return _buildGroceryListItem(item);
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/add-grocery');
        },
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildStatCard(String label, int count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.15), width: 1),
        ),
        child: Column(
          children: [
            Text(
              count.toString(),
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color.withOpacity(0.8)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGroceryListItem(GroceryItem item) {
    Color statusColor;
    if (item.status == 'Expired') {
      statusColor = AppColors.statusExpired;
    } else if (item.status == 'Expiring Soon') {
      statusColor = AppColors.statusExpiringSoon;
    } else {
      statusColor = AppColors.statusFresh;
    }

    final formattedExpiry = DateFormat('MMM dd, yyyy').format(item.expiryDate);
    final daysLeft = item.daysRemaining;

    String countdownText;
    if (daysLeft < 0) {
      countdownText = 'Expired';
    } else if (daysLeft == 0) {
      countdownText = 'Expires Today';
    } else if (daysLeft == 1) {
      countdownText = 'Expires Tomorrow';
    } else {
      countdownText = 'Expires in $daysLeft days';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
      color: Theme.of(context).cardColor,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          // Open Edit Screen directly
          Navigator.pushNamed(context, '/add-grocery', arguments: item);
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              // Category indicator icon bubble
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getCategoryIcon(item.category),
                  color: statusColor,
                ),
              ),
              const SizedBox(width: 16),
              // Name and expiry dates
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.itemName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Expiry: $formattedExpiry',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                  ],
                ),
              ),
              // Quantity & Days Countdown
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    item.quantity,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      countdownText,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Dairy & Eggs':
        return Icons.egg_outlined;
      case 'Fruits & Vegetables':
        return Icons.eco_outlined;
      case 'Bakery':
        return Icons.bakery_dining_outlined;
      case 'Meat & Fish':
        return Icons.kebab_dining_outlined;
      case 'Pantry':
        return Icons.kitchen_outlined;
      case 'Beverages':
        return Icons.local_drink_outlined;
      case 'Snacks':
        return Icons.cookie_outlined;
      default:
        return Icons.shopping_basket_outlined;
    }
  }
}
