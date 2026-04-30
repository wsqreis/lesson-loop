import 'package:flutter/material.dart';

import 'api_client.dart';
import 'models.dart';

void main() {
  runApp(const LessonLoopApp());
}

class LessonLoopApp extends StatelessWidget {
  const LessonLoopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LessonLoop Classroom',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF22D3EE)),
        useMaterial3: true,
      ),
      home: const AnswerCaptureScreen(),
    );
  }
}

class AnswerCaptureScreen extends StatefulWidget {
  const AnswerCaptureScreen({super.key});

  @override
  State<AnswerCaptureScreen> createState() => _AnswerCaptureScreenState();
}

class _AnswerCaptureScreenState extends State<AnswerCaptureScreen> {
  final apiBaseController = TextEditingController(text: 'http://10.0.2.2:3001');
  final studentCodeController = TextEditingController(text: 'S-2042');
  final answerController = TextEditingController();

  LessonLoopApiClient get api => LessonLoopApiClient(baseUrl: apiBaseController.text);

  List<ClassroomSession> sessions = const [];
  ClassroomSession? selectedSession;
  ClassroomActivity? selectedActivity;
  bool isCorrect = true;
  bool isLoading = false;
  String? statusMessage;

  @override
  void dispose() {
    apiBaseController.dispose();
    studentCodeController.dispose();
    answerController.dispose();
    super.dispose();
  }

  Future<void> loadSessions() async {
    setState(() {
      isLoading = true;
      statusMessage = null;
    });

    try {
      final loadedSessions = await api.fetchSessions();
      setState(() {
        sessions = loadedSessions;
        selectedSession = loadedSessions.isEmpty ? null : loadedSessions.first;
        selectedActivity = selectedSession?.activities.isEmpty == true
            ? null
            : selectedSession?.activities.first;
        statusMessage = loadedSessions.isEmpty
            ? 'No classroom sessions are available yet.'
            : 'Joined ${selectedSession!.title}.';
      });
    } catch (error) {
      setState(() => statusMessage = error.toString());
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> submitAnswer() async {
    final session = selectedSession;
    final activity = selectedActivity;
    if (session == null || activity == null || answerController.text.trim().isEmpty) {
      setState(() => statusMessage = 'Choose a session and write an answer first.');
      return;
    }

    setState(() {
      isLoading = true;
      statusMessage = null;
    });

    try {
      await api.submitAnswer(
        AnswerSubmission(
          sessionId: session.id,
          activityId: activity.id,
          studentCode: studentCodeController.text.trim(),
          answer: answerController.text.trim(),
          isCorrect: isCorrect,
        ),
      );
      answerController.clear();
      setState(() => statusMessage = 'Answer submitted. Your teacher can see the signal now.');
    } catch (error) {
      setState(() => statusMessage = error.toString());
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activity = selectedActivity;

    return Scaffold(
      appBar: AppBar(title: const Text('LessonLoop Classroom')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(
            controller: apiBaseController,
            decoration: const InputDecoration(
              labelText: 'API base URL',
              helperText: 'Use http://10.0.2.2:3001 for Android emulator.',
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: isLoading ? null : loadSessions,
            icon: const Icon(Icons.login),
            label: Text(isLoading ? 'Loading...' : 'Join latest session'),
          ),
          const SizedBox(height: 24),
          if (selectedSession != null) ...[
            Text(selectedSession!.title, style: Theme.of(context).textTheme.headlineSmall),
            Text('${selectedSession!.subject} · ${selectedSession!.grade}'),
            const SizedBox(height: 16),
          ],
          if (activity != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Activity prompt', style: Theme.of(context).textTheme.labelLarge),
                    const SizedBox(height: 8),
                    Text(activity.prompt, style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          TextField(
            controller: studentCodeController,
            decoration: const InputDecoration(labelText: 'Student code'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: answerController,
            decoration: const InputDecoration(labelText: 'Your answer'),
            minLines: 3,
            maxLines: 5,
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            value: isCorrect,
            onChanged: (value) => setState(() => isCorrect = value),
            title: const Text('Mark as correct in demo mode'),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: isLoading ? null : submitAnswer,
            child: const Text('Submit answer'),
          ),
          if (statusMessage != null) ...[
            const SizedBox(height: 16),
            Card(
              color: Theme.of(context).colorScheme.secondaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(statusMessage!),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
