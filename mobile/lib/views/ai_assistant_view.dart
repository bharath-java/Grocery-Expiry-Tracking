import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/network/api_client.dart';
import 'package:dio/dio.dart';

class AIAssistantView extends StatefulWidget {
  const AIAssistantView({super.key});

  @override
  State<AIAssistantView> createState() => _AIAssistantViewState();
}

class _AIAssistantViewState extends State<AIAssistantView> {
  Map<String, dynamic>? _activeAssistant;
  final List<Map<String, dynamic>> _messages = [];
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  
  bool _isGenerating = false;
  bool _loadingHistory = false;

  final List<Map<String, dynamic>> _assistants = [
    {
      'id': 'ALEX',
      'name': 'ALEX',
      'title': 'AI Prediction Expert',
      'emoji': '🧠',
      'purpose': ['Predict expiry dates', 'Suggest shelf life', 'Recommend storage methods', 'Analyze grocery freshness'],
      'examples': ['When will my milk expire?', 'How long can bananas stay fresh?', 'Is this product still safe to consume?'],
      'welcome': "Hi {userName} 👋 I'm Alex. I'll help you understand product freshness, shelf life, and expiry dates."
    },
    {
      'id': 'MAYA',
      'name': 'MAYA',
      'title': 'Recipe Assistant',
      'emoji': '🍽️',
      'purpose': ['Generate recipes from groceries', 'Suggest meals using expiring items', 'Recommend healthy combinations'],
      'examples': ['What can I cook with eggs and tomatoes?', 'Give me a breakfast recipe.', 'Use items that expire tomorrow.'],
      'welcome': "Hello {userName} 🍽️ I'm Maya. Tell me what ingredients you have, and I'll help you cook something delicious."
    },
    {
      'id': 'BUDDY',
      'name': 'BUDDY',
      'title': 'Food Waste Prevention AI',
      'emoji': '♻️',
      'purpose': ['Prevent food waste', 'Suggest which items to consume first', 'Create priority consumption plans'],
      'examples': ['Which items should I use today?', 'How can I reduce food waste?', 'What groceries are at risk?'],
      'welcome': "Hey {userName} ♻️ I'm Buddy. Let's save food and reduce waste together."
    },
    {
      'id': 'SAM',
      'name': 'SAM',
      'title': 'Analytics Assistant',
      'emoji': '📊',
      'purpose': ['Analyze grocery usage', 'Generate insights', 'Show trends and recommendations'],
      'examples': ['Which items do I waste most?', 'Monthly waste analysis.', 'Grocery spending trends.'],
      'welcome': "Hi {userName} 📊 I'm Sam. I can help you understand your grocery trends and shopping habits."
    }
  ];

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 100,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _selectAssistant(Map<String, dynamic> assistant) async {
    setState(() {
      _activeAssistant = assistant;
      _messages.clear();
      _loadingHistory = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userName = authProvider.user?.name ?? 'User';

    try {
      final response = await ApiClient().dio.get('/ai/history', queryParameters: {
        'assistant': assistant['name'].toString().toLowerCase(),
      });

      final historyData = response.data['data'];
      if (historyData != null && historyData.length > 0) {
        setState(() {
          for (var chat in historyData) {
            _messages.add({
              'sender': chat['role'] == 'user' ? 'user' : 'ai',
              'text': chat['content'] ?? '',
              'timestamp': DateTime.parse(chat['timestamp'] ?? DateTime.now().toIso8601String()),
            });
          }
        });
      } else {
        // Welcoming greeting
        setState(() {
          _messages.add({
            'sender': 'ai',
            'text': assistant['welcome'].toString().replaceAll('{userName}', userName),
            'timestamp': DateTime.now(),
          });
        });
      }
    } catch (e) {
      // Fallback greeting
      setState(() {
        _messages.add({
          'sender': 'ai',
          'text': assistant['welcome'].toString().replaceAll('{userName}', userName),
          'timestamp': DateTime.now(),
        });
      });
    } finally {
      setState(() {
        _loadingHistory = false;
      });
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    }
  }

  Future<void> _sendMessage([String? textOverride]) async {
    final text = textOverride ?? _inputController.text.trim();
    if (text.isEmpty || _activeAssistant == null || _isGenerating) return;

    setState(() {
      _messages.add({
        'sender': 'user',
        'text': text,
        'timestamp': DateTime.now(),
      });
      if (textOverride == null) _inputController.clear();
      _isGenerating = true;
    });
    _scrollToBottom();

    try {
      final response = await ApiClient().dio.post('/ai/chat', data: {
        'assistant': _activeAssistant!['name'].toString().toLowerCase(),
        'message': text,
      });

      final aiText = response.data['response'] ?? 'Unable to reach AI service. Please try again.';
      setState(() {
        _messages.add({
          'sender': 'ai',
          'text': aiText,
          'timestamp': DateTime.now(),
        });
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'sender': 'ai',
          'text': 'Unable to reach AI service. Please try again.',
          'timestamp': DateTime.now(),
        });
      });
    } finally {
      setState(() {
        _isGenerating = false;
      });
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    }
  }

