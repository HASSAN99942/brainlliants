import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/forum_repository.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});
  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_titleController.text.trim().isEmpty || _bodyController.text.trim().isEmpty) return;
    setState(() => _submitting = true);
    try {
      await ForumRepository().createPost(_titleController.text.trim(), _bodyController.text.trim());
      if (mounted) context.pop();
    } catch (e) {
      setState(() => _submitting = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not post. Try again.')));
    }
  }

  InputDecoration _dec(String hint) => InputDecoration(
    hintText: hint, hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 15),
    filled: true, fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.primary, width: 1.5)),
    contentPadding: const EdgeInsets.all(16),
  );

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
        title: Text('Ask the community',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Question title',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            TextField(
              controller: _titleController,
              style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
              decoration: _dec('e.g. How do I balance redox equations?'),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 20),
            Text('Details',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            TextField(
              controller: _bodyController,
              maxLines: 4,
              style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
              decoration: _dec("Describe what you've tried and where you're stuck..."),
            ),
            const SizedBox(height: 14),
            Row(children: [
              Icon(Icons.auto_awesome, size: 16, color: AppColors.primaryMid),
              const SizedBox(width: 6),
              Text('AI will answer within seconds',
                  style: TextStyle(fontSize: 13, color: AppColors.primaryMid, fontWeight: FontWeight.w500)),
            ]),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity, height: 54,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.action,
                  disabledBackgroundColor: AppColors.actionDisabled,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _submitting
                    ? SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(AppColors.actionText)))
                    : Text('Post question',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.actionText)),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
