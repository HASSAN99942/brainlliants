import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

/// Placeholder — full CamPay upgrade flow lands in Sprint 7 (payments).
class PaywallScreen extends StatelessWidget {
  const PaywallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: AppColors.textPrimary, size: 22),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Icon(Icons.workspace_premium_outlined, size: 72, color: AppColors.action),
            const SizedBox(height: 20),
            Text('Brailliants Pro', textAlign: TextAlign.center, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            Text('Unlimited AI queries, unlimited downloads and past papers — 1000 XAF / month.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.5)),
            const SizedBox(height: 28),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
              child: Text('Payments (MTN MoMo & Orange Money) arrive in a later sprint.',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppColors.primary)),
            ),
          ]),
        ),
      ),
    );
  }
}
