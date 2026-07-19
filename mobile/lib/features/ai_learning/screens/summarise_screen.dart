import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/ai_provider.dart';

class SummariseScreen extends ConsumerWidget {
  const SummariseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(summariseProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () {
            ref.read(summariseProvider.notifier).reset();
            context.pop();
          },
        ),
        title: Text(
          state.language == 'fr' ? 'Résumer des notes' : 'Summarise notes',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
      ),
      body: [
        const _UploadStep(),
        const _LoadingStep(),
        const _ResultsStep(),
      ][state.step],
    );
  }
}

class _UploadStep extends ConsumerWidget {
  const _UploadStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(summariseProvider);
    final notifier = ref.read(summariseProvider.notifier);

    return SafeArea(
      child: Column(children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(children: [
              const SizedBox(height: 40),
              // Upload zone
              GestureDetector(
                onTap: () async {
                  // withData: true is required for web (path is null there).
                  // file_picker v11 exposes pickFiles as a static method.
                  final result = await FilePicker.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: ['pdf', 'doc', 'docx'],
                    withData: true,
                  );
                  if (result != null && result.files.single.bytes != null) {
                    notifier.selectFile(result.files.single.bytes!, result.files.single.name);
                  }
                },
                child: Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.inputBorder, width: 0.5),
                  ),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.upload_outlined, size: 48, color: AppColors.primaryMid),
                    const SizedBox(height: 12),
                    if (state.hasFile)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          state.fileName!,
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.primary),
                          textAlign: TextAlign.center,
                        ),
                      )
                    else
                      Text(
                        state.language == 'fr'
                            ? 'Appuyez pour sélectionner PDF ou Word (max 20MB)'
                            : 'Tap to select PDF or Word (max 20MB)',
                        style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                  ]),
                ),
              ),
              const SizedBox(height: 32),
              // Language toggle
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(
                  state.language == 'fr' ? 'Langue du résumé' : 'Summary language',
                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                ),
                Row(children: [
                  _langPill(notifier, state, 'en', 'EN'),
                  const SizedBox(width: 6),
                  _langPill(notifier, state, 'fr', 'FR'),
                ]),
              ]),
              if (state.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.errorLight, borderRadius: BorderRadius.circular(10)),
                  child: Text(state.error!, style: TextStyle(color: AppColors.error, fontSize: 13)),
                ),
              ],
            ]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          child: SizedBox(
            width: double.infinity, height: 56,
            child: ElevatedButton(
              onPressed: state.hasFile ? () => notifier.summarise() : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: state.hasFile ? AppColors.action : AppColors.actionDisabled,
                disabledBackgroundColor: AppColors.actionDisabled,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: Text(
                state.language == 'fr' ? 'Résumer' : 'Summarise',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _langPill(SummariseNotifier notifier, SummariseState state, String lang, String label) {
    final selected = state.language == lang;
    return GestureDetector(
      onTap: () => notifier.setLanguage(lang),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppColors.textMuted)),
      ),
    );
  }
}

class _LoadingStep extends StatelessWidget {
  const _LoadingStep();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
        const SizedBox(height: 24),
        Text(
          'Processing your document...',
          style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        Text(
          'This may take up to 30 seconds',
          style: TextStyle(fontSize: 13, color: AppColors.textMuted),
        ),
      ]),
    );
  }
}

class _ResultsStep extends ConsumerWidget {
  const _ResultsStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(summariseProvider);

    return DefaultTabController(
      length: 2,
      child: Column(children: [
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          height: 44,
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
          child: TabBar(
            indicator: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
            indicatorSize: TabBarIndicatorSize.tab,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            tabs: const [Tab(text: 'Summary'), Tab(text: 'Quiz')],
          ),
        ),
        Expanded(
          child: TabBarView(children: [
            _summaryTab(state),
            _quizTab(context, state),
          ]),
        ),
      ]),
    );
  }

  Widget _summaryTab(SummariseState state) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.inputBorder, width: 0.5),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(child: Text('AI Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary))),
              if (state.savedOffline)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(20)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.check, size: 13, color: AppColors.success),
                    const SizedBox(width: 4),
                    Text('Saved offline', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w500)),
                  ]),
                ),
            ]),
            const SizedBox(height: 12),
            Text(state.summary ?? '', style: TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.6)),
            if (state.explanation != null && state.explanation!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Key concepts', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              Text(state.explanation!, style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.6)),
            ],
          ]),
        ),
      );

  Widget _quizTab(BuildContext context, SummariseState state) {
    final count = state.questions.length;
    return Column(children: [
      Expanded(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.quiz_outlined, size: 56, color: AppColors.primaryMid),
              const SizedBox(height: 16),
              Text(
                count > 0 ? '$count practice questions ready' : 'No questions generated',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Test what you just learned with a quick quiz.',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ]),
          ),
        ),
      ),
      if (count > 0)
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          child: SizedBox(
            width: double.infinity, height: 56,
            child: ElevatedButton(
              onPressed: () => context.push('/home/ai/quiz', extra: {
                'questions': state.questions,
                'sessionId': state.sessionId,
              }),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.action,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: Text(
                'Start Quiz',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText),
              ),
            ),
          ),
        ),
    ]);
  }
}
