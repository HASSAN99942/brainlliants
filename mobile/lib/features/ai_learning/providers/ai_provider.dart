import 'dart:typed_data';
import 'package:dio/dio.dart';
// Riverpod 3 moved StateNotifier[Provider] out of the default export;
// legacy.dart also re-exports the core provider symbols used here.
import 'package:flutter_riverpod/legacy.dart';
import '../data/ai_repository.dart';

// ── Chat state ──────────────────────────────────────────────────────
class ChatMessage {
  final String role; // 'user' or 'model'
  final String content;
  final DateTime timestamp;
  ChatMessage({required this.role, required this.content, required this.timestamp});
}

class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? usage;
  const ChatState({this.messages = const [], this.isLoading = false, this.error, this.usage});
  ChatState copyWith({List<ChatMessage>? messages, bool? isLoading, String? error, Map<String, dynamic>? usage}) =>
      ChatState(messages: messages ?? this.messages, isLoading: isLoading ?? this.isLoading, error: error, usage: usage ?? this.usage);
}

class ChatNotifier extends StateNotifier<ChatState> {
  final AIRepository _repo;
  ChatNotifier(this._repo) : super(const ChatState()) {
    _addWelcome();
  }

  void _addWelcome() {
    state = state.copyWith(messages: [
      ChatMessage(role: 'model', content: "Hello! I'm your Brailliants AI tutor. What would you like to study today?", timestamp: DateTime.now()),
    ]);
  }

  Future<void> sendMessage(String content) async {
    final userMsg = ChatMessage(role: 'user', content: content, timestamp: DateTime.now());
    state = state.copyWith(messages: [...state.messages, userMsg], isLoading: true, error: null);

    try {
      final apiMessages = state.messages
          .map((m) => {'role': m.role, 'content': m.content})
          .toList();
      final result = await _repo.chat(apiMessages);
      final aiMsg = ChatMessage(role: 'model', content: result['reply'], timestamp: DateTime.now());
      state = state.copyWith(messages: [...state.messages, aiMsg], isLoading: false, usage: result['usage']);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  void clearError() => state = state.copyWith(error: null);
}

final chatProvider = StateNotifierProvider.autoDispose<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(AIRepository());
});

// ── Summarise state ─────────────────────────────────────────────────
class SummariseState {
  final int step; // 0=upload, 1=loading, 2=results
  final Uint8List? fileBytes;
  final String? fileName;
  final String language;
  final bool isLoading;
  final String? error;
  final String? sessionId;
  final String? summary;
  final String? explanation;
  final List<dynamic> questions;
  final bool savedOffline;

  const SummariseState({
    this.step = 0, this.fileBytes, this.fileName, this.language = 'en',
    this.isLoading = false, this.error, this.sessionId,
    this.summary, this.explanation, this.questions = const [],
    this.savedOffline = false,
  });

  bool get hasFile => fileBytes != null && fileName != null;

  SummariseState copyWith({
    int? step, Uint8List? fileBytes, String? fileName, String? language, bool? isLoading,
    String? error, String? sessionId, String? summary, String? explanation,
    List<dynamic>? questions, bool? savedOffline,
  }) => SummariseState(
    step: step ?? this.step,
    fileBytes: fileBytes ?? this.fileBytes,
    fileName: fileName ?? this.fileName,
    language: language ?? this.language,
    isLoading: isLoading ?? this.isLoading,
    error: error,
    sessionId: sessionId ?? this.sessionId,
    summary: summary ?? this.summary,
    explanation: explanation ?? this.explanation,
    questions: questions ?? this.questions,
    savedOffline: savedOffline ?? this.savedOffline,
  );
}

class SummariseNotifier extends StateNotifier<SummariseState> {
  final AIRepository _repo;
  SummariseNotifier(this._repo) : super(const SummariseState());

  void selectFile(Uint8List bytes, String name) =>
      state = state.copyWith(fileBytes: bytes, fileName: name);
  void setLanguage(String lang) => state = state.copyWith(language: lang);

