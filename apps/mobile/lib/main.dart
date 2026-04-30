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
  final joinCodeController = TextEditingController(text: 'MATH-42');
  final studentCodeController = TextEditingController(text: 'S-2042');
  final answerController = TextEditingController();

  LessonLoopApiClient get api => LessonLoopApiClient(baseUrl: apiBaseController.text);

  ClassroomSession? selectedSession;
  ClassroomActivity? selectedActivity;
  bool isCorrect = true;
  bool isLoading = false;
  String? statusMessage;

  @override
  void dispose() {
    apiBaseController.dispose();
    joinCodeController.dispose();
    studentCodeController.dispose();
    answerController.dispose();
    super.dispose();
  }

  Future<void> joinSession() async {
    setState(() {
      isLoading = true;
      statusMessage = null;
    });

    try {
      final session = await api.fetchSessionByJoinCode(joinCodeController.text);
      setState(() {
        selectedSession = session;
        selectedActivity = session.activities.isEmpty ? null : session.activities.first;
        answerController.clear();
        statusMessage = 'Joined ${session.title} with code ${session.joinCode}.';
      });
    } catch (error) {
      setState(() {
        selectedSession = null;
        selectedActivity = null;
        statusMessage = error.toString();
      });
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
          TextField(
            controller: joinCodeController,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              labelText: 'Session join code',
              helperText: 'Ask your teacher for the code shown on the board.',
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: isLoading ? null : joinSession,
            icon: const Icon(Icons.login),
            label: Text(isLoading ? 'Joining...' : 'Join session'),
          ),
          const SizedBox(height: 24),
          if (selectedSession != null) ...[
            Text(selectedSession!.title, style: Theme.of(context).textTheme.headlineSmall),
            Text('${selectedSession!.subject} · ${selectedSession!.grade}'),
            Text('Join code: ${selectedSession!.joinCode}'),
            if (selectedSession!.activities.length > 1) ...[
              const SizedBox(height: 16),
              DropdownButtonFormField<ClassroomActivity>(
                initialValue: selectedActivity,
                decoration: const InputDecoration(labelText: 'Activity'),
                items: selectedSession!.activities
                    .map(
                      (activity) => DropdownMenuItem(
                        value: activity,
                        child: Text(activity.prompt, overflow: TextOverflow.ellipsis),
                      ),
                    )
                    .toList(),
                onChanged: (activity) => setState(() => selectedActivity = activity),
              ),
            ],
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
            enabled: selectedSession != null && selectedActivity != null,
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
            onPressed: isLoading || selectedSession == null || selectedActivity == null ? null : submitAnswer,
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
