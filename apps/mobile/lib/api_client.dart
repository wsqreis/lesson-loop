import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';

class LessonLoopApiClient {
  LessonLoopApiClient({required this.baseUrl, http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _httpClient;

  Future<List<ClassroomSession>> fetchSessions() async {
    final response = await _httpClient.get(Uri.parse('$baseUrl/sessions'));
    if (response.statusCode != 200) {
      throw Exception('Could not load classroom sessions.');
    }

    final json = jsonDecode(response.body) as List<dynamic>;
    return json
        .map((session) => ClassroomSession.fromJson(session as Map<String, dynamic>))
        .toList();
  }

  Future<void> submitAnswer(AnswerSubmission submission) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/answers'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode(submission.toJson()),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Could not submit the answer.');
    }
  }
}
