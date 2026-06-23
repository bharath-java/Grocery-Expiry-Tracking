import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class OtpView extends StatefulWidget {
  const OtpView({super.key});

  @override
  State<OtpView> createState() => _OtpViewState();
}

class _OtpViewState extends State<OtpView> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleVerify(String email, String type) async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.verifyOtp(
      email,
      _otpController.text.trim(),
      type,
    );

    if (success && mounted) {
      if (type == 'register') {
        Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
      } else {
        // Direct reset password view
        Navigator.pushReplacementNamed(
          context, 
          '/reset-password',
          arguments: {'email': email},
        );
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Invalid verification code.'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Read route arguments safely
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    final String email = args['email'] ?? '';
    final String type = args['type'] ?? 'register';

    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verify Code', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text(
                  'Enter Code 📬',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 28),
                ),
                const SizedBox(height: 8),
                Text(
                  'We sent a 6-digit OTP code to $email. Please enter it below to verify.',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 32),

                // OTP Input
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                  decoration: const InputDecoration(
                    labelText: 'Verification Code',
                    floatingLabelBehavior: FloatingLabelBehavior.never,
                    hintText: '000000',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Verification code is required';
                    if (value.length != 6) return 'Verification code must be exactly 6 digits';
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                // Verify Button
                ElevatedButton(
                  onPressed: authProvider.loading ? null : () => _handleVerify(email, type),
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
                      : const Text('VERIFY', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