  Future<void> _clearChatHistory() async {
    if (_activeAssistant == null) return;
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Chat History'),
        content: Text('Are you sure you want to clear your chat logs with ${_activeAssistant!['name']}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('CANCEL')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('CLEAR', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiClient().dio.delete('/ai/history', queryParameters: {
        'assistant': _activeAssistant!['name'].toString().toLowerCase(),
      });
      
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userName = authProvider.user?.name ?? 'User';

      setState(() {
        _messages.clear();
        _messages.add({
          'sender': 'ai',
          'text': _activeAssistant!['welcome'].toString().replaceAll('{userName}', userName),
          'timestamp': DateTime.now(),
        });
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to clear chat history.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_activeAssistant != null) {
      return _buildChatInterface();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart AI Assistants', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(24.0),
            child: Text(
              'SELECT A SPECIALIZED AI AGENT',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12, letterSpacing: 1),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.0,
              ),
              itemCount: _assistants.length,
              itemBuilder: (context, index) {
                final assistant = _assistants[index];
                return Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                    side: BorderSide(color: Colors.grey.withOpacity(0.15)),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () => _selectAssistant(assistant),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            assistant['emoji'],
                            style: const TextStyle(fontSize: 40),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            assistant['name'],
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            assistant['title'],
                            style: TextStyle(fontSize: 10, color: Colors.grey[500], fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatInterface() {
    final assistant = _activeAssistant!;
    final List<String> examples = List<String>.from(assistant['examples']);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Text(assistant['emoji']),
            const SizedBox(width: 8),
            Text(assistant['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: _clearChatHistory,
            tooltip: 'Clear Chat History',
          ),
        ],
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            setState(() {
              _activeAssistant = null;
            });
          },
        ),
      ),
      body: Column(
        children: [
          // Chat Stream Message List
          Expanded(
            child: _loadingHistory
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: Colors.purple),
                        SizedBox(height: 12),
                        Text('Syncing Chat Logs...', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isUser = msg['sender'] == 'user';
                      return _buildMessageBubble(msg['text'], isUser, msg['timestamp']);
                    },
                  ),
          ),

          // Suggestion Chips Helper Box
          if (_messages.length <= 1 && !_isGenerating)
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0, left: 16, right: 16),
              child: SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: examples.length,
                  itemBuilder: (context, idx) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ActionChip(
                        label: Text(examples[idx], style: const TextStyle(fontSize: 11)),
                        backgroundColor: Theme.of(context).cardColor,
                        onPressed: () => _sendMessage(examples[idx]),
                      ),
                    );
                  },
                ),
              ),
            ),

          // Generating indicator banner
          if (_isGenerating)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.purple),
                  ),
                  SizedBox(width: 8),
                  Text('Typing...', style: TextStyle(color: Colors.grey, fontSize: 11)),
                ],
              ),
            ),

          // Input Send Action Field Box
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      decoration: InputDecoration(
                        hintText: 'Ask ${_activeAssistant!['name']}...',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    icon: const Icon(Icons.send),
                    onPressed: _sendMessage,
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(String text, bool isUser, DateTime timestamp) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        decoration: BoxDecoration(
          color: isUser 
              ? Colors.purple.withOpacity(0.12)
              : Theme.of(context).cardColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
            bottomRight: isUser ? Radius.zero : const Radius.circular(16),
          ),
          border: Border.all(
            color: isUser 
                ? Colors.purple.withOpacity(0.2)
                : Colors.grey.withOpacity(0.15),
            width: 1,
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(fontSize: 13, height: 1.4),
        ),
      ),
    );
  }
}
