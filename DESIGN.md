# Brailliants — Design System

> Every UI component in `mobile/` and `web/` must follow these rules exactly.
> Extracted directly from the real prototype screens.

---

## Flutter colour class

Create this file at `mobile/lib/core/constants/app_colors.dart`:

```dart
import 'package:flutter/material.dart';

class AppColors {
  // Backgrounds
  static const bg            = Color(0xFFEEEEF5); // all auth + screen backgrounds
  static const cardSurface   = Color(0xFFFFFFFF); // input fields, cards

  // Primary purple palette
  static const primary       = Color(0xFF3C3489); // deep purple
  static const primaryLight  = Color(0xFFE8E8F8); // chip bg, tab container
  static const primaryMid    = Color(0xFF7F77DD); // progress bar, secondary icons

  // Text
  static const textPrimary   = Color(0xFF2D2770); // headings
  static const textSecondary = Color(0xFF8888AA); // subtitles, labels
  static const textMuted     = Color(0xFFAAAAAA); // placeholder hints

  // Action amber — ALL primary buttons and CTAs
  static const action         = Color(0xFFE8A020);
  static const actionDisabled = Color(0xFFF0C878);
  static const actionText     = Color(0xFF2A1A00); // text on amber buttons

  // Success — downloaded, online states ONLY
  static const success       = Color(0xFF1D9E75);
  static const successLight  = Color(0xFFE1F5EE);

  // Error — validation errors ONLY
  static const error         = Color(0xFFE24B4A);
  static const errorLight    = Color(0xFFFCEBEB);

  // Inputs
  static const inputBorder      = Color(0xFFE0E0F0);
  static const inputBorderFocus = Color(0xFF3C3489);

  // Bottom navigation
  static const navActive   = Color(0xFFE8A020); // amber — active tab
  static const navInactive = Color(0xFF3C3489); // purple — inactive tabs
}
```

---

## Spacing

```dart
// Use these constants throughout — never hardcode padding values
class AppSpacing {
  static const xs   = 4.0;
  static const sm   = 8.0;
  static const md   = 12.0;
  static const lg   = 16.0;
  static const xl   = 20.0;
  static const xxl  = 24.0;
  static const xxxl = 32.0;
}
```

---

## Border radius

```dart
class AppRadius {
  static const xs   = 6.0;   // badges, small chips
  static const sm   = 8.0;   // language toggle, small cards
  static const md   = 12.0;  // input fields, tab container
  static const lg   = 14.0;  // buttons
  static const xl   = 16.0;  // standard cards
  static const xxl  = 20.0;  // hero card
  static const full = 999.0; // pill chips, bottom nav dots
}
```

---

## Component rules

### Primary button (amber — every CTA)
```dart
SizedBox(
  width: double.infinity,
  height: 56,
  child: ElevatedButton(
    onPressed: isEnabled ? onPressed : null,
    style: ElevatedButton.styleFrom(
      backgroundColor: isEnabled ? AppColors.action : AppColors.actionDisabled,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
      elevation: 0,
    ),
    child: Text(
      label,
      style: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.actionText,
      ),
    ),
  ),
)
```

### Input field
```dart
TextFormField(
  decoration: InputDecoration(
    labelText: label,
    labelStyle: TextStyle(color: AppColors.textSecondary, fontSize: 13),
    hintStyle: TextStyle(color: AppColors.textMuted),
    filled: true,
    fillColor: AppColors.cardSurface,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: AppColors.inputBorderFocus, width: 1.5),
    ),
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  ),
)
```

### Standard card
```dart
Container(
  padding: EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: AppColors.cardSurface,
    borderRadius: BorderRadius.circular(AppRadius.xl),
    border: Border.all(color: AppColors.inputBorder, width: 0.5),
  ),
)
```

### Hero card (purple header card on home)
```dart
Container(
  padding: EdgeInsets.all(20),
  decoration: BoxDecoration(
    color: AppColors.primary,  // #3C3489
    borderRadius: BorderRadius.circular(AppRadius.xxl),
  ),
  // Text: white and AppColors.primaryLight
  // Progress bar fill: AppColors.primaryMid (#7F77DD)
  // Resume link: AppColors.action (#E8A020)
)
```

