import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../../providers/grocery_provider.dart';
import '../../models/grocery_item.dart';
import '../../core/network/api_client.dart';

class RemindersView extends StatefulWidget {
  const RemindersView({super.key});

  @override
  State<RemindersView> createState() => _RemindersViewState();
}

class _RemindersViewState extends State<RemindersView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _loadingHistory = false;
  List<dynamic> _historyNotifications = [];

  // Settings & Intervals states (SharedPreferences synced)
  bool _emailDigest = true;
  bool _pushNotifications = true;
  bool _sevenDays = true;
  bool _threeDays = true;
  bool _oneDay = true;
  bool _sameDay = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadPreferences();
    _fetchNotificationHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _emailDigest = prefs.getBool('emailDigest') ?? true;
      _pushNotifications = prefs.getBool('pushNotifications') ?? true;
      _sevenDays = prefs.getBool('interval_sevenDays') ?? true;
      _threeDays = prefs.getBool('interval_threeDays') ?? true;
      _oneDay = prefs.getBool('interval_oneDay') ?? true;
      _sameDay = prefs.getBool('interval_sameDay') ?? true;
    });
  }

  Future<void> _savePreference(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  Future<void> _fetchNotificationHistory() async {
    setState(() {
      _loadingHistory = true;
    });

    try {
      final dio = ApiClient().dio;
      final response = await dio.get('/notifications');
      if (response.data['success'] == true) {
        setState(() {
          _historyNotifications = response.data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Failed to load notification history: $e');
    } finally {
      setState(() {
        _loadingHistory = false;
      });
    }
  }

  Future<void> _deleteNotification(String id) async {
    try {
      final dio = ApiClient().dio;
      final response = await dio.delete('/notifications/$id');
      if (response.data['success'] == true) {
        setState(() {
          _historyNotifications.removeWhere((n) => n['_id'] == id);
        });
      }
    } catch (e) {
      debugPrint('Failed to delete notification: $e');
    }
  }

  Future<void> _clearAllNotifications() async {
    try {
      final dio = ApiClient().dio;
      // Mark all read or delete
      await dio.put('/notifications/mark-read');
      setState(() {
        _historyNotifications.clear();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All notifications cleared.'), backgroundColor: Color(0xFF2E7D32)),
        );
      }
    } catch (e) {
      debugPrint('Failed to clear notifications: $e');
    }
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

  void _showSettingsBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Wrap(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Reminder Settings',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(),
                  const SizedBox(height: 8),
                  const Text(
                    'CHANNELS',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1),
                  ),
                  SwitchListTile(
                    title: const Text('Email Digests', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                    subtitle: const Text('Receive warnings in your email digest', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.grey)),
                    value: _emailDigest,
                    activeColor: const Color(0xFF2E7D32),
                    onChanged: (val) {
                      setState(() => _emailDigest = val);
                      setModalState(() => _emailDigest = val);
                      _savePreference('emailDigest', val);
                    },
                    contentPadding: EdgeInsets.zero,
                  ),
                  SwitchListTile(
                    title: const Text('Push Notifications', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                    subtitle: const Text('Get real-time push alerts on your phone', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.grey)),
                    value: _pushNotifications,
                    activeColor: const Color(0xFF2E7D32),
                    onChanged: (val) {
                      setState(() => _pushNotifications = val);
                      setModalState(() => _pushNotifications = val);
                      _savePreference('pushNotifications', val);
                    },
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'INTERVALS',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1),
                  ),
                  CheckboxListTile(
                    title: const Text('7 Days Before', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                    value: _sevenDays,
                    activeColor: const Color(0xFF2E7D32),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _sevenDays = val);
                        setModalState(() => _sevenDays = val);
                        _savePreference('interval_sevenDays', val);
                      }
                    },
                    contentPadding: EdgeInsets.zero,
                  ),
                  CheckboxListTile(
                    title: const Text('3 Days Before', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                    value: _threeDays,
                    activeColor: const Color(0xFF2E7D32),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _threeDays = val);
                        setModalState(() => _threeDays = val);
                        _savePreference('interval_threeDays', val);
                      }
                    },
                    contentPadding: EdgeInsets.zero,
                  ),
                  CheckboxListTile(
                    title: const Text('1 Day Before', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                    value: _oneDay,
                    activeColor: const Color(0xFF2E7D32),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _oneDay = val);
                        setModalState(() => _oneDay = val);
                        _savePreference('interval_oneDay', val);
                      }
                    },
                    contentPadding: EdgeInsets.zero,
                  ),
                  CheckboxListTile(
                    title: const Text('Same Day (Expiry)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                    value: _sameDay,
                    activeColor: const Color(0xFF2E7D32),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _sameDay = val);
                        setModalState(() => _sameDay = val);
                        _savePreference('interval_sameDay', val);
                      }
                    },
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final groceryProvider = Provider.of<GroceryProvider>(context);
    final List<GroceryItem> activeItems = groceryProvider.groceries;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reminders', style: TextStyle(fontWeight: FontWeight.w900)),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF2E7D32)),
            onPressed: _showSettingsBottomSheet,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF2E7D32),
          unselectedLabelColor: const Color(0xFF94A3B8),
          indicatorColor: const Color(0xFF2E7D32),
          labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5),
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildUpcomingTab(activeItems),
          _buildHistoryTab(),
        ],
      ),
    );
  }

  Widget _buildUpcomingTab(List<GroceryItem> items) {
    // Show only future-expiring items
    final upcomingItems = items.where((e) => e.daysRemaining >= 0).toList();

    if (upcomingItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('⏰', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              'NO UPCOMING REMINDERS',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: upcomingItems.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = upcomingItems[index];
        final days = item.daysRemaining;

        String relativeTime;
        if (days == 0) {
          relativeTime = 'expires today';
        } else if (days == 1) {
          relativeTime = 'expires tomorrow';
        } else {
          relativeTime = 'expires in $days days';
        }

        final formattedDate = DateFormat('d MMM yyyy').format(item.expiryDate);

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF1F5F9)),
          ),
          child: Row(
            children: [
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
                      'Alerts at 9:00 AM • $relativeTime ($formattedDate)',
                      style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHistoryTab() {
    if (_loadingHistory) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF2E7D32)));
    }

    if (_historyNotifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('📭', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              'NOTIFICATION HISTORY IS EMPTY',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: _clearAllNotifications,
              icon: const Icon(Icons.delete_sweep_outlined, size: 18, color: Colors.red),
              label: const Text('Clear All', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 11)),
              style: TextButton.styleFrom(padding: EdgeInsets.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
            ),
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _historyNotifications.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final n = _historyNotifications[index];
              final dateStr = n['sentAt'] != null
                  ? DateFormat('d MMM yyyy, h:mm a').format(DateTime.parse(n['sentAt']))
                  : '';

              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFEBEE),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.notifications_active_outlined, color: Colors.red, size: 18),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            n['title'] ?? 'Notification',
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            n['message'] ?? '',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            dateStr,
                            style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.grey, size: 20),
                      onPressed: () => _deleteNotification(n['_id']),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
