import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as ws_status;
import '../constants/api_constants.dart';
import '../storage/hive_service.dart';

/// Thin WebSocket wrapper for group chat.
///
/// Works on web and mobile — `WebSocketChannel.connect` picks the html/io
/// implementation automatically. The JWT is read from the same Hive `auth`
/// box that [ApiClient] uses (key `access`) and passed as `?token=` because
/// Django Channels can't read Authorization headers on the WS handshake.
/// Auto-reconnects (3s) unless the caller disconnected on purpose.
class WebSocketService {
  WebSocketChannel? _channel;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _statusController = StreamController<bool>.broadcast();
  Timer? _reconnectTimer;
  String? _groupId;
  bool _manuallyClosed = false;

  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  Stream<bool> get connectionStatus => _statusController.stream;

  Future<void> connect(String groupId) async {
    _groupId = groupId;
    _manuallyClosed = false;
    final token = HiveService.auth.get('access') as String?;
    if (token == null || token.isEmpty) return;

    final uri = Uri.parse('${ApiConstants.wsBase}/ws/chat/$groupId/?token=$token');
    try {
      _channel = WebSocketChannel.connect(uri);
      _statusController.add(true);
      _channel!.stream.listen(
        (data) {
          try {
            final msg = jsonDecode(data as String) as Map<String, dynamic>;
            _messageController.add(msg);
          } catch (_) {}
        },
        onDone: _handleDisconnect,
        onError: (_) => _handleDisconnect(),
        cancelOnError: true,
      );
    } catch (_) {
      _handleDisconnect();
    }
  }

  void _handleDisconnect() {
    _statusController.add(false);
    if (_manuallyClosed) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      if (_groupId != null && !_manuallyClosed) connect(_groupId!);
    });
  }

  void sendMessage(String body) {
    _channel?.sink.add(jsonEncode({'body': body}));
  }

  void disconnect() {
    _manuallyClosed = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close(ws_status.normalClosure);
    _statusController.add(false);
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _statusController.close();
  }
}
