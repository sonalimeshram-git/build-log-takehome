import re
from datetime import timedelta, timezone as dt_timezone

from django.utils.dateparse import parse_datetime

from rest_framework import serializers  # noqa: F401

from .models import Build

SHA_RE = re.compile(r"^[0-9a-fA-F]{40}$")


# TODO(candidate): serializers for creating a build and for the two read
# endpoints. Remember that POST /api/builds/ has to reject bad input with
# errors a frontend can actually render next to a field.
class UtcDateTimeField(serializers.Field):
    """started_at: ISO 8601 timestamp, UTC."""

    default_error_messages = {
        "invalid": "Must be an ISO 8601 timestamp, e.g. 2026-08-01T10:00:00Z.",
        "not_utc": "Must be in UTC (end with Z or +00:00).",
    }

    def to_internal_value(self, data):
        if not isinstance(data, str):
            self.fail("invalid")
        try:
            value = parse_datetime(data.strip())
        except ValueError:  # looks right but impossible, e.g. month 13
            value = None
        if value is None:
            self.fail("invalid")
        # No offset is ambiguous, and a non-zero offset isn't UTC.
        if value.tzinfo is None or value.utcoffset() != timedelta(0):
            self.fail("not_utc")
        return value

    def to_representation(self, value):
        return value.astimezone(dt_timezone.utc).isoformat().replace("+00:00", "Z")


class BuildSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=Build.Status.choices,
        error_messages={"invalid_choice": "Must be one of: success, failed, cancelled."},
    )
    started_at = UtcDateTimeField()

    class Meta:
        model = Build
        fields = [
            "id", "service", "branch", "commit_sha", "status", "started_at",
            "duration_ms", "triggered_by", "author", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_commit_sha(self, value):
        if not SHA_RE.match(value):
            raise serializers.ValidationError("Must be a 40-character hex commit SHA.")
        return value.lower()

    def validate_duration_ms(self, value):
        # DRF's IntegerField also accepts "123" and 12.0; the spec says integer.
        raw = self.initial_data.get("duration_ms")
        if isinstance(raw, bool) or not isinstance(raw, int):
            raise serializers.ValidationError("Must be a whole number of milliseconds.")
        return value

    def validate_status(self, value):
        # DRF's ChoiceField is case-sensitive; the spec says lowercase.
        if value not in Build.Status.values:
            raise serializers.ValidationError("Must be one of: success, failed, cancelled.")
        return value

class ServiceSummarySerializer(serializers.Serializer):
    """One row of GET /api/services/ (read-only)."""

    service = serializers.CharField()
    total_builds = serializers.IntegerField()
    success_count = serializers.IntegerField()
    failed_count = serializers.IntegerField()
    cancelled_count = serializers.IntegerField()
    # success / (success + failed). Cancelled builds are excluded; null if there are none.
    success_rate = serializers.SerializerMethodField()
    latest_status = serializers.CharField()
    latest_started_at = UtcDateTimeField()

    def get_success_rate(self, row):
        completed = row["success_count"] + row["failed_count"]
        if completed == 0:
            return None
        return round(row["success_count"] / completed, 4)