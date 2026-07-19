import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;
  String? _selectedSubsystem;
  String? _selectedExam;

  final _angloExams = ['GCE O/L', 'GCE A/L', 'HND'];
  final _francoExams = ['CEP', 'BEPC', 'Probatoire', 'BAC A', 'BAC C', 'BAC D', 'BAC E', 'HND'];

  bool get _canNext {
    if (_page == 1) return _selectedSubsystem != null;
    if (_page == 2) return _selectedExam != null;
    return true;
  }

  void _next() {
    if (_page < 2) {
      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      context.go('/register');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                children: [_buildPage1(), _buildPage2(), _buildPage3()],
              ),
            ),
            _buildDots(),
            _buildButton(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildPage1() => Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      children: [
        const SizedBox(height: 20),
        Container(
          height: 260,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Center(
            child: Icon(Icons.school_outlined, size: 64, color: AppColors.primaryMid),
          ),
        ),
        const SizedBox(height: 36),
        Text(
          'Your AI study partner, built for Cameroon',
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1.2),
        ),
        const SizedBox(height: 14),
        Text(
          'Past papers, AI tutoring and study groups for GCE, BAC, BEPC and more — even when you\'re offline.',
          style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.5),
        ),
      ],
    ),
  );

  Widget _buildPage2() => Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text('Which system are you in?', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        Text("We'll tailor exams and content to your subsystem.", style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
        const SizedBox(height: 32),
        _subsystemCard('anglophone', 'Anglophone (GCE)', 'O-Level, A-Level, HND'),
        const SizedBox(height: 14),
        _subsystemCard('francophone', 'Francophone (BAC/BEPC)', 'CEP, BEPC, Probatoire, BAC'),
      ],
    ),
  );

  Widget _subsystemCard(String value, String title, String subtitle) {
    final selected = _selectedSubsystem == value;
    return GestureDetector(
      onTap: () => setState(() { _selectedSubsystem = value; _selectedExam = null; }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? AppColors.primary : Colors.transparent, width: 2),
          boxShadow: selected ? [BoxShadow(color: AppColors.primary.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 2))] : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: AppColors.primary)),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildPage3() {
    final exams = _selectedSubsystem == 'anglophone' ? _angloExams : _francoExams;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text('What are you preparing for?', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          Text('Pick your exam level.', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
          const SizedBox(height: 28),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: exams.map((exam) {
              final selected = _selectedExam == exam;
              return GestureDetector(
                onTap: () => setState(() => _selectedExam = exam),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(50),
                  ),
                  child: Text(exam, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: selected ? Colors.white : AppColors.textPrimary)),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildDots() => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(3, (i) => AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 20),
      width: i == _page ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: i == _page ? AppColors.primary : const Color(0xFFCCCCDD),
        borderRadius: BorderRadius.circular(4),
      ),
    )),
  );

  Widget _buildButton() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 24),
    child: AnimatedOpacity(
      opacity: _canNext ? 1.0 : 0.5,
      duration: const Duration(milliseconds: 200),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: _canNext ? _next : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.action,
            disabledBackgroundColor: AppColors.actionDisabled,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 0,
          ),
          child: Text(
            _page == 2 ? 'Get Started' : 'Next',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText),
          ),
        ),
      ),
    ),
  );
}