  Future<void> summarise() async {
    if (!state.hasFile) return;
    state = state.copyWith(step: 1, isLoading: true, error: null);
    try {
      final result = await _repo.summarise(state.fileBytes!, state.fileName!, state.language);
      final sessionId = result['session_id'];
      // Save offline
      _repo.saveSummaryLocally(sessionId, {
        ...result,
        'saved_at': DateTime.now().toIso8601String(),
        'file_name': state.fileName,
      });
      state = state.copyWith(
        step: 2, isLoading: false,
        sessionId: sessionId,
        summary: result['summary'],
        explanation: result['explanation'],
        questions: result['questions'] ?? [],
        savedOffline: true,
      );
    } catch (e) {
      state = state.copyWith(step: 0, isLoading: false, error: _parseError(e));
    }
  }

  void reset() => state = const SummariseState();
}

final summariseProvider = StateNotifierProvider.autoDispose<SummariseNotifier, SummariseState>((ref) {
  return SummariseNotifier(AIRepository());
});

// ── Quiz state ───────────────────────────────────────────────────────
class QuizState {
  final List<dynamic> questions;
  final int currentIndex;
  final int? selectedOption;
  final bool answered;
  final int score;
  final bool finished;
  final List<Map<String, dynamic>> answers;

  const QuizState({
    this.questions = const [], this.currentIndex = 0, this.selectedOption,
    this.answered = false, this.score = 0, this.finished = false, this.answers = const [],
  });

  dynamic get currentQuestion => questions.isNotEmpty ? questions[currentIndex] : null;
  bool get isCorrect => selectedOption != null && selectedOption == currentQuestion?['correct_option'];

  QuizState copyWith({
    List<dynamic>? questions, int? currentIndex, int? selectedOption,
    bool? answered, int? score, bool? finished, List<Map<String, dynamic>>? answers,
  }) => QuizState(
    questions: questions ?? this.questions,
    currentIndex: currentIndex ?? this.currentIndex,
    selectedOption: selectedOption,
    answered: answered ?? this.answered,
    score: score ?? this.score,
    finished: finished ?? this.finished,
    answers: answers ?? this.answers,
  );
}

class QuizNotifier extends StateNotifier<QuizState> {
  final AIRepository _repo;
  final String? sessionId;
  QuizNotifier(this._repo, {this.sessionId}) : super(const QuizState());

  void loadQuestions(List<dynamic> questions) {
    state = QuizState(questions: questions);
  }

  void selectAnswer(int optionIndex) {
    if (state.answered) return;
    state = state.copyWith(selectedOption: optionIndex, answered: true);
  }

  void nextQuestion() {
    final newAnswers = [
      ...state.answers,
      {
        'question_index': state.currentIndex,
        'selected': state.selectedOption,
        'correct': state.currentQuestion['correct_option'],
        'is_correct': state.isCorrect,
      }
    ];
    final newScore = state.isCorrect ? state.score + 1 : state.score;

    if (state.currentIndex >= state.questions.length - 1) {
      _submitResult(newScore, newAnswers);
      state = state.copyWith(
        score: newScore, answers: newAnswers,
        finished: true, answered: false, selectedOption: null,
      );
    } else {
      state = state.copyWith(
        currentIndex: state.currentIndex + 1,
        selectedOption: null, answered: false,
        score: newScore, answers: newAnswers,
      );
    }
  }

  Future<void> _submitResult(int score, List<Map<String, dynamic>> answers) async {
    try {
      final percent = (score / state.questions.length * 100).toStringAsFixed(2);
      await _repo.saveQuizResult({
        'source_type': 'ai_generated',
        if (sessionId != null) 'ai_session_id': sessionId,
        'total_questions': state.questions.length,
        'correct_answers': score,
        'score_percent': percent,
        'answers_json': answers,
      });
    } catch (_) {}
  }

  void restart() {
    state = QuizState(questions: state.questions);
  }
}

final quizProvider = StateNotifierProvider.autoDispose.family<QuizNotifier, QuizState, String?>((ref, sessionId) {
  return QuizNotifier(AIRepository(), sessionId: sessionId);
});

// ── Shared error parsing ─────────────────────────────────────────────
String _parseError(dynamic e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map && data['error'] == 'quota_exceeded') return 'quota_exceeded';
    if (data is Map && data['message'] != null) return data['message'].toString();
    if (data is Map && data['error'] != null) return data['error'].toString();
  }
  return 'Something went wrong. Please try again.';
}
