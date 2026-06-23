import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../models/grocery_item.dart';
import '../core/network/api_client.dart';

class GroceryProvider extends ChangeNotifier {
  List<GroceryItem> _groceries = [];
  List<GroceryItem> _archivedGroceries = [];
  bool _loading = false;
  
  int _expiredCount = 0;
  int _expiringSoonCount = 0;
  int _goodCount = 0;

  List<GroceryItem> get groceries => _groceries;
  List<GroceryItem> get archivedGroceries => _archivedGroceries;
  bool get loading => _loading;
  int get expiredCount => _expiredCount;
  int get expiringSoonCount => _expiringSoonCount;
  int get goodCount => _goodCount;

  final _api = ApiClient().dio;

  GroceryProvider() {
    loadOfflineCache();
  }

  // Recalculate shelf life metrics
  void recalculateMetrics(List<GroceryItem> list) {
    _expiredCount = 0;
    _expiringSoonCount = 0;
    _goodCount = 0;

    for (var item in list) {
      if (item.status == 'Expired') {
        _expiredCount++;
      } else if (item.status == 'Expiring Soon') {
        _expiringSoonCount++;
      } else {
        _goodCount++;
      }
    }
  }

  // Load from local storage cache for instant offline view
  Future<void> loadOfflineCache() async {
    final prefs = await SharedPreferences.getInstance();
    final String? cachedStr = prefs.getString('cachedGroceries');
    if (cachedStr != null) {
      try {
        final List<dynamic> decoded = jsonDecode(cachedStr);
        _groceries = decoded.map((e) => GroceryItem.fromJson(e)).toList();
        recalculateMetrics(_groceries);
        notifyListeners();
      } catch (_) {}
    }
  }

  // Save to offline storage cache
  Future<void> saveOfflineCache() async {
    final prefs = await SharedPreferences.getInstance();
    final listMap = _groceries.map((e) => e.toJson()).toList();
    await prefs.setString('cachedGroceries', jsonEncode(listMap));
  }

  Future<void> fetchGroceries({
    String? category,
    String? status,
    String? search,
    String? sortBy,
    String? order,
    bool archived = false,
  }) async {
    _loading = true;
    notifyListeners();

    try {
      final Map<String, dynamic> params = {
        'limit': 150,
        'archived': archived.toString(),
      };

      if (category != null && category.isNotEmpty) params['category'] = category;
      if (status != null && status.isNotEmpty) params['status'] = status;
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (sortBy != null && sortBy.isNotEmpty) params['sortBy'] = sortBy;
      if (order != null && order.isNotEmpty) params['order'] = order;

      final response = await _api.get('/groceries', queryParameters: params);
      final responseData = response.data;

      if (responseData['success'] == true) {
        final List<dynamic> listJson = responseData['data']['groceries'] ?? [];
        final List<GroceryItem> fetchedItems = listJson.map((e) => GroceryItem.fromJson(e)).toList();

        if (archived) {
          _archivedGroceries = fetchedItems;
        } else {
          _groceries = fetchedItems;
          recalculateMetrics(_groceries);
          await saveOfflineCache();
        }
      }
    } catch (e) {
      debugPrint('Error fetching groceries: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> addGrocery({
    required String itemName,
    required String category,
    required String quantity,
    required DateTime purchaseDate,
    required DateTime expiryDate,
    String notes = '',
    String brand = '',
    String? localImagePath, // Support local image uploads
  }) async {
    _loading = true;
    notifyListeners();

    try {
      MultipartFile? imageFile;
      if (localImagePath != null && localImagePath.isNotEmpty) {
        imageFile = await MultipartFile.fromFile(localImagePath, filename: 'grocery.jpg');
      }

      final formData = FormData.fromMap({
        'itemName': itemName,
        'category': category,
        'quantity': quantity,
        'purchaseDate': purchaseDate.toIso8601String(),
        'expiryDate': expiryDate.toIso8601String(),
        'notes': notes,
        'brand': brand,
        if (imageFile != null) 'image': imageFile,
      });

      final response = await _api.post('/groceries', data: formData);

      if (response.data['success'] == true) {
        await fetchGroceries();
        return true;
      }
    } catch (e) {
      debugPrint('Error adding grocery: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> updateGrocery(
    String id, {
    required String itemName,
    required String category,
    required String quantity,
    required DateTime purchaseDate,
    required DateTime expiryDate,
    String notes = '',
    String brand = '',
    String? localImagePath,
  }) async {
    _loading = true;
    notifyListeners();

    try {
      MultipartFile? imageFile;
      if (localImagePath != null && localImagePath.isNotEmpty) {
        imageFile = await MultipartFile.fromFile(localImagePath, filename: 'grocery.jpg');
      }

      final formData = FormData.fromMap({
        'itemName': itemName,
        'category': category,
        'quantity': quantity,
        'purchaseDate': purchaseDate.toIso8601String(),
        'expiryDate': expiryDate.toIso8601String(),
        'notes': notes,
        'brand': brand,
        if (imageFile != null) 'image': imageFile,
      });

      final response = await _api.put('/groceries/$id', data: formData);

      if (response.data['success'] == true) {
        await fetchGroceries();
        return true;
      }
    } catch (e) {
      debugPrint('Error updating grocery: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> deleteGrocery(String id) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.delete('/groceries/$id');
      if (response.data['success'] == true) {
        await fetchGroceries();
        return true;
      }
    } catch (e) {
      debugPrint('Error deleting grocery: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> archiveGrocery(String id) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.put('/groceries/$id/archive');
      if (response.data['success'] == true) {
        await fetchGroceries();
        return true;
      }
    } catch (e) {
      debugPrint('Error archiving grocery: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> restoreGrocery(String id) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.put('/groceries/$id/restore');
      if (response.data['success'] == true) {
        await fetchGroceries();
        await fetchGroceries(archived: true);
        return true;
      }
    } catch (e) {
      debugPrint('Error restoring grocery: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
    return false;
  }
}
