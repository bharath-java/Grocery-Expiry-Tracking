import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/grocery_provider.dart';
import '../../core/services/notification_service.dart';
import '../../core/network/api_client.dart';

class RemindersView extends StatefulWidget {
  const RemindersView({super.key});

  @override
  State<RemindersView> createState() => _RemindersViewState();
}

class _RemindersViewState extends State<RemindersView> {
  bool _localAlertsEnabled = true;
  TimeOfDay _notificationTime = const TimeOfDay(hour: 9, minute: 0);
  final _urlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _urlController.text = ApiClient().baseUrl;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _selectTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _notificationTime,
    );
    if (picked != null) {
      setState(() {
        _notificationTime = picked;
      });
    }
  }

  void _triggerTestNotification() {
    final groceryProvider = Provider.of<GroceryProvider>(context, listen: false);
    final expiringCount = groceryProvider.expiringSoonCount;

    String alertMessage;
    if (expiringCount > 0) {
      alertMessage = 'You have $expiringCount items expiring soon. Use them before they spoil!';
    } else {
      alertMessage = 'Your groceries are fresh and safe today. Keep up the good work!';
    }

    NotificationService().showLocalNotification(
      id: 99,
      title: 'Grocery Freshness Update 🥬',
      body: alertMessage,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Test local notification triggered.'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _updateApiUrl() {
    final String url = _urlController.text.trim();
    if (url.isNotEmpty) {
      ApiClient().updateBaseUrl(url);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('API Base URL updated: $url'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reminders & Settings', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. User Profile Box
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              color: Theme.of(context).cardColor,
              elevation: 0,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                      child: Text(
                        authProvider.user?.name.substring(0, 1).toUpperCase() ?? 'U',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            authProvider.user?.name ?? 'User',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            authProvider.user?.email ?? 'user@gmail.com',
                            style: const TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              authProvider.user?.role.toUpperCase() ?? 'USER',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'NOTIFICATION ALERTS',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey, letterSpacing: 1),
            ),
            const SizedBox(height: 8),

            // 2. Notification Toggle Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Daily Expiry Warnings'),
                    subtitle: const Text('Get alerts about products expiring soon.'),
                    value: _localAlertsEnabled,
                    activeColor: Theme.of(context).colorScheme.primary,
                    onChanged: (bool value) {
                      setState(() {
                        _localAlertsEnabled = value;
                      });
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    title: const Text('Reminder Time'),
                    subtitle: Text('Notifications arrive daily at ${_notificationTime.format(context)}'),
                    trailing: const Icon(Icons.access_time_outlined),
                    enabled: _localAlertsEnabled,
                    onTap: _selectTime,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'TESTING AND UTILITIES',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey, letterSpacing: 1),
            ),
            const SizedBox(height: 8),

            // 3. Test triggers Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
              child: ListTile(
                title: const Text('Test Local Alert'),
                subtitle: const Text('Trigger a simulated food expiry notification immediately.'),
                trailing: const Icon(Icons.send_outlined, color: Colors.blue),
                onTap: _triggerTestNotification,
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'DEVELOPER OVERRIDES',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey, letterSpacing: 1),
            ),
            const SizedBox(height: 8),

            // 4. API Override Form
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    TextField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: 'API Endpoint (Base URL)',
                        prefixIcon: Icon(Icons.link_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _updateApiUrl,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[800],
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('UPDATE CONNECTION URL'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
