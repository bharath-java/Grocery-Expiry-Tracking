import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.register(
      _nameController.text.trim(),
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (success && mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Registration failed. Try again.'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                Text(
                  'Join Us! 🥬',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 28),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Create an account to automatically track your fresh items.',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 32),

                // Name Field
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Full Name is required';
                    if (value.length < 2) return 'Name must be at least 2 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Email Field
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email Address',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Email is required';
                    if (!value.contains('@')) return 'Enter a valid email address';
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Password Field
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Password is required';
                    if (value.length < 6) return 'Password must be at least 6 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                // Sign Up Button
                ElevatedButton(
                  onPressed: authProvider.loading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: authProvider.loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('CREATE ACCOUNT', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: Text('or', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
                    ),
                    Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
                  ],
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: authProvider.loading ? null : () => _handleGoogleSignIn(context, authProvider),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    side: BorderSide(color: Colors.grey.withOpacity(0.3)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('🌐   ', style: TextStyle(fontSize: 18)),
                      Text(
                        'Continue with Google',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).textTheme.bodyLarge?.color,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Sign In link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already have an account?'),
                    TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/login');
                      },
                      child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleGoogleSignIn(BuildContext context, AuthProvider authProvider) async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('🌐', style: TextStyle(fontSize: 24)),
                    const SizedBox(width: 12),
                    Text(
                      'Sign in with Google',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Choose an account to continue to Grocery Expiry Tracker',
                  style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                Divider(color: Colors.grey.withOpacity(0.2)),
                // Account 1
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.purpleAccent,
                    child: Text('BR', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  title: const Text('Bharath Reddy', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  subtitle: const Text('bharath.reddy@gmail.com', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                  onTap: () async {
                    Navigator.pop(context);
                    final success = await authProvider.googleLogin(
                      name: 'Bharath Reddy',
                      email: 'bharath.reddy@gmail.com',
                      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
                      googleId: '109283748291038291038',
                    );
                    if (success && mounted) {
                      Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
                    } else if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(authProvider.error ?? 'Google Sign-In failed'),
                          backgroundColor: Theme.of(context).colorScheme.error,
                        ),
                      );
                    }
                  },
                ),
                Divider(color: Colors.grey.withOpacity(0.2)),
                // Account 2
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.blueAccent,
                    child: Text('JD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  title: const Text('John Doe', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  subtitle: const Text('johndoe@gmail.com', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                  onTap: () async {
                    Navigator.pop(context);
                    final success = await authProvider.googleLogin(
                      name: 'John Doe',
                      email: 'johndoe@gmail.com',
                      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
                      googleId: '102938475610293847561',
                    );
                    if (success && mounted) {
                      Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
                    } else if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(authProvider.error ?? 'Google Sign-In failed'),
                          backgroundColor: Theme.of(context).colorScheme.error,
                        ),
                      );
                    }
                  },
                ),
                Divider(color: Colors.grey.withOpacity(0.2)),
                // Use another account
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.grey,
                    child: Icon(Icons.add, color: Colors.white),
                  ),
                  title: const Text('Use another account', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  onTap: () {
                    Navigator.pop(context);
                    _showCustomGoogleAccountDialog(context, authProvider);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showCustomGoogleAccountDialog(BuildContext context, AuthProvider authProvider) {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Add Google Account', style: TextStyle(fontWeight: FontWeight.w900)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Full Name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                decoration: const InputDecoration(labelText: 'Google Email'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CANCEL'),
            ),
            ElevatedButton(
              onPressed: () async {
                final name = nameCtrl.text.trim();
                final email = emailCtrl.text.trim();
                if (name.isEmpty || email.isEmpty || !email.contains('@')) return;
                Navigator.pop(context);
                final success = await authProvider.googleLogin(
                  name: name,
                  email: email,
                  googleId: DateTime.now().millisecondsSinceEpoch.toString(),
                );
                if (success && mounted) {
                  Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
                } else if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(authProvider.error ?? 'Google Sign-In failed'),
                      backgroundColor: Theme.of(context).colorScheme.error,
                    ),
                  );
                }
              },
              child: const Text('SIGN IN'),
            ),
          ],
        );
      },
    );
  }
}
