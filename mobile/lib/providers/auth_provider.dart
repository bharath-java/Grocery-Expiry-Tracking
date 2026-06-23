import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../models/user_info.dart';
import '../core/network/api_client.dart';

class AuthProvider extends ChangeNotifier {
  UserInfo? _user;
  bool _loading = false;
  String? _error;

  UserInfo? get user => _user;
  bool get loading => _loading;
  String? get error => _error;

  final _api = ApiClient().dio;

  AuthProvider() {
    initAuth();
  }

  // Load persistent user session or bypass anonymously in debug/first run
  Future<void> initAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final String? userStr = prefs.getString('user');
    final String? token = prefs.getString('accessToken');

    if (userStr != null && token != null) {
      try {
        _user = UserInfo.fromJson(jsonDecode(userStr));
      } catch (e) {
        await clearAuth();
      }
    } else {
      // Premium bypass default user profiles like authStore.ts
      await bypassAnonymously();
    }
    notifyListeners();
  }

  Future<void> bypassAnonymously() async {
    final prefs = await SharedPreferences.getInstance();
    final defaultUser = UserInfo(
      id: '60c72b2f9b1d8e234c8d4321',
      name: 'User',
      email: 'user@gmail.com',
      role: 'user',
      verified: true,
    );
    _user = defaultUser;
    await prefs.setString('user', jsonEncode(defaultUser.toJson()));
    await prefs.setString('accessToken', 'anonymous_bypass_token');
    await prefs.setString('refreshToken', 'anonymous_bypass_token');
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final responseData = response.data;
      if (responseData['success'] == true) {
        final data = responseData['data'];
        final userMap = data['user'];
        final accessToken = data['accessToken'];
        final refreshToken = data['refreshToken'];

        _user = UserInfo.fromJson(userMap);
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user', jsonEncode(_user!.toJson()));
        await prefs.setString('accessToken', accessToken);
        await prefs.setString('refreshToken', refreshToken);

        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error = responseData['message'] ?? 'Login failed';
      }
    } on DioException catch (e) {
      _error = e.response?.data['message'] ?? 'Failed to connect to backend';
    } catch (e) {
      _error = 'An unexpected error occurred';
    }

    _loading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register(String name, String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
      });

      final responseData = response.data;
      if (responseData['success'] == true) {
        _loading = false;
        notifyListeners();
        return true; // Requires OTP verification next
      } else {
        _error = responseData['message'] ?? 'Registration failed';
      }
    } on DioException catch (e) {
      _error = e.response?.data['message'] ?? 'Registration failed';
    } catch (e) {
      _error = 'An unexpected error occurred';
    }

    _loading = false;
    notifyListeners();
    return false;
  }

  Future<bool> verifyOtp(String email, String otp, String type) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post('/auth/verify-otp', data: {
        'email': email,
        'otp': otp,
        'type': type,
      });

      final responseData = response.data;
      if (responseData['success'] == true) {
        if (type == 'register') {
          // If verifying registration, automatically login
          final data = responseData['data'];
          final userMap = data['user'];
          final accessToken = data['accessToken'];
          final refreshToken = data['refreshToken'];

          _user = UserInfo.fromJson(userMap);
          
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', jsonEncode(_user!.toJson()));
          await prefs.setString('accessToken', accessToken);
          await prefs.setString('refreshToken', refreshToken);
        }

        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error = responseData['message'] ?? 'OTP Verification failed';
      }
    } on DioException catch (e) {
      _error = e.response?.data['message'] ?? 'OTP Verification failed';
    } catch (e) {
      _error = 'An unexpected error occurred';
    }

    _loading = false;
    notifyListeners();
    return false;
  }

  Future<bool> forgotPassword(String email) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post('/auth/forgot-password', data: {
        'email': email,
      });
      _loading = false;
      notifyListeners();
      return response.data['success'] == true;
    } catch (e) {
      _error = 'Failed to request password reset OTP';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPassword(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post('/auth/reset-password', data: {
        'email': email,
        'password': password,
      });
      _loading = false;
      notifyListeners();
      return response.data['success'] == true;
    } catch (e) {
      _error = 'Failed to reset password';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await clearAuth();
  }

  Future<void> clearAuth() async {
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    notifyListeners();
  }
}
