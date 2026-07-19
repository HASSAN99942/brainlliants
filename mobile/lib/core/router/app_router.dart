import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/ai_learning/screens/ai_chat_screen.dart';
import '../../features/ai_learning/screens/summarise_screen.dart';
import '../../features/ai_learning/screens/sessions_screen.dart';
import '../../features/ai_learning/screens/quiz_screen.dart';
import '../../features/ai_learning/screens/paywall_screen.dart';
import '../../features/content/screens/question_detail_screen.dart';
import '../../features/content/screens/bookmarks_screen.dart';
import '../../features/forum/screens/post_detail_screen.dart';
import '../../features/forum/screens/create_post_screen.dart';
import '../../features/community/screens/groups_screen.dart';
import '../../features/community/screens/group_detail_screen.dart';
import '../../features/community/screens/user_search_screen.dart';
import '../../features/planner/screens/timetable_screen.dart';
import '../../features/planner/screens/progress_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/otp',
        builder: (_, state) {
          final extra = state.extra as Map<String, String>?;
          return OTPScreen(email: extra?['email'] ?? '');
        },
      ),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),

      // AI learning (Sprint 2)
      GoRoute(path: '/home/ai/chat', builder: (_, __) => const AIChatScreen()),
      GoRoute(path: '/home/ai/summarise', builder: (_, __) => const SummariseScreen()),
      GoRoute(path: '/home/ai/sessions', builder: (_, __) => const SessionsScreen()),
      GoRoute(
        path: '/home/ai/quiz',
        builder: (_, state) {
          final extra = (state.extra as Map<String, dynamic>?) ?? const {};
          return QuizScreen(
            questions: List<dynamic>.from(extra['questions'] ?? const []),
            sessionId: extra['sessionId'] as String?,
          );
        },
      ),
      GoRoute(path: '/paywall', builder: (_, __) => const PaywallScreen()),

      // Content bank (Sprint 3)
      GoRoute(
        path: '/home/resources/detail',
        builder: (_, state) =>
            QuestionDetailScreen(item: (state.extra as Map?) ?? const {}),
      ),
      GoRoute(path: '/home/resources/bookmarks', builder: (_, __) => const BookmarksScreen()),

      // Forum & community (Sprint 4)
      GoRoute(
        path: '/home/forum/post',
        builder: (_, state) => PostDetailScreen(postId: state.extra as String),
      ),
      GoRoute(path: '/home/forum/create', builder: (_, __) => const CreatePostScreen()),
      GoRoute(path: '/home/forum/users', builder: (_, __) => const UserSearchScreen()),
      GoRoute(path: '/home/forum/groups', builder: (_, __) => const GroupsScreen()),
      GoRoute(
        path: '/home/forum/groups/detail',
        builder: (_, state) =>
            GroupDetailScreen(group: (state.extra as Map?) ?? const {}),
      ),

      // Planner (Sprint 5)
      GoRoute(path: '/home/profile/timetable', builder: (_, __) => const TimetableScreen()),
      GoRoute(path: '/home/profile/progress', builder: (_, __) => const ProgressScreen()),
    ],
  );
});
