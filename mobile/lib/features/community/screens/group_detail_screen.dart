import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/community_repository.dart';
import 'group_chat_screen.dart';

/// Group detail. This sprint shows the async DISCUSSION board plus a placeholder
/// for the live "Chat" tab, which becomes real-time in Sprint 5 (Channels).
class GroupDetailScreen extends StatefulWidget {
  final Map group;
  const GroupDetailScreen({super.key, required this.group});
  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen>
    with SingleTickerProviderStateMixin {
  final _repo = CommunityRepository();
  final _postController = TextEditingController();
  late TabController _tabs;
  List<dynamic> _posts = [];
  bool _loading = true;
  bool _sending = false;

  String get _groupId => widget.group['id'];
  bool get _isMember => widget.group['is_member'] == true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadPosts();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _postController.dispose();
    super.dispose();
  }

  Future<void> _loadPosts() async {
    try {
      final data = await _repo.getGroupPosts(_groupId);
      if (mounted) setState(() { _posts = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendPost() async {
    final text = _postController.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      await _repo.createGroupPost(_groupId, text);
      _postController.clear();
      await _loadPosts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Join the group to post a message.')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(widget.group['name'] ?? 'Group',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(children: [
              Icon(Icons.circle, size: 10, color: AppColors.success),
              const SizedBox(width: 5),
              Text('Connected', style: TextStyle(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w500)),
            ]),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.action,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          tabs: const [Tab(text: 'Discussion'), Tab(text: 'Chat')],
        ),
      ),
      body: TabBarView(controller: _tabs, children: [
        _discussionTab(),
        _chatTab(),
      ]),
    );
  }

  Widget _discussionTab() => Column(children: [
    Expanded(
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _posts.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.chat_outlined, size: 56, color: AppColors.primaryLight),
                  const SizedBox(height: 12),
                  Text('No posts yet — start the discussion', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                ]))
              : ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: _posts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _postCard(_posts[i]),
                ),
    ),
    _postInput(),
  ]);

  Widget _postCard(Map post) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.inputBorder, width: 0.5),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(post['author_name'] ?? '',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.primaryMid)),
      const SizedBox(height: 6),
      Text(post['body'] ?? '', style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5)),
    ]),
  );

  Widget _postInput() => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
    child: SafeArea(top: false, child: Row(children: [
      Expanded(child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(30)),
        child: TextField(
          controller: _postController,
          enabled: _isMember,
          style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
          decoration: InputDecoration.collapsed(
              hintText: _isMember ? 'Message the group...' : 'Join to post a message',
              hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 15)),
          onSubmitted: (_) => _sendPost(),
          maxLines: null,
        ),
      )),
      const SizedBox(width: 10),
      GestureDetector(
        onTap: (_isMember && !_sending) ? _sendPost : null,
        child: Container(
          width: 48, height: 48,
          decoration: BoxDecoration(
              color: _isMember ? AppColors.action : AppColors.actionDisabled, shape: BoxShape.circle),
          child: _sending
              ? const Padding(padding: EdgeInsets.all(14), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.send_rounded, color: Colors.white, size: 22),
        ),
      ),
    ])),
  );

  Widget _chatTab() => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.forum_outlined, size: 56, color: AppColors.primaryLight),
        const SizedBox(height: 14),
        Text('Live group chat', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        Text('Chat in real time with group members', textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity, height: 52,
          child: ElevatedButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => GroupChatScreen(
                groupId: widget.group['id'], groupName: widget.group['name'] ?? 'Group'),
            )),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.action, elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: Text('Open chat',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
          ),
        ),
      ]),
    ),
  );
}
