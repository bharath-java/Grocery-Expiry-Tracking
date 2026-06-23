import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/grocery_provider.dart';
import 'tabs/dashboard_home_tab.dart';
import 'categories_view.dart';
import 'reminders_view.dart';
import 'profile_view.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<GroceryProvider>(context, listen: false).fetchGroceries();
    });
  }

  // Define screens list
  List<Widget> _getScreens() {
    return [
      DashboardHomeTab(
        onNavigateToReminders: () {
          setState(() {
            _currentIndex = 3;
          });
        },
        onNavigateToAllGroceries: () {
          Navigator.pushNamed(context, '/all-groceries');
        },
      ),
      const CategoriesView(),
      const SizedBox.shrink(), // Placeholder for Central FAB
      const RemindersView(),
      const ProfileView(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final screens = _getScreens();

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: screens,
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          border: const Border(
            top: BorderSide(color: Color(0xFFF1F5F9), width: 1.5),
          ),
        ),
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(0, Icons.home_filled, Icons.home_outlined, 'Home'),
            _buildNavItem(1, Icons.grid_view_rounded, Icons.grid_view_outlined, 'Categories'),
            _buildCentralFAB(),
            _buildNavItem(3, Icons.notifications_rounded, Icons.notifications_none_rounded, 'Reminders'),
            _buildNavItem(4, Icons.person_rounded, Icons.person_outline_rounded, 'Profile'),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData selectedIcon, IconData unselectedIcon, String label) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? const Color(0xFF2E7D32) : const Color(0xFF94A3B8);

    return InkWell(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 4.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? selectedIcon : unselectedIcon,
              color: color,
              size: 24,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCentralFAB() {
    return InkWell(
      onTap: () {
        // Direct route push to add grocery to keep it simple and 100% bug-free
        Navigator.pushNamed(context, '/add-grocery');
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 42,
        height: 42,
        decoration: const BoxDecoration(
          color: Color(0xFF2E7D32),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Color(0x202E7D32),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(
          Icons.add, // fallback or clean Plus icon
          color: Colors.white,
          size: 20,
        ),
      ),
    );
  }
}
