import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/websocket_service.dart';
import '../data/community_repository.dart';
import '../../auth/providers/auth_provider.dart';

class GroupChatScreen extends ConsumerStatefulWidget {
  final String groupId;
  final String groupName;
  const GroupChatScreen({super.key, required this.groupId, required this.groupName});
  @override
  ConsumerState<GroupChatScreen> createState() => _GroupChatScreenState();
}

class _GroupChatScreenState extends ConsumerState<GroupChatScreen> {
  final _ws = WebSocketService();
  final _repo = CommunityRepository();
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  bool _connected = false;
  bool _loadingHistory = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _loadHistory();
    _ws.connectionStatus.listen((status) {
      if (mounted) setState(() => _connected = status);
    });
    _ws.messages.listen((msg) {
      if (mounted) {
        setState(() => _messages.add(msg));
        _scrollToBottom();
      }
    });
    await _ws.connect(widget.groupId);
  }

  Future<void> _loadHistory() async {
    try {
      final history = await _repo.getChatHistory(widget.groupId);
      if (mounted) {
        setState(() {
          _messages.addAll(history.cast<Map<String, dynamic>>());
          _loadingHistory = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loadingHistory = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty || !_connected) return;
    _ws.sendMessage(text);
    _controller.clear();
  }

  @override
  void dispose() {
    _ws.dispose();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20), onPressed: () => Navigator.pop(context)),
        title: Text(widget.groupName, style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(children: [
              Icon(Icons.circle, size: 10, color: _connected ? AppColors.success : AppColors.textMuted),
              const SizedBox(width: 6),
              Text(_connected ? 'Connected' : 'Connecting...',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _connected ? AppColors.success : AppColors.textMuted)),
            ]),
          ),
        ],
      ),
      body: Column(children: [
        Expanded(
          child: _loadingHistory
              ? const Center(child: CircularProgressIndicator())
              : _messages.isEmpty
                  ? Center(child: Text('No messages yet — say hello 👋',
                      style: TextStyle(fontSize: 14, color: AppColors.textSecondary)))
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) => _messageBubble(_messages[i], currentUser?.id),
                    ),
        ),
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          child: SafeArea(top: false, child: Row(children: [
            Expanded(child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(30)),
              child: TextField(controller: _controller, style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
                  decoration: InputDecoration.collapsed(hintText: 'Message the group...', hintStyle: TextStyle(color: AppColors.textMuted)),
                  onSubmitted: (_) => _send(), maxLines: null),
            )),
            const SizedBox(width: 10),
            GestureDetector(onTap: _send, child: Container(width: 48, height: 48,
                decoration: BoxDecoration(color: _connected ? AppColors.action : AppColors.actionDisabled, shape: BoxShape.circle),
                child: const Icon(Icons.send_rounded, color: Colors.white, size: 22))),
          ])),
        ),
      ]),
    );
  }

  Widget _messageBubble(Map<String, dynamic> msg, String? currentUserId) {
    final isMine = msg['sender_id'] == currentUserId;
    final isTeacher = msg['is_teacher'] ?? false;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
        if (!isMine)
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 4),
            child: Row(children: [
              Text(msg['sender_name'] ?? '', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.primaryMid)),
              if (isTeacher) ...[
                const SizedBox(width: 6),
                Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(12)),
                    child: Text('Teacher', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w500))),
              ],
            ]),
          ),
        Container(
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isMine ? AppColors.primary : AppColors.primaryLight,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(18), topRight: const Radius.circular(18),
              bottomLeft: Radius.circular(isMine ? 18 : 4), bottomRight: Radius.circular(isMine ? 4 : 18),
            ),
          ),
          child: Text(msg['body'] ?? '', style: TextStyle(fontSize: 15, color: isMine ? Colors.white : AppColors.textPrimary, height: 1.4)),
        ),
      ]),
    );
  }
}
