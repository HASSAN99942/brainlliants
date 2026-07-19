import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;
  String _lang = 'en';

  InputDecoration _dec(String label, {String? hint}) => InputDecoration(
    labelText: label,
    hintText: hint,
    labelStyle: TextStyle(color: AppColors.textSecondary, fontSize: 13),
    hintStyle: TextStyle(color: AppColors.textMuted),
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorderFocus, width: 1.5)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );

  Future<void> _login() async {
    final success = await ref.read(authProvider.notifier).login(_email.text, _password.text);
    if (success && mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.end, children: [
              GestureDetector(onTap: () => setState(() => _lang = 'en'), child: Text('EN', style: TextStyle(fontSize: 14, color: _lang == 'en' ? AppColors.textSecondary : AppColors.textMuted))),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => setState(() => _lang = 'fr'),
                child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6), decoration: BoxDecoration(color: _lang == 'fr' ? AppColors.primary : Colors.transparent, borderRadius: BorderRadius.circular(8)),
                  child: Text('FR', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _lang == 'fr' ? Colors.white : AppColors.textMuted))),
              ),
            ]),
            const SizedBox(height: 28),
            Container(width: 68, height: 68, decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle), child: const Center(child: Text('B', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)))),
            const SizedBox(height: 20),
            Text(_lang == 'fr' ? 'Bon retour' : 'Welcome back', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 32),
            Align(alignment: Alignment.centerLeft, child: Text('Email', style: TextStyle(color: AppColors.textSecondary, fontSize: 13))),
            const SizedBox(height: 6),
            TextFormField(controller: _email, decoration: _dec('', hint: 'kofi@example.com'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 16),
            Align(alignment: Alignment.centerLeft, child: Text('Password', style: TextStyle(color: AppColors.textSecondary, fontSize: 13))),
            const SizedBox(height: 6),
            TextFormField(
              controller: _password,
              obscureText: !_showPassword,
              decoration: _dec('').copyWith(suffixIcon: IconButton(icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textMuted), onPressed: () => setState(() => _showPassword = !_showPassword))),
            ),
            const SizedBox(height: 8),
            Align(alignment: Alignment.centerRight, child: GestureDetector(onTap: () {}, child: Text('Forgot password?', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500, fontSize: 14)))),
            const SizedBox(height: 20),
            if (state.error != null) ...[
              Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppColors.errorLight, borderRadius: BorderRadius.circular(10)), child: Text(state.error!, style: TextStyle(color: AppColors.error, fontSize: 13))),
              const SizedBox(height: 12),
            ],
            SizedBox(width: double.infinity, height: 56, child: ElevatedButton(
              onPressed: state.isLoading ? null : _login,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.action, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
              child: state.isLoading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : Text(_lang == 'fr' ? 'Se connecter' : 'Log in', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
            )),
            const SizedBox(height: 20),
            Row(children: [Expanded(child: Divider(color: AppColors.inputBorder)), Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('or', style: TextStyle(color: AppColors.textSecondary))), Expanded(child: Divider(color: AppColors.inputBorder))]),
            const SizedBox(height: 16),
            _socialBtn('G', 'Continue with Google', () {}),
            const SizedBox(height: 12),
            _socialBtn('f', 'Continue with Facebook', () {}, color: const Color(0xFF1877F2)),
            const SizedBox(height: 24),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text("Don't have an account? ", style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              GestureDetector(onTap: () => context.go('/register'), child: Text('Register', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 14))),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _socialBtn(String icon, String label, VoidCallback onTap, {Color? color}) =>
    SizedBox(width: double.infinity, height: 52, child: OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.inputBorder, width: 0.5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), backgroundColor: Colors.white),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(icon, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color ?? AppColors.primary)),
        const SizedBox(width: 10),
        Text(label, style: TextStyle(fontSize: 14, color: AppColors.textPrimary)),
      ]),
    ));
}
