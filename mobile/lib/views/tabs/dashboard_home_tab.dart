import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/grocery_provider.dart';
import '../../../models/grocery_item.dart';

class DashboardHomeTab extends StatelessWidget {
  final VoidCallback onNavigateToReminders;
  final VoidCallback onNavigateToAllGroceries;

  const DashboardHomeTab({
    super.key,
    required this.onNavigateToReminders,
    required this.onNavigateToAllGroceries,
  });

  // Emojis for categories
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

  int _getDaysLeft(DateTime expiryDate) {
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final expDate = DateTime(expiryDate.year, expiryDate.month, expiryDate.day);
    final diff = expDate.difference(todayDate);
    return diff.inDays;
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final groceryProvider = Provider.of<GroceryProvider>(context);

    final String userName = authProvider.user?.name ?? 'User';
    final List<GroceryItem> expiringSoonItems = groceryProvider.groceries
        .where((item) => item.status == 'Expiring Soon')
        .toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 12),
          // 1. Locked Header Bar
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hi, $userName 👋',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                        letterSpacing: -0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      "Let's keep your groceries fresh",
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // SMART AI Button
              GestureDetector(
                onTap: () {
                  Navigator.pushNamed(context, '/ai-assistant');
                },
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        Colors.purple.withOpacity(0.1),
                        Colors.indigo.withOpacity(0.15),
                      ],
                    ),
                    border: Border.all(color: Colors.purple.withOpacity(0.3)),
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'SMART',
                        style: TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w900,
                          color: Colors.purple,
                          height: 1,
                        ),
                      ),
                      Text(
                        'AI',
                        style: TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w900,
                          color: Colors.purple,
                          height: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Circular Bell Button with notification badge
              IconButton(
                onPressed: onNavigateToReminders,
                icon: Stack(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF2E7D32).withOpacity(0.15),
                        ),
                      ),
                      child: const Icon(
                        Icons.notifications_none_rounded,
                        color: Color(0xFF2E7D32),
                        size: 20,
                      ),
                    ),
                    if (expiringSoonItems.isNotEmpty)
                      Positioned(
                        top: 4,
                        right: 4,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 2. Expiry Overview Section
          const Text(
            'EXPIRY OVERVIEW',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: Color(0xFF94A3B8),
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildOverviewCard(
                context,
                count: groceryProvider.expiredCount,
                label: 'Expired',
                icon: Icons.access_time_filled_rounded,
                iconColor: const Color(0xFFEF5350),
                bgColor: const Color(0xFFEF5350).withOpacity(0.06),
              ),
              const SizedBox(width: 10),
              _buildOverviewCard(
                context,
                count: groceryProvider.expiringSoonCount,
                label: 'Expiring Soon',
                icon: Icons.warning_amber_rounded,
                iconColor: const Color(0xFFFFA726),
                bgColor: const Color(0xFFFFA726).withOpacity(0.06),
              ),
              const SizedBox(width: 10),
              _buildOverviewCard(
                context,
                count: groceryProvider.goodCount,
                label: 'Good',
                icon: Icons.shield_outlined,
                iconColor: const Color(0xFF4CAF50),
                bgColor: const Color(0xFF4CAF50).withOpacity(0.06),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 3. Flexible Expiring Soon List Section
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Text(
                'EXPIRING SOON',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 1,
                ),
              ),
              TextButton(
                onPressed: onNavigateToAllGroceries,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'View all',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF2E7D32),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Expanded(
            child: groceryProvider.loading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF2E7D32)),
                  )
                : expiringSoonItems.isEmpty
                    ? _buildEmptyState(context)
                    : _buildItemsList(context, expiringSoonItems),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewCard(
    BuildContext context, {
    required int count,
    required String label,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x05000000),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(height: 8),
            Text(
              count.toString(),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Theme.of(context).textTheme.bodyLarge?.color,
                height: 1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: Color(0xFF64748B),
                letterSpacing: 0.2,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '🎉',
            style: TextStyle(fontSize: 32),
          ),
          SizedBox(height: 8),
          Text(
            'ALL ITEMS IN GOOD STANDING!',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: Color(0xFF64748B),
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildItemsList(BuildContext context, List<GroceryItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: ListView.separated(
          itemCount: items.length,
          separatorBuilder: (context, index) => const Divider(
            height: 1,
            color: Color(0xFFF1F5F9),
            indent: 16,
            endIndent: 16,
          ),
          itemBuilder: (context, index) {
            final item = items[index];
            final daysLeft = _getDaysLeft(item.expiryDate);

            String statusLabel;
            if (daysLeft == 1) {
              statusLabel = 'Tomorrow';
            } else if (daysLeft == 0) {
              statusLabel = 'Expires Today';
            } else if (daysLeft < 0) {
              statusLabel = 'Expired';
            } else {
              statusLabel = 'In $daysLeft days';
            }

            final formattedDate = DateFormat('d MMM yyyy').format(item.expiryDate);

            return InkWell(
              onTap: () {
                Navigator.pushNamed(context, '/add-grocery', arguments: item);
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Row(
                  children: [
                    // Emoji bubble
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _getCategoryEmoji(item.category),
                        style: const TextStyle(fontSize: 18),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Item Name and date
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.itemName,
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w900,
                              color: Theme.of(context).textTheme.bodyLarge?.color,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            formattedDate,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Days left pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFA726).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFFA726).withOpacity(0.3)),
                      ),
                      child: Text(
                        statusLabel,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFFFA726),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
