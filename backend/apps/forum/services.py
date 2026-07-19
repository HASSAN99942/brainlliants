import threading
from apps.ai_learning.services.gemini_service import chat


def generate_ai_answer_async(post_id):
    """Runs in a background thread so the API responds immediately."""
    def _run():
        from .models import ForumPost
        try:
            post = ForumPost.objects.get(id=post_id)
            user = post.author
            prompt = (
                f"A student asks this question: '{post.title}'. "
                f"Details: {post.body}. "
                f"Give a clear, concise, exam-focused answer."
            )
            messages = [{'role': 'user', 'parts': [{'text': prompt}]}]
            answer = chat(user, messages)
            post.ai_answer = answer
            post.save(update_fields=['ai_answer'])
        except Exception:
            pass

    threading.Thread(target=_run, daemon=True).start()
