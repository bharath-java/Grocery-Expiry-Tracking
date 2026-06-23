import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/grocery_provider.dart';
import '../../models/grocery_item.dart';
import 'package:intl/intl.dart';

class ProfileView extends StatefulWidget {
  const ProfileView({super.key});

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<ProfileView> {
  String _currentView = 'main'; // 'main', 'security', 'backup', 'archives', 'language', 'theme', 'help'

  // Security Form States
  final _securityFormKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  String _passwordStrengthLabel = 'Weak';
  Color _passwordStrengthColor = Colors.red;
  double _passwordStrengthVal = 0.2;

  // Help Center States
  final _helpFormKey = GlobalKey<FormState>();
  final _helpNameController = TextEditingController();
  final _helpEmailController = TextEditingController();
  final _helpMsgController = TextEditingController();

  // Archives Search Query
  String _archiveSearchQuery = '';

  @override
  void initState() {
    super.initState();
    _newPasswordController.addListener(_calculatePasswordStrength);
    
    // Fetch archived groceries on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<GroceryProvider>(context, listen: false).fetchGroceries(archived: true);
    });
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _helpNameController.dispose();
    _helpEmailController.dispose();
    _helpMsgController.dispose();
    super.dispose();
  }

  void _calculatePasswordStrength() {
    final pwd = _newPasswordController.text;
    if (pwd.isEmpty) {
      setState(() {
        _passwordStrengthLabel = 'None';
        _passwordStrengthColor = Colors.grey;
        _passwordStrengthVal = 0.0;
      });
      return;
    }
    double score = 0.0;
    if (pwd.length >= 6) score += 0.2;
    if (pwd.length >= 10) score += 0.2;
    if (pwd.contains(RegExp(r'[A-Z]'))) score += 0.2;
    if (pwd.contains(RegExp(r'[0-9]'))) score += 0.2;
    if (pwd.contains(RegExp(r'[^A-Za-z0-9]'))) score += 0.2;

    setState(() {
      _passwordStrengthVal = score;
      if (score >= 0.8) {
        _passwordStrengthLabel = 'Strong';
        _passwordStrengthColor = Colors.green;
      } else if (score >= 0.4) {
        _passwordStrengthLabel = 'Medium';
        _passwordStrengthColor = Colors.amber;
      } else {
        _passwordStrengthLabel = 'Weak';
        _passwordStrengthColor = Colors.red;
      }
    });
  }

  Future<void> _updatePassword() async {
    if (!_securityFormKey.currentState!.validate()) return;
    
    // Mock password update logic matching Next.js
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Password updated successfully!'),
        backgroundColor: Colors.green,
      ),
    );
    
    _currentPasswordController.clear();
    _newPasswordController.clear();
    _confirmPasswordController.clear();
    setState(() {
      _currentView = 'main';
    });
  }

  Future<void> _submitSupportTicket() async {
    if (!_helpFormKey.currentState!.validate()) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Support ticket submitted successfully!'),
        backgroundColor: Colors.green,
      ),
    );

    _helpNameController.clear();
    _helpEmailController.clear();
    _helpMsgController.clear();
    setState(() {
      _currentView = 'main';
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final groceryProvider = Provider.of<GroceryProvider>(context);

    if (_currentView == 'security') {
      return _buildSecurityView();
    } else if (_currentView == 'backup') {
      return _buildBackupView();
    } else if (_currentView == 'archives') {
      return _buildArchivesView(groceryProvider);
    } else if (_currentView == 'language') {
      return _buildLanguageView();
    } else if (_currentView == 'theme') {
      return _buildThemeView();
    } else if (_currentView == 'help') {
      return _buildHelpView();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile Settings', style: TextStyle(fontWeight: FontWeight.w900)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Column(
          children: [
            // User profile card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: const Color(0xFFE8F5E9),
                    child: Text(
                      authProvider.user?.name.substring(0, 1).toUpperCase() ?? 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF2E7D32),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authProvider.user?.name ?? 'User',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          authProvider.user?.email ?? 'user@gmail.com',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Settings Items
            _buildSettingsItem(
              icon: Icons.shield_outlined,
              title: 'Security',
              subtitle: 'Change password & credentials',
              onTap: () {
                setState(() {
                  _currentView = 'security';
                });
              },
            ),
            _buildSettingsItem(
              icon: Icons.download_outlined,
              title: 'Backup & Exports',
              subtitle: 'Export PDF, CSV, JSON data',
              onTap: () {
                setState(() {
                  _currentView = 'backup';
                });
              },
            ),
            _buildSettingsItem(
              icon: Icons.archive_outlined,
              title: 'Archives',
              subtitle: 'Restore/delete consumed groceries',
              onTap: () {
                setState(() {
                  _currentView = 'archives';
                });
              },
            ),
            _buildSettingsItem(
              icon: Icons.language_outlined,
              title: 'Language',
              subtitle: 'Swap language interface',
              onTap: () {
                setState(() {
                  _currentView = 'language';
                });
              },
            ),
            _buildSettingsItem(
              icon: Icons.dark_mode_outlined,
              title: 'Theme Settings',
              subtitle: 'Toggle dark & light mode theme',
              onTap: () {
                setState(() {
                  _currentView = 'theme';
                });
              },
            ),
            _buildSettingsItem(
              icon: Icons.help_outline_outlined,
              title: 'Help Center',
              subtitle: 'Customer support & FAQs',
              onTap: () {
                setState(() {
                  _currentView = 'help';
                });
              },
            ),
            const SizedBox(height: 24),

            // Logout
            ElevatedButton.icon(
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.w900)),
                    content: const Text('Are you sure you want to log out from your account?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('CANCEL'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('LOG OUT', style: TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.pushNamedAndRemoveUntil(context, '/landing', (route) => false);
                  }
                }
              },
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('LOG OUT', style: TextStyle(fontWeight: FontWeight.w900)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFEBEE),
                foregroundColor: Colors.red,
                elevation: 0,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: const Color(0xFF2E7D32), size: 20),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.bold),
        ),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFFCBD5E1)),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildSecurityView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Security', style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentView = 'main'),
        ),
      ),
      body: Form(
        key: _securityFormKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'CHANGE PASSWORD',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _currentPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Current Password',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: (val) => (val == null || val.isEmpty) ? 'Current password required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _newPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'New Password',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: (val) => (val == null || val.length < 6) ? 'Password must be at least 6 characters' : null,
              ),
              const SizedBox(height: 12),
              // Strength bar
              Row(
                children: [
                  Expanded(
                    child: LinearProgressIndicator(
                      value: _passwordStrengthVal,
                      color: _passwordStrengthColor,
                      backgroundColor: Colors.grey.withOpacity(0.2),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _passwordStrengthLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: _passwordStrengthColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Confirm New Password',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: (val) {
                  if (val == null || val.isEmpty) return 'Confirm password required';
                  if (val != _newPasswordController.text) return 'Passwords do not match';
                  return null;
                },
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _updatePassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text('UPDATE PASSWORD', style: TextStyle(fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBackupView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Backup & Exports', style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentView = 'main'),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'EXPORT DATA',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1),
            ),
            const SizedBox(height: 12),
            _buildBackupActionCard(
              icon: Icons.picture_as_pdf_outlined,
              color: Colors.red,
              title: 'Export PDF Report',
              subtitle: 'Generate printable inventory sheet',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Generating PDF Report...'), backgroundColor: Color(0xFF2E7D32)),
                );
              },
            ),
            _buildBackupActionCard(
              icon: Icons.table_chart_outlined,
              color: Colors.green,
              title: 'Export CSV Spreadsheet',
              subtitle: 'Open directly in Excel / sheets',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Exporting CSV data...'), backgroundColor: Color(0xFF2E7D32)),
                );
              },
            ),
            _buildBackupActionCard(
              icon: Icons.code_rounded,
              color: Colors.blue,
              title: 'Export JSON Backup',
              subtitle: 'Full application raw database snapshot',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Downloading database snapshot...'), backgroundColor: Color(0xFF2E7D32)),
                );
              },
            ),
            const SizedBox(height: 24),
            const Text(
              'IMPORT DATA',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1),
            ),
            const SizedBox(height: 12),
            _buildBackupActionCard(
              icon: Icons.upload_file_outlined,
              color: Colors.purple,
              title: 'Import JSON Backup',
              subtitle: 'Upload database snapshot to restore items',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Selecting backup file...')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBackupActionCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildArchivesView(GroceryProvider groceryProvider) {
    final archived = groceryProvider.archivedGroceries
        .where((e) => e.itemName.toLowerCase().contains(_archiveSearchQuery.toLowerCase()))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Archives', style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentView = 'main'),
        ),
      ),
      body: Column(
        children: [
          // Search input
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search archived items',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (val) {
                setState(() {
                  _archiveSearchQuery = val;
                });
              },
            ),
          ),
          Expanded(
            child: groceryProvider.loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF2E7D32)))
                : archived.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('🧺', style: TextStyle(fontSize: 36)),
                            const SizedBox(height: 8),
                            const Text(
                              'NO ARCHIVED ITEMS FOUND',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: archived.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final item = archived[index];
                          final dateStr = DateFormat('d MMM yyyy').format(item.expiryDate);

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
                                      Text(
                                        'Expired: $dateStr • Qty: ${item.quantity}',
                                        style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.refresh, color: Colors.green, size: 20),
                                  onPressed: () async {
                                    final ok = await groceryProvider.restoreGrocery(item.id);
                                    if (ok && context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Item restored to active list.'), backgroundColor: Colors.green),
                                      );
                                    }
                                  },
                                  tooltip: 'Restore',
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                  onPressed: () async {
                                    final ok = await groceryProvider.deleteGrocery(item.id);
                                    if (ok && context.mounted) {
                                      groceryProvider.fetchGroceries(archived: true);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Item deleted permanently.'), backgroundColor: Colors.red),
                                      );
                                    }
                                  },
                                  tooltip: 'Delete Permanently',
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Language Settings', style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentView = 'main'),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildLanguageOption('English', true),
          _buildLanguageOption('Telugu (తెలుగు)', false),
          _buildLanguageOption('Hindi (हिन्दी)', false),
        ],
      ),
    );
  }

  Widget _buildLanguageOption(String label, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5)),
        trailing: isSelected ? const Icon(Icons.check, color: Color(0xFF2E7D32)) : null,
        onTap: () {
          // Select mock language
          setState(() {
            _currentView = 'main';
          });
        },
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildThemeView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Theme Settings', style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentView = 'main'),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildThemeOption('Light Mode', Icons.light_mode_outlined, true),
          _buildThemeOption('Dark Mode', Icons.dark_mode_outlined, false),
        ],
      ),
    );
  }

  Widget _buildThemeOption(String label, IconData icon, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF2E7D32)),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5)),
        trailing: isSelected ? const Icon(Icons.check, color: Color(0xFF2E7D32)) : null,
        onTap: () {
          // Select theme
          setState(() {
            _currentView = 'main';
          });
        },
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildHelpView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help Center', style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentView = 'main'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'FREQUENTLY ASKED QUESTIONS',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1),
            ),
            const SizedBox(height: 12),
            _buildFAQCard('How does AI predict expiry dates?', 'It estimates expiration days based on name and standard category shelf-lives.'),
            _buildFAQCard('Can I import database backups?', 'Yes! You can download a JSON snapshot in Backup settings and upload it later to restore.'),
            _buildFAQCard('How to configure alerts?', 'Reminders intervals can be adjusted under the Reminders tab settings panel.'),
            const SizedBox(height: 24),
            const Text(
              'CONTACT SUPPORT',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1),
            ),
            const SizedBox(height: 12),
            Form(
              key: _helpFormKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _helpNameController,
                    decoration: const InputDecoration(labelText: 'Name'),
                    validator: (val) => (val == null || val.isEmpty) ? 'Name required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _helpEmailController,
                    decoration: const InputDecoration(labelText: 'Email Address'),
                    validator: (val) => (val == null || !val.contains('@')) ? 'Valid email required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _helpMsgController,
                    maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Message', alignLabelWithHint: true),
                    validator: (val) => (val == null || val.isEmpty) ? 'Message required' : null,
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _submitSupportTicket,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2E7D32),
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: const Text('SUBMIT TICKET', style: TextStyle(fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildFAQCard(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ExpansionTile(
        title: Text(question, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
            child: Text(
              answer,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold, height: 1.4),
            ),
          )
        ],
      ),
    );
  }
}
