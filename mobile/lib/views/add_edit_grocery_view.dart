import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/grocery_provider.dart';
import '../../models/grocery_item.dart';
import '../../core/utils/ai_predictor.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class AddEditGroceryView extends StatefulWidget {
  const AddEditGroceryView({super.key});

  @override
  State<AddEditGroceryView> createState() => _AddEditGroceryViewState();
}

class _AddEditGroceryViewState extends State<AddEditGroceryView> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nameController;
  late TextEditingController _quantityController;
  late TextEditingController _brandController;
  late TextEditingController _notesController;

  String _selectedCategory = 'Dairy & Eggs';
  DateTime _purchaseDate = DateTime.now();
  DateTime _expiryDate = DateTime.now().add(const Duration(days: 7));
  
  String? _localImagePath;
  bool _isEdit = false;
  String? _editingId;
  String? _existingImageUrl;
  bool _isArchived = false;

  final List<String> _categories = [
    'Dairy & Eggs',
    'Fruits & Vegetables',
    'Bakery',
    'Meat & Fish',
    'Pantry',
    'Beverages',
    'Snacks',
    'Others'
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _quantityController = TextEditingController();
    _brandController = TextEditingController();
    _notesController = TextEditingController();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    // Read route arguments for edit mode
    final args = ModalRoute.of(context)!.settings.arguments;
    if (args is GroceryItem) {
      _isEdit = true;
      _editingId = args.id;
      _nameController.text = args.itemName;
      _quantityController.text = args.quantity;
      _brandController.text = args.brand;
      _notesController.text = args.notes;
      _selectedCategory = args.category;
      _purchaseDate = args.purchaseDate;
      _expiryDate = args.expiryDate;
      _existingImageUrl = args.image;
      _isArchived = args.archived;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _brandController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  // Trigger local AI predictor shelf life calculation
  void _onNameOrCategoryChanged() {
    if (_isEdit) return; // Do not auto-override during edit mode
    
    final days = AIPredictor.predictExpiryDays(_nameController.text, _selectedCategory);
    setState(() {
      _expiryDate = _purchaseDate.add(Duration(days: days));
    });
  }

  Future<void> _selectDate(BuildContext context, bool isExpiry) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isExpiry ? _expiryDate : _purchaseDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        if (isExpiry) {
          _expiryDate = picked;
        } else {
          _purchaseDate = picked;
        }
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final XFile? image = await picker.pickImage(source: source, imageQuality: 70);
      if (image != null) {
        setState(() {
          _localImagePath = image.path;
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _saveItem() async {
    if (!_formKey.currentState!.validate()) return;

    final groceryProvider = Provider.of<GroceryProvider>(context, listen: false);
    bool success;

    if (_isEdit && _editingId != null) {
      success = await groceryProvider.updateGrocery(
        _editingId!,
        itemName: _nameController.text.trim(),
        category: _selectedCategory,
        quantity: _quantityController.text.trim(),
        purchaseDate: _purchaseDate,
        expiryDate: _expiryDate,
        brand: _brandController.text.trim(),
        notes: _notesController.text.trim(),
        localImagePath: _localImagePath,
      );
    } else {
      success = await groceryProvider.addGrocery(
        itemName: _nameController.text.trim(),
        category: _selectedCategory,
        quantity: _quantityController.text.trim(),
        purchaseDate: _purchaseDate,
        expiryDate: _expiryDate,
        brand: _brandController.text.trim(),
        notes: _notesController.text.trim(),
        localImagePath: _localImagePath,
      );
    }

    if (success && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isEdit ? 'Item updated successfully.' : 'Item added successfully.'),
          backgroundColor: Colors.green,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Failed to save grocery item.'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final groceryProvider = Provider.of<GroceryProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Grocery' : 'Add Grocery', style: const TextStyle(fontWeight: FontWeight.bold)),
        actions: _isEdit
            ? [
                IconButton(
                  icon: Icon(_isArchived ? Icons.unarchive_outlined : Icons.archive_outlined),
                  onPressed: () async {
                    final gp = Provider.of<GroceryProvider>(context, listen: false);
                    final ok = _isArchived 
                        ? await gp.restoreGrocery(_editingId!) 
                        : await gp.archiveGrocery(_editingId!);
                    if (ok && context.mounted) {
                      Navigator.pop(context);
                    }
                  },
                  tooltip: _isArchived ? 'Restore' : 'Archive',
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () async {
                    final gp = Provider.of<GroceryProvider>(context, listen: false);
                    final ok = await gp.deleteGrocery(_editingId!);
                    if (ok && context.mounted) {
                      Navigator.pop(context);
                    }
                  },
                  tooltip: 'Delete',
                ),
              ]
            : null,
      ),
      body: groceryProvider.loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Image Upload Selector Card
                    Center(
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.grey.withOpacity(0.2)),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: _localImagePath != null
                              ? Image.file(File(_localImagePath!), fit: BoxFit.cover)
                              : _existingImageUrl != null && _existingImageUrl!.isNotEmpty
                                  ? Image.network(_existingImageUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.camera_alt_outlined, size: 40))
                                  : InkWell(
                                      onTap: () => _showImageSourceSheet(),
                                      child: const Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.camera_alt_outlined, size: 40, color: Colors.grey),
                                          SizedBox(height: 8),
                                          Text('Add Photo', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                        ),
                      ),
                    ),
                    if (_localImagePath != null || (_existingImageUrl != null && _existingImageUrl!.isNotEmpty))
                      Center(
                        child: TextButton(
                          onPressed: () => _showImageSourceSheet(),
                          child: const Text('Change Photo'),
                        ),
                      ),
                    const SizedBox(height: 24),

                    // Item Name Input
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Item Name',
                        prefixIcon: Icon(Icons.shopping_bag_outlined),
                      ),
                      onChanged: (_) => _onNameOrCategoryChanged(),
                      validator: (val) => (val == null || val.isEmpty) ? 'Item Name is required' : null,
                    ),
                    const SizedBox(height: 16),

                    // Category Dropdown
                    DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      decoration: const InputDecoration(
                        labelText: 'Category',
                        prefixIcon: Icon(Icons.category_outlined),
                      ),
                      items: _categories.map((c) {
                        return DropdownMenuItem(value: c, child: Text(c));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedCategory = val;
                          });
                          _onNameOrCategoryChanged();
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    // Quantity Input
                    TextFormField(
                      controller: _quantityController,
                      decoration: const InputDecoration(
                        labelText: 'Quantity (e.g. 2 liters, 500g)',
                        prefixIcon: Icon(Icons.production_quantity_limits_outlined),
                      ),
                      validator: (val) => (val == null || val.isEmpty) ? 'Quantity is required' : null,
                    ),
                    const SizedBox(height: 16),

                    // Brand Input (Optional)
                    TextFormField(
                      controller: _brandController,
                      decoration: const InputDecoration(
                        labelText: 'Brand / Manufacturer',
                        prefixIcon: Icon(Icons.bookmark_outline),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Dates Grid View
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => _selectDate(context, false),
                            child: InputDecorator(
                              decoration: const InputDecoration(
                                labelText: 'Purchase Date',
                                prefixIcon: Icon(Icons.calendar_month_outlined),
                              ),
                              child: Text(DateFormat('MMM dd, yyyy').format(_purchaseDate)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: InkWell(
                            onTap: () => _selectDate(context, true),
                            child: InputDecorator(
                              decoration: const InputDecoration(
                                labelText: 'Expiry Date',
                                prefixIcon: Icon(Icons.warning_amber_outlined),
                              ),
                              child: Text(
                                DateFormat('MMM dd, yyyy').format(_expiryDate),
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    // AI Alert Helper Banner
                    if (!_isEdit)
                      Padding(
                        padding: const EdgeInsets.only(top: 12.0),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.purple.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.purple.withOpacity(0.15)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.psychology_outlined, color: Colors.purple, size: 20),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Smart AI predicted expiry based on shelf life standards.',
                                  style: TextStyle(color: Colors.purple, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),

                    // Notes Input
                    TextFormField(
                      controller: _notesController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Storage Notes / Location',
                        alignLabelWithHint: true,
                        prefixIcon: Icon(Icons.notes),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Save CTA Button
                    ElevatedButton(
                      onPressed: _saveItem,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 56),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: const Text('SAVE GROCERY ITEM', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined),
                title: const Text('Camera'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
