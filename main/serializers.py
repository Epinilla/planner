from rest_framework import serializers

from main.models import Course


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            'year', 'title', 'description', 'general_requirements',
            'repeatable', 'grading', 'min_units', 'max_units', 'department',
        )
        depth = 1