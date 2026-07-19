import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';

class OTPScreen extends ConsumerStatefulWidget {
  final String email;
  const OTPScreen({super.key, required this.email});
  @override
  ConsumerState<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends ConsumerState<OTPScreen> {
  final _controllers = List.generate(6, (_) => TextEditingController());
  final _focusNodes = List.generate(6, (_) => FocusNode());
  int _secondsLeft = 60;
  Timer? _timer;
  String get _otp => _controllers.map((c) => c.text).join();

  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNodes[0].requestFocus());
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _secondsLeft = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) t.cancel();
      else setState(() => _secondsLeft--);
    });
  }

  Future<void> _verify() async {
    if (_otp.length < 6) return;
    final success = await ref.read(authProvider.notifier).verifyOTP(_otp);
    if (success && mounted) context.go('/home');
  }

  Future<void> _resend() async {
    await ref.read(authProvider.notifier).resendOTP();
    _startTimer();
    for (final c in _controllers) c.clear();
    _focusNodes[0].requestFocus();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _controllers) c.dispose();
    for (final f in _focusNodes) f.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final filled = _otp.length == 6;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(onTap: () => context.pop(), child: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20)),
              const SizedBox(height: 28),
              Text('Check your email', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              Text('We sent a 6-digit code to ${widget.email}', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
              const SizedBox(height: 36),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (i) => SizedBox(
                  width: 46,
                  height: 56,
                  child: TextFormField(
                    controller: _controllers[i],
                    focusNode: _focusNodes[i],
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(1)],
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.primary, width: 2)),
                      contentPadding: EdgeInsets.zero,
                    ),
                    onChanged: (v) {
                      if (v.isNotEmpty && i < 5) _focusNodes[i + 1].requestFocus();
                      if (v.isEmpty && i > 0) _focusNodes[i - 1].requestFocus();
                      setState(() {});
                      if (_otp.length == 6) _verify();
                    },
                  ),
                )),
              ),
              const SizedBox(height: 24),
              if (state.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(state.error!, style: TextStyle(color: AppColors.error, fontSize: 13)),
                ),
              SizedBox(width: double.infinity, height: 56, child: ElevatedButton(
                onPressed: (filled && !state.isLoading) ? _verify : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: filled ? AppColors.action : AppColors.actionDisabled,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: state.isLoading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : Text('Verify', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
              )),
              const SizedBox(height: 20),
              Center(
                child: _secondsLeft > 0
                    ? Text.rich(TextSpan(children: [
                        TextSpan(text: 'Resend code in ', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                        TextSpan(text: '${_secondsLeft}s', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 14)),
                      ]))
                    : GestureDetector(onTap: _resend, child: Text('Resend code', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 14, decoration: TextDecoration.underline))),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
