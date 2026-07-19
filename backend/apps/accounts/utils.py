from django.core.mail import send_mail
from django.conf import settings


def send_otp_email(user, otp_code):
    subject = 'Brailliants — Your verification code'
    message = f'''Hello {user.first_name},

Your Brailliants verification code is:

{otp_code}

This code expires in 10 minutes.

If you did not create a Brailliants account, ignore this email.

— The Brailliants Team'''

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@brailliants.cm',
        recipient_list=[user.email],
        fail_silently=False,
    )