### Pill chip
```dart
// Purple chip (default)
Container(
  padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
  decoration: BoxDecoration(
    color: AppColors.primaryLight,
    borderRadius: BorderRadius.circular(AppRadius.full),
  ),
  child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.primary)),
)

// Selected chip
Container(
  padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
  decoration: BoxDecoration(
    color: AppColors.primary,
    borderRadius: BorderRadius.circular(AppRadius.full),
  ),
  child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.white)),
)
```

### Student/Teacher tab selector
```dart
Container(
  height: 44,
  padding: EdgeInsets.all(4),
  decoration: BoxDecoration(
    color: AppColors.primaryLight,
    borderRadius: BorderRadius.circular(AppRadius.md),
  ),
  child: TabBar(
    indicator: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
    indicatorSize: TabBarIndicatorSize.tab,
    labelColor: AppColors.primary,
    unselectedLabelColor: AppColors.textSecondary,
    labelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
    tabs: [Tab(text: 'Student'), Tab(text: 'Teacher')],
  ),
)
```

### Bottom navigation bar
```dart
BottomNavigationBar(
  selectedItemColor: AppColors.navActive,     // amber
  unselectedItemColor: AppColors.navInactive, // purple
  backgroundColor: Colors.white,
  type: BottomNavigationBarType.fixed,
  elevation: 0,
  selectedLabelStyle: TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
  unselectedLabelStyle: TextStyle(fontSize: 10),
  // Add top border:
  // Wrap in Container with border: Border(top: BorderSide(color: AppColors.inputBorder, width: 0.5))
)
```

### Language toggle (EN/FR)
```dart
// As seen on login and register screens
Row(children: [
  GestureDetector(
    onTap: () => setState(() => lang = 'en'),
    child: Text('EN', style: TextStyle(
      fontSize: 14,
      color: lang == 'en' ? AppColors.textSecondary : AppColors.textMuted,
    )),
  ),
  SizedBox(width: 8),
  GestureDetector(
    onTap: () => setState(() => lang = 'fr'),
    child: Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: lang == 'fr' ? AppColors.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('FR', style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: lang == 'fr' ? Colors.white : AppColors.textMuted,
      )),
    ),
  ),
])
```

### Phone field with +237 prefix
```dart
TextFormField(
  decoration: InputDecoration(
    // same base decoration as input field above
    prefix: Text('+237  ', style: TextStyle(
      color: AppColors.primary,
      fontWeight: FontWeight.bold,
      fontSize: 15,
    )),
  ),
  keyboardType: TextInputType.phone,
)
```

### OTP digit boxes
```dart
// 6 individual boxes, each:
SizedBox(
  width: 46,
  height: 56,
  child: TextFormField(
    textAlign: TextAlign.center,
    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
    keyboardType: TextInputType.number,
    decoration: InputDecoration(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.primary, width: 2),
      ),
      contentPadding: EdgeInsets.zero,
    ),
  ),
)
```

### Onboarding subsystem card
```dart
// Unselected
Container(
  width: double.infinity,
  padding: EdgeInsets.all(20),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
  ),
)
// Selected — add border
Container(
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: AppColors.primary, width: 2),
  ),
)
```

### Onboarding page dots
```dart
Row(children: List.generate(3, (i) => AnimatedContainer(
  duration: Duration(milliseconds: 200),
  margin: EdgeInsets.symmetric(horizontal: 4),
  width: i == currentPage ? 24 : 8,
  height: 8,
  decoration: BoxDecoration(
    color: i == currentPage ? Color(0xFF3C3489) : Color(0xFFCCCCDD),
    borderRadius: BorderRadius.circular(4),
  ),
)))
```

---

## Screen states (required on every screen)

