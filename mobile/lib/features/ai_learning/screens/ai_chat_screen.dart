import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/ai_provider.dart';

class AIChatScreen extends ConsumerStatefulWidget {
  const AIChatScreen({super.key});
  @override
  ConsumerState<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends ConsumerState<AIChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _showBanner = true;

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    await ref.read(chatProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatProvider);

    // Scroll on new message
    if (state.messages.isNotEmpty) _scrollToBottom();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text('AI tutor', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)),
            child: const Text('EN', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
          ),
        ],
      ),
      body: Column(children: [
        // Quota banner
        if (_showBanner && !(state.usage?['is_pro'] ?? false))
          Container(
            color: const Color(0xFFFFF3E0),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(children: [
              Expanded(child: Text.rich(TextSpan(children: [
                TextSpan(
                  text: '${state.usage?['used'] ?? 0} of ${state.usage?['limit'] ?? 20} queries used · ',
                  style: TextStyle(fontSize: 13, color: const Color(0xFF7A4B00)),
                ),
                TextSpan(
                  text: 'Upgrade for unlimited',
                  style: TextStyle(fontSize: 13, color: AppColors.action, decoration: TextDecoration.underline, fontWeight: FontWeight.w500),
                ),
              ]))),
              GestureDetector(
                onTap: () => setState(() => _showBanner = false),
                child: Icon(Icons.close, size: 18, color: AppColors.textSecondary),
              ),
            ]),
          ),

        // Messages
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            itemCount: state.messages.length + (state.isLoading ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == state.messages.length) {
                return _typingIndicator();
              }
              final msg = state.messages[index];
              return _buildMessage(msg);
            },
          ),
        ),

        // Error (e.g. quota)
        if (state.error != null)
          Container(
            width: double.infinity,
            color: AppColors.errorLight,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Text(
              state.error == 'quota_exceeded'
                  ? 'Monthly AI limit reached. Upgrade to Pro for unlimited access.'
                  : state.error!,
              style: TextStyle(color: AppColors.error, fontSize: 13),
            ),
          ),

        // Input bar
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          child: SafeArea(
            top: false,
            child: Row(children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: TextField(
                    controller: _controller,
                    style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
                    decoration: InputDecoration.collapsed(
                      hintText: 'Ask your AI tutor...',
                      hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 15),
                    ),
                    onSubmitted: (_) => _send(),
                    maxLines: null,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: state.isLoading ? null : _send,
                child: Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: state.isLoading ? AppColors.actionDisabled : AppColors.action,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.send_rounded, color: Colors.white, size: 22),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _buildMessage(ChatMessage msg) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: const Center(child: Text('B', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13))),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? AppColors.primary : AppColors.primaryLight,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
              ),
              child: Text(
                msg.content,
                style: TextStyle(
                  fontSize: 15,
                  color: isUser ? Colors.white : AppColors.textPrimary,
                  height: 1.5,
                ),
              ),
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _typingIndicator() => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(children: [
      Container(
        width: 32, height: 32,
        decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
        child: const Center(child: Text('B', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13))),
      ),
      const SizedBox(width: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(18), topRight: Radius.circular(18),
          bottomLeft: Radius.circular(4), bottomRight: Radius.circular(18),
        )),
        child: Row(mainAxisSize: MainAxisSize.min, children: List.generate(3, (i) =>
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.3, end: 1.0),
            duration: Duration(milliseconds: 400 + i * 150),
            builder: (_, v, __) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: 7, height: 7,
              decoration: BoxDecoration(
                color: AppColors.primaryMid.withOpacity(v),
                shape: BoxShape.circle,
              ),
            ),
          ),
        )),
      ),
    ]),
  );

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
