import 'package:flutter/material.dart';

class AppColors {
  // Light Mode Colors
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightTextPrimary = Color(0xFF1E293B);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightBorder = Color(0xFFF1F5F9);
  static const Color lightInputBackground = Color(0xFFF8FAFC);

  // Dark Mode Colors
  static const Color darkBackground = Color(0xFF09090B);
  static const Color darkCard = Color(0xFF18181B);
  static const Color darkTextPrimary = Color(0xFFF4F4F5);
  static const Color darkTextSecondary = Color(0xFFA1A1AA);
  static const Color darkBorder = Color(0xFF27272A);
  static const Color darkInputBackground = Color(0xFF18181B);

  // Core App Colors (Unified)
  static const Color primary = Color(0xFF2E7D32); // Deep forest green
  static const Color primaryLight = Color(0xFF4CAF50); // Accent light green
  static const Color primaryBgLight = Color(0xFFE8F5E9); // Soft green badge background
  static const Color primaryBgDark = Color(0xFF14532D);

  // Expiry Status Colors
  static const Color statusExpired = Color(0xFFEF5350); // Red
  static const Color statusExpiringSoon = Color(0xFFFFA726); // Orange
  static const Color statusFresh = Color(0xFF4CAF50); // Green

  static ThemeData getLightTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primary,
      scaffoldBackgroundColor: lightBackground,
      cardColor: lightCard,
      dividerColor: lightBorder,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: primaryLight,
        background: lightBackground,
        surface: lightCard,
        error: statusExpired,
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: lightTextPrimary, fontSize: 16),
        bodyMedium: TextStyle(color: lightTextSecondary, fontSize: 14),
        titleLarge: TextStyle(color: lightTextPrimary, fontSize: 20, fontWeight: FontWeight.bold),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: lightInputBackground,
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
      ),
    );
  }

  static ThemeData getDarkTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryLight,
      scaffoldBackgroundColor: darkBackground,
      cardColor: darkCard,
      dividerColor: darkBorder,
      colorScheme: const ColorScheme.dark(
        primary: primaryLight,
        secondary: primary,
        background: darkBackground,
        surface: darkCard,
        error: statusExpired,
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: darkTextPrimary, fontSize: 16),
        bodyMedium: TextStyle(color: darkTextSecondary, fontSize: 14),
        titleLarge: TextStyle(color: darkTextPrimary, fontSize: 20, fontWeight: FontWeight.bold),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: darkInputBackground,
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryLight, width: 2),
        ),
      ),
    );
  }
}