### Loading state — shimmer placeholders
```dart
// Use shimmer package
Shimmer.fromColors(
  baseColor: AppColors.primaryLight,
  highlightColor: Colors.white,
  child: Container(
    height: 80,
    margin: EdgeInsets.symmetric(horizontal: 20, vertical: 6),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(AppRadius.xl),
    ),
  ),
)
```

### Empty state
```dart
Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
  Icon(Icons.inbox_outlined, size: 56, color: AppColors.primaryLight),
  SizedBox(height: 14),
  Text('Nothing here yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
  SizedBox(height: 6),
  Text('Content will appear once available.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13), textAlign: TextAlign.center),
]))
```

### Error state
```dart
Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
  Icon(Icons.wifi_off_outlined, size: 48, color: AppColors.error),
  SizedBox(height: 12),
  Text('Something went wrong', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
  SizedBox(height: 6),
  Text(errorMessage, style: TextStyle(color: AppColors.textSecondary, fontSize: 13), textAlign: TextAlign.center),
  SizedBox(height: 16),
  OutlinedButton(
    onPressed: onRetry,
    style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.primary)),
    child: Text('Try again', style: TextStyle(color: AppColors.primary)),
  ),
]))
```

---

## Route names (add to `mobile/lib/core/router/app_router.dart`)

```dart
static const splash        = '/';
static const onboarding    = '/onboarding';
static const register      = '/register';
static const login         = '/login';
static const otp           = '/otp';
static const home          = '/home';
static const aiHub         = '/home/ai';
static const aiChat        = '/home/ai/chat';
static const summarise     = '/home/ai/summarise';
static const quiz          = '/home/ai/quiz';
static const questionBank  = '/home/resources';
static const questionDetail= '/home/resources/detail';
static const notes         = '/home/resources/notes';
static const bookmarks     = '/home/resources/bookmarks';
static const forum         = '/home/forum';
static const postDetail    = '/home/forum/post';
static const createPost    = '/home/forum/create';
static const groups        = '/home/forum/groups';
static const groupDetail   = '/home/forum/groups/detail';
static const groupChat     = '/home/forum/groups/chat';
static const timetable     = '/home/profile/timetable';
static const progress      = '/home/profile/progress';
static const schoolSearch  = '/home/profile/schools';
static const paywall       = '/paywall';
static const payment       = '/payment';
static const profile       = '/home/profile';
```

---

## API constants (add to `mobile/lib/core/constants/api_constants.dart`)

```dart
class ApiConstants {
  static const String baseUrl = 'http://10.0.2.2:8000/api'; // Android emulator
  static const String wsBase  = 'ws://10.0.2.2:8000/ws';    // WebSocket

  // Auth
  static const registerStudent = '/auth/register/student/';
  static const registerTeacher = '/auth/register/teacher/';
  static const login           = '/auth/login/';
  static const verifyOtp       = '/auth/verify-otp/';
  static const resendOtp       = '/auth/resend-otp/';
  static const refreshToken    = '/auth/token/refresh/';
  static const logout          = '/auth/logout/';
  static const profile         = '/auth/profile/';
  static const changeLanguage  = '/auth/language/';

  // AI
  static const aiChat        = '/ai/chat/';
  static const aiSummarise   = '/ai/summarise/';
  static const aiQuizResult  = '/ai/quiz-result/';
  static const aiUsage       = '/ai/usage/';

  // Content
  static const questions      = '/content/questions/';
  static const notes          = '/content/notes/';
  static const bookmarks      = '/content/bookmarks/';
  static const bookmarkToggle = '/content/bookmarks/toggle/';

  // Forum
  static const forumPosts  = '/forum/posts/';

  // Community
  static const groups     = '/community/groups/';

  // Planner
  static const timetable  = '/planner/timetable/';
  static const logSession = '/planner/log-session/';
  static const progress   = '/planner/progress/';
  static const fcmToken   = '/planner/fcm-token/';

  // School
  static const schools    = '/schools/';
  static const enrolments = '/enrolments/';

  // Payments
  static const paymentInit   = '/payments/initiate/';
  static const paymentStatus = '/payments/status/';
  static const subscription  = '/payments/subscription/';
}
```
