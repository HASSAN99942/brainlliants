from rest_framework import serializers

from apps.accounts.models import School
from .models import Enrolment


class SchoolSerializer(serializers.ModelSerializer):
    # The model calls it ``city``; the apps and the web dashboard speak ``town``.
    town = serializers.CharField(source='city', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = ['id', 'name', 'town', 'region', 'subsystem', 'school_type', 'student_count']

    def get_student_count(self, obj):
        # Annotated by the list views to avoid an N+1; fall back to a query.
        cached = getattr(obj, 'approved_count', None)
        if cached is not None:
            return cached
        return Enrolment.objects.filter(school=obj, status='approved').count()


class EnrolmentSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(source='student.email', read_only=True)
    # The model stamps ``created_at``; clients read ``requested_at``.
    requested_at = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Enrolment
        fields = [
            'id', 'school', 'student_name', 'student_email',
            'matricule', 'status', 'requested_at', 'reviewed_at',
        ]

    def get_student_name(self, obj):
        return obj.student.full_name


class EnrolmentRequestSerializer(serializers.Serializer):
    school_id = serializers.UUIDField()
    matricule = serializers.CharField(max_length=100)

    def validate_matricule(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Matricule is required.')
        return value
