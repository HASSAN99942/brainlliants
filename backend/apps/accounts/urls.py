from django.urls import path
from . import views

urlpatterns = [
    path('register/student/', views.StudentRegisterView.as_view()),
    path('register/teacher/', views.TeacherRegisterView.as_view()),
    path('verify-otp/', views.OTPVerifyView.as_view()),
    path('resend-otp/', views.ResendOTPView.as_view()),
    path('login/', views.LoginView.as_view()),
    path('logout/', views.LogoutView.as_view()),
    path('profile/', views.UserProfileView.as_view()),
    path('language/', views.ChangeLanguageView.as_view()),
]
