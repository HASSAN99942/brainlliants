import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/ai_provider.dart';

class QuizScreen extends ConsumerStatefulWidget {
  final List<dynamic> questions;
  final String? sessionId;
  const QuizScreen({super.key, required this.questions, this.sessionId});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(quizProvider(widget.sessionId).notifier).loadQuestions(widget.questions);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(quizProvider(widget.sessionId));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: AppColors.textPrimary, size: 22),
          onPressed: () => context.pop(),
        ),
        title: Text('Quiz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: state.questions.isEmpty
          ? Center(child: CircularProgressIndicator(color: AppColors.primary))
          : state.finished
              ? _buildResults(state)
              : _buildQuestion(state),
    );
  }

  Widget _buildQuestion(QuizState state) {
    final q = state.currentQuestion;
    final options = List<dynamic>.from(q['options'] ?? []);
    final total = state.questions.length;
    final notifier = ref.read(quizProvider(widget.sessionId).notifier);

    return SafeArea(
      child: Column(children: [
        // Progress row
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Question ${state.currentIndex + 1} of $total',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
            Text('Score ${state.score}',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
          ]),
        ),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (state.currentIndex + 1) / total,
              backgroundColor: AppColors.inputBorder,
              valueColor: AlwaysStoppedAnimation(AppColors.primary),
              minHeight: 6,
            ),
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SizedBox(height: 10),
              Text(q['question'] ?? '',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1.3)),
              const SizedBox(height: 24),
              ...List.generate(options.length, (i) => _answerCard(state, i, options[i].toString(), notifier)),
              if (state.answered && q['explanation'] != null && q['explanation'].toString().isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
                  child: Text(q['explanation'].toString(),
                      style: TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.5)),
                ),
              ],
            ]),
          ),
        ),
        // Next button appears after answering
        if (state.answered)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            child: SizedBox(
              width: double.infinity, height: 56,
              child: ElevatedButton(
                onPressed: () => notifier.nextQuestion(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.action,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: Text(
                  state.currentIndex >= total - 1 ? 'Finish' : 'Next',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText),
                ),
              ),
            ),
          ),
      ]),
    );
  }

  Widget _answerCard(QuizState state, int index, String text, QuizNotifier notifier) {
    final correctIndex = state.currentQuestion['correct_option'];
    Color bg = Colors.white;
    Color border = AppColors.inputBorder;
    double borderWidth = 0.5;
    Color fg = AppColors.textPrimary;

    if (state.answered) {
      if (index == correctIndex) {
        bg = AppColors.successLight;
        border = AppColors.success;
        borderWidth = 1.5;
        fg = AppColors.success;
      } else if (index == state.selectedOption) {
        bg = AppColors.errorLight;
        border = AppColors.error;
        borderWidth = 1.5;
        fg = AppColors.error;
      }
    }

    final letter = String.fromCharCode(65 + index); // A, B, C, D
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: state.answered ? null : () => notifier.selectAnswer(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: border, width: borderWidth),
          ),
          child: Row(children: [
            Text('$letter.  ', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: fg)),
            Expanded(child: Text(text, style: TextStyle(fontSize: 15, color: fg, height: 1.4))),
            if (state.answered && index == correctIndex)
              Icon(Icons.check_circle, color: AppColors.success, size: 20)
            else if (state.answered && index == state.selectedOption)
              Icon(Icons.cancel, color: AppColors.error, size: 20),
          ]),
        ),
      ),
    );
  }

  Widget _buildResults(QuizState state) {
    final total = state.questions.length;
    final percent = total == 0 ? 0 : (state.score / total * 100).round();
    final notifier = ref.read(quizProvider(widget.sessionId).notifier);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Icon(
            percent >= 50 ? Icons.emoji_events_outlined : Icons.refresh,
            size: 72,
            color: percent >= 50 ? AppColors.action : AppColors.primaryMid,
          ),
          const SizedBox(height: 20),
          Text('$percent%',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          Text('You scored ${state.score} out of $total',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
          const SizedBox(height: 40),
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: () => notifier.restart(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.action,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: Text('Try again', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 56,
            child: OutlinedButton(
              onPressed: () => context.pop(),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: AppColors.inputBorder),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text('Done', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.primary)),
            ),
          ),
        ]),
      ),
    );
  }
}
