"""Gemini AI service.

If a real GEMINI_API_KEY is configured, calls Google Gemini. Otherwise falls
back to DEMO MODE, returning canned responses so the app's AI flows can be
tested end-to-end (including on Flutter web) without a key. To go live, set a
real key in backend/.env and restart — the mock path is skipped automatically.
"""
import json

import google.generativeai as genai
from django.conf import settings

MODEL = 'gemini-1.5-flash'

_PLACEHOLDER_KEYS = {'', 'your-gemini-api-key', 'your-gemini-api-key-here'}


def _has_real_key() -> bool:
    key = (settings.GEMINI_API_KEY or '').strip()
    return key not in _PLACEHOLDER_KEYS


if _has_real_key():
    genai.configure(api_key=settings.GEMINI_API_KEY)


def _build_system_prompt(user) -> str:
    lang = 'English' if user.interface_language == 'en' else 'French'
    level = user.get_exam_level_display() if user.exam_level else 'secondary school'
    specialty = user.specialty or 'general'
    return (
        f"You are Brailliants, an expert AI tutor for Cameroonian students. "
        f"The student is preparing for {level} exams, specialty: {specialty}. "
        f"Always respond in {lang}. "
        f"Be clear, structured, and encouraging. "
        f"Use numbered lists and bullet points for clarity. "
        f"Keep explanations concise and exam-focused."
    )


# ── Demo-mode fallbacks ─────────────────────────────────────────────────────

def _mock_chat_reply(user, question: str) -> str:
    if user.interface_language == 'fr':
        return (
            f"Bonne question ! Voici comment aborder « {question} » :\n\n"
            "1. Commence par définir les termes clés.\n"
            "2. Décompose le problème en étapes simples.\n"
            "3. Illustre avec un exemple concret.\n"
            "4. Vérifie ta réponse et révise l'essentiel.\n\n"
            "Continue comme ça, tu progresses bien !\n\n"
            "_(Mode démo — ajoutez une clé GEMINI_API_KEY pour des réponses réelles.)_"
        )
    return (
        f"Great question! Here's how to approach \"{question}\":\n\n"
        "1. Start by defining the key terms.\n"
        "2. Break the problem into small, clear steps.\n"
        "3. Work through a concrete example.\n"
        "4. Check your answer and review the core idea.\n\n"
        "Keep it up — you're making good progress!\n\n"
        "_(Demo mode — set a GEMINI_API_KEY for real AI responses.)_"
    )


def _mock_summary(user) -> dict:
    fr = user.interface_language == 'fr'
    if fr:
        return {
            'summary': (
                "Ceci est un résumé de démonstration. Le document présente les "
                "concepts fondamentaux du sujet, structurés en trois grandes "
                "parties.\n\nLa première partie introduit les définitions et le "
                "vocabulaire essentiel. La deuxième développe les principes clés "
                "avec des exemples. La troisième propose des applications pratiques "
                "orientées examen.\n\nEn résumé, maîtrisez les définitions, "
                "entraînez-vous avec des exemples, et révisez régulièrement."
            ),
            'explanation': (
                "Concepts clés :\n"
                "• Définition — la base à mémoriser.\n"
                "• Principe — comment le concept s'applique.\n"
                "• Exemple — un cas concret pour ancrer l'idée."
            ),
            'questions': _mock_questions(fr=True),
        }
    return {
        'summary': (
            "This is a demo summary. The document covers the core concepts of the "
            "topic, organised into three main parts.\n\nThe first part introduces "
            "essential definitions and vocabulary. The second develops the key "
            "principles with worked examples. The third offers exam-focused "
            "practical applications.\n\nIn short: master the definitions, practise "
            "with examples, and review regularly."
        ),
        'explanation': (
            "Key concepts:\n"
            "• Definition — the foundation to memorise.\n"
            "• Principle — how the concept is applied.\n"
            "• Example — a concrete case to anchor the idea."
        ),
        'questions': _mock_questions(fr=False),
    }


def _mock_questions(fr: bool) -> list:
    if fr:
        base = [
            "Quel est le rôle principal d'une définition ?",
            "Quelle étape vient après avoir défini les termes ?",
            "Pourquoi utiliser un exemple concret ?",
            "Comment vérifier une réponse ?",
            "Quelle est la meilleure habitude de révision ?",
        ]
        opts = ["Mémoriser sans comprendre", "Poser la base du concept",
                "Ignorer le sujet", "Compliquer le problème"]
    else:
        base = [
            "What is the main role of a definition?",
            "What step comes after defining the terms?",
            "Why use a concrete example?",
            "How should you check an answer?",
            "What is the best revision habit?",
        ]
        opts = ["Memorise without understanding", "Lay the foundation of the concept",
                "Ignore the topic", "Overcomplicate the problem"]
    return [
        {
            'question': q,
            'options': opts,
            'correct_option': 1,
            'explanation': ("Réponse de démonstration." if fr else "Demo explanation."),
        }
        for q in base
    ]


# ── Public API ──────────────────────────────────────────────────────────────

def chat(user, messages: list) -> str:
    """
    messages: list of {'role': 'user'|'model', 'parts': [{'text': '...'}]}
    Returns the AI text response.
    """
    last_message = messages[-1]['parts'][0]['text']

    if not _has_real_key():
        return _mock_chat_reply(user, last_message)

    model = genai.GenerativeModel(
        model_name=MODEL,
        system_instruction=_build_system_prompt(user),
    )
    history = messages[:-1] if len(messages) > 1 else []
    chat_session = model.start_chat(history=history)
    response = chat_session.send_message(last_message)
    return response.text


def summarise_document(user, file_bytes: bytes, mime_type: str) -> dict:
    """
    Uploads file to Gemini and returns:
    {summary, explanation, questions: [{question, options, correct_option, explanation}]}
    """
    import tempfile, os

    if not _has_real_key():
        return _mock_summary(user)

    lang = 'English' if user.interface_language == 'en' else 'French'

    # Write bytes to temp file for Gemini upload
    suffix = '.pdf' if 'pdf' in mime_type else '.docx'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        uploaded = genai.upload_file(tmp_path, mime_type=mime_type)
        model = genai.GenerativeModel(MODEL)

        prompt = f"""Analyse this document and respond ONLY with a valid JSON object (no markdown, no backticks).
The JSON must have exactly this structure:
{{
  "summary": "A clear 3-5 paragraph summary of the document in {lang}",
  "explanation": "A step-by-step explanation of the key concepts in {lang}",
  "questions": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_option": 0,
      "explanation": "Why this answer is correct"
    }}
  ]
}}
Generate exactly 5 multiple choice questions. Respond in {lang}."""

        response = model.generate_content([uploaded, prompt])
        text = response.text.strip()

        # Strip any accidental markdown fences
        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        text = text.strip()

        return json.loads(text)

    finally:
        os.unlink(tmp_path)
        try:
            uploaded.delete()
        except Exception:
            pass
