import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/forum_repository.dart';
import '../../auth/providers/auth_provider.dart';

class PostDetailScreen extends ConsumerStatefulWidget {
  final String postId;
  const PostDetailScreen({super.key, required this.postId});
  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _repo = ForumRepository();
  final _replyController = TextEditingController();
  Map<String, dynamic>? _post;
  bool _loading = true;
  Timer? _aiPollTimer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _repo.getPostDetail(widget.postId);
      if (mounted) {
        setState(() { _post = data; _loading = false; });
        // Poll for AI answer if not yet ready
        if (data['ai_answer'] == null) _startAiPoll();
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _startAiPoll() {
    _aiPollTimer = Timer.periodic(const Duration(seconds: 3), (t) async {
      final data = await _repo.getPostDetail(widget.postId);
      if (data['ai_answer'] != null && mounted) {
        setState(() => _post = data);
        t.cancel();
      }
    });
  }

  Future<void> _sendReply() async {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;
    _replyController.clear();
    await _repo.createReply(widget.postId, text);
    _load();
  }

  Future<void> _upvote(String replyId) async {
    await _repo.upvoteReply(replyId);
    _load();
  }

  Future<void> _markBest(String replyId) async {
    await _repo.markBestAnswer(replyId);
    _load();
  }

  @override
  void dispose() {
    _aiPollTimer?.cancel();
    _replyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(authProvider).user;
    final isAuthor = _post != null && currentUser != null && _post!['author']?['id'] == currentUser.id;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20), onPressed: () => context.pop()),
        title: Text('Question', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _post == null
              ? Center(child: Text('Could not load question', style: TextStyle(color: AppColors.textSecondary)))
              : Column(children: [
                  Expanded(child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_post!['title'] ?? '', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1.3)),
                      const SizedBox(height: 10),
                      Text(_post!['body'] ?? '', style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.5)),
                      const SizedBox(height: 16),
                      _authorRow(_post!['author'] ?? {}, _post!['created_at']),
                      const SizedBox(height: 20),
                      _aiAnswerCard(),
                      const SizedBox(height: 24),
                      Text('${_post!['reply_count'] ?? 0} Replies', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      const SizedBox(height: 12),
                      ...((_post!['replies'] ?? []) as List).map((r) => _replyCard(r, isAuthor)),
                    ]),
                  )),
                  _replyInput(),
                ]),
    );
  }

  Widget _authorRow(Map author, String? createdAt) => Row(children: [
    Container(width: 40, height: 40, decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
        child: Center(child: Text(author['initials'] ?? '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)))),
    const SizedBox(width: 10),
    Text(author['display_name'] ?? '', style: TextStyle(fontSize: 14, color: AppColors.primaryMid, fontWeight: FontWeight.w500)),
    Text(' · ${_timeAgo(createdAt)}', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
  ]);

  Widget _aiAnswerCard() {
    final aiAnswer = _post!['ai_answer'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFE6F1FB), borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.smart_toy_outlined, size: 20, color: const Color(0xFF2E75B6)),
          const SizedBox(width: 8),
          Text('AI Answer', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF2E75B6))),
        ]),
        const SizedBox(height: 10),
        aiAnswer == null
            ? Row(children: [
                const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                const SizedBox(width: 10),
                Text('Generating answer...', style: TextStyle(fontSize: 14, color: const Color(0xFF2D5580))),
              ])
            : Text(aiAnswer, style: TextStyle(fontSize: 14, color: const Color(0xFF2D5580), height: 1.5)),
      ]),
    );
  }

  Widget _replyCard(Map reply, bool isAuthor) {
    final author = reply['author'] ?? {};
    final isTeacher = author['is_teacher'] ?? false;
    final upvoted = reply['user_has_upvoted'] ?? false;
    final isBest = reply['is_best_answer'] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.inputBorder, width: 0.5)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 36, height: 36, decoration: BoxDecoration(color: AppColors.primaryMid, shape: BoxShape.circle),
              child: Center(child: Text(author['initials'] ?? '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)))),
          const SizedBox(width: 10),
          Text(author['display_name'] ?? '', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          if (isTeacher) ...[
            const SizedBox(width: 6),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(12)),
                child: Text('Teacher', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w500))),
          ],
          const Spacer(),
          if (isBest)
            Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(20)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.check, size: 12, color: Colors.white), const SizedBox(width: 4),
                  const Text('Best Answer', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500)),
                ])),
        ]),
        const SizedBox(height: 10),
        Text(reply['body'] ?? '', style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5)),
        const SizedBox(height: 12),
        Row(children: [
          GestureDetector(
            onTap: () => _upvote(reply['id']),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: upvoted ? AppColors.successLight : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: upvoted ? AppColors.success : AppColors.inputBorder, width: 0.5),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.keyboard_arrow_up, size: 16, color: upvoted ? AppColors.success : AppColors.textSecondary),
                const SizedBox(width: 4),
                Text('${reply['upvote_count'] ?? 0}', style: TextStyle(fontSize: 13, color: upvoted ? AppColors.success : AppColors.textSecondary, fontWeight: FontWeight.w500)),
              ]),
            ),
          ),
          if (isAuthor && !isBest) ...[
            const SizedBox(width: 10),
            GestureDetector(
              onTap: () => _markBest(reply['id']),
              child: Text('Mark as best', style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w500)),
            ),
          ],
        ]),
      ]),
    );
  }

  Widget _replyInput() => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
    child: SafeArea(top: false, child: Row(children: [
      Expanded(child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(30)),
        child: TextField(controller: _replyController, style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
            decoration: InputDecoration.collapsed(hintText: 'Write a reply...', hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 15)),
            onSubmitted: (_) => _sendReply(), maxLines: null),
      )),
      const SizedBox(width: 10),
      GestureDetector(onTap: _sendReply, child: Container(width: 48, height: 48,
          decoration: BoxDecoration(color: AppColors.action, shape: BoxShape.circle),
          child: const Icon(Icons.send_rounded, color: Colors.white, size: 22))),
    ])),
  );

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final date = DateTime.tryParse(iso);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
