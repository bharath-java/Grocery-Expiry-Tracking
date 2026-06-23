import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class LandingView extends StatefulWidget {
  const LandingView({super.key});

  @override
  State<LandingView> createState() => _LandingViewState();
}

class _LandingViewState extends State<LandingView> {
  final PageController _pageController = PageController();
  int _activeSlide = 0;
  bool _showAuthOptions = false;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Widget _buildBlob(double top, double left, double size, Color color) {
    return Positioned(
      top: top,
      left: left,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          shape: BoxShape.circle,
        ),
      ),
    );
  }

  Widget _buildIllustration(int index) {
    switch (index) {
      case 0:
        return Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                color: Color(0xFFE8F5E9),
                shape: BoxShape.circle,
              ),
            ),
            const Icon(
              Icons.shopping_basket_rounded,
              size: 80,
              color: Color(0xFF2E7D32),
            ),
            Positioned(
              top: 30,
              right: 30,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
                  ],
                ),
                child: const Icon(Icons.alarm, color: Colors.amber, size: 24),
              ),
            ),
          ],
        );
      case 1:
        return Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                color: Color(0xFFE8F5E9),
                shape: BoxShape.circle,
              ),
            ),
            const Icon(
              Icons.calendar_month_rounded,
              size: 80,
              color: Color(0xFF2E7D32),
            ),
            Positioned(
              bottom: 30,
              left: 20,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFFFFEBEE),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.notification_important, color: Colors.red, size: 24),
              ),
            ),
          ],
        );
      case 2:
        return Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                color: Color(0xFFE8F5E9),
                shape: BoxShape.circle,
              ),
            ),
            const Icon(
              Icons.eco_rounded,
              size: 80,
              color: Color(0xFF2E7D32),
            ),
            Positioned(
              top: 25,
              left: 30,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
                  ],
                ),
                child: const Icon(Icons.attach_money, color: Colors.orange, size: 24),
              ),
            ),
          ],
        );
      case 3:
      default:
        return Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                color: Color(0xFFE8F5E9),
                shape: BoxShape.circle,
              ),
            ),
            const Icon(
              Icons.assessment_rounded,
              size: 80,
              color: Color(0xFF2E7D32),
            ),
            Positioned(
              top: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
                  ],
                ),
                child: const Icon(Icons.done_all_rounded, color: Color(0xFF2E7D32), size: 24),
              ),
            ),
          ],
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    // If user is already authenticated, automatically push to Dashboard
    if (authProvider.user != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      });
    }

    final double screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      body: Stack(
        children: [
          // Background Blobs
          _buildBlob(-40, -40, 200, Colors.green),
          _buildBlob(-20, MediaQuery.of(context).size.width - 150, 180, Colors.green),
          _buildBlob(screenHeight - 180, MediaQuery.of(context).size.width - 160, 220, Colors.green),
          _buildBlob(screenHeight - 160, -40, 180, Colors.green),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: _showAuthOptions
                  ? _buildAuthOptionsView(context, authProvider)
                  : _buildOnboardingView(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOnboardingView(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Skip Button
        Align(
          alignment: Alignment.topRight,
          child: _activeSlide > 0
              ? TextButton(
                  onPressed: () {
                    setState(() {
                      _showAuthOptions = true;
                    });
                  },
                  child: const Text(
                    'Skip',
                    style: TextStyle(
                      color: Color(0xFF1E293B),
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                )
              : const SizedBox(height: 48),
        ),

        // PageView Content
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (int index) {
              setState(() {
                _activeSlide = index;
              });
            },
            itemCount: 4,
            itemBuilder: (context, index) {
              String title;
              String subtitle;

              if (index == 0) {
                title = 'Grocery\nexpiry date\ntracking';
                subtitle = 'Track expiry dates, reduce waste and keep your groceries fresh.';
              } else if (index == 1) {
                title = 'Never miss\nan expiry date';
                subtitle = 'Get reminders before your groceries expire.';
              } else if (index == 2) {
                title = 'Reduce waste,\nsave money';
                subtitle = 'Use what you have and avoid unnecessary waste.';
              } else {
                title = 'Stay organized\nalways';
                subtitle = 'Keep track of all your groceries in one place.';
              }

              return Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24.0),
                      child: _buildIllustration(index),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: index == 0 ? 36 : 28,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF1E293B),
                      height: 1.15,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                      height: 1.5,
                    ),
                  ),
                ],
              );
            },
          ),
        ),

        // Bottom Controls
        Padding(
          padding: const EdgeInsets.only(bottom: 24.0, top: 16),
          child: Column(
            children: [
              // Dot indicators (Hidden on first page to match web app)
              SizedBox(
                height: 8,
                child: _activeSlide > 0
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(3, (idx) {
                          final isSelected = (_activeSlide - 1) == idx;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: isSelected ? 20 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF2E7D32) : const Color(0xFFCBD5E1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          );
                        }),
                      )
                    : const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),

              // Button
              ElevatedButton(
                onPressed: () {
                  if (_activeSlide == 0) {
                    _pageController.animateToPage(1,
                        duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
                  } else if (_activeSlide < 3) {
                    _pageController.animateToPage(_activeSlide + 1,
                        duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
                  } else {
                    setState(() {
                      _showAuthOptions = true;
                    });
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  _activeSlide == 0
                      ? 'GET STARTED'
                      : _activeSlide < 3
                          ? 'NEXT'
                          : 'LET\'S START',
                  style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAuthOptionsView(BuildContext context, AuthProvider authProvider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Back Button
        Align(
          alignment: Alignment.topLeft,
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
            onPressed: () {
              setState(() {
                _showAuthOptions = false;
                _activeSlide = 3;
              });
            },
          ),
        ),
        const Spacer(),
        // Logo Icon
        Center(
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Color(0xFFE8F5E9),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.cookie_outlined,
              size: 80,
              color: Color(0xFF2E7D32),
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Grocery Expiry Tracker',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
            letterSpacing: -0.5,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        const Text(
          'Sign in or register to keep tracking your fresh ingredients.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
          textAlign: TextAlign.center,
        ),
        const Spacer(),
        // Buttons
        ElevatedButton(
          onPressed: () {
            Navigator.pushNamed(context, '/login');
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2E7D32),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
          ),
          child: const Text(
            'SIGN IN',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton(
          onPressed: () {
            Navigator.pushNamed(context, '/register');
          },
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFF2E7D32), width: 2),
            foregroundColor: const Color(0xFF2E7D32),
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            'CREATE ACCOUNT',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
          ),
        ),
        const SizedBox(height: 20),
        TextButton(
          onPressed: () async {
            await authProvider.bypassAnonymously();
            if (context.mounted) {
              Navigator.pushReplacementNamed(context, '/dashboard');
            }
          },
          child: const Text(
            'TRY DEMO MODE',
            style: TextStyle(
              color: Color(0xFF2E7D32),
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
