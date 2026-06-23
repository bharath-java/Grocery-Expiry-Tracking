import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/grocery_provider.dart';
import 'core/constants/colors.dart';
import 'core/services/notification_service.dart';
import 'views/landing_view.dart';
import 'views/login_view.dart';
import 'views/register_view.dart';
import 'views/otp_view.dart';
import 'views/forgot_password_view.dart';
import 'views/reset_password_view.dart';
import 'views/dashboard_view.dart';
import 'views/add_edit_grocery_view.dart';
import 'views/all_groceries_view.dart';
import 'views/categories_view.dart';
import 'views/reminders_view.dart';
import 'views/ai_assistant_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize local and push notification handlers
  await NotificationService().init();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => GroceryProvider()),
      ],
      child: MaterialApp(
        title: 'Grocery Expiry Tracker',
        theme: AppColors.getLightTheme(),
        darkTheme: AppColors.getDarkTheme(),
        themeMode: ThemeMode.system, // Dynamically follow device system themes
        debugShowCheckedModeBanner: false,
        initialRoute: '/landing',
        routes: {
          '/landing': (context) => const LandingView(),
          '/login': (context) => const LoginView(),
          '/register': (context) => const RegisterView(),
          '/otp': (context) => const OtpView(),
          '/forgot-password': (context) => const ForgotPasswordView(),
          '/reset-password': (context) => const ResetPasswordView(),
          '/dashboard': (context) => const DashboardView(),
          '/add-grocery': (context) => const AddEditGroceryView(),
          '/all-groceries': (context) => const AllGroceriesView(),
          '/categories': (context) => const CategoriesView(),
          '/reminders': (context) => const RemindersView(),
          '/ai-assistant': (context) => const AIAssistantView(),
        },
      ),
    );
  }
}
