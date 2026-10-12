from django.db import models  # noqa: F401
from django.db.models.lookups import Exact
from django.db.models.functions import Length


# TODO(candidate): model a CI build here.
#
# The seed file (data/seed_builds.json) shows the shape of the data you'll be
# storing. ASSIGNMENT.md lists the fields the POST endpoint must accept.
#
# Nothing is defined for you on purpose -- how you model this, what you index,
# and which constraints you enforce in the database vs. the serializer are all
# things we want to see you decide.

class Build(models.Model):
    
    def __str__(self):
        return f"Build {self.service}@{self.commit_sha[:7]} {self.status}"

    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    class Trigger(models.TextChoices):
        PUSH ="push","Push"
        PULL_REQUEST = "pull_request", "Pull Request"
        SCHEDULE = "schedule", "Schedule"
        MANUAL = "manual", "Manual"


    # --- required in by POST /api/builds/ ---
    service = models.CharField(max_length=125)
    branch = models.CharField(max_length=32)
    commit_sha = models.CharField(max_length=40)
    status = models.CharField(max_length=20, choices=Status.choices)
    started_at = models.DateTimeField()  # stored in UTC (USE_TZ = True in settings.py)
    duration_ms = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)      # When we recorded the build (not when the build ran).
    
    # Adding these fields as optional elements and default values because API definition does not require it for this exercise but in Prod Env these fields should always be required. 
    triggered_by = models.CharField(max_length=32, choices=Trigger.choices, blank=True, default="SYSTEM")
    author = models.CharField(max_length=32, blank=True, default="SYSTEM_AUTHOR")


    class Meta:
        ordering = ["-started_at", "-id"]
        indexes = [
            # Unfiltered list, newest first.
            models.Index(fields=["-started_at", "-id"], name="build_started_idx"),
            # ?service= filter, and "latest build per service" in the summary.
            models.Index(fields=["service", "-started_at", "-id"], name="build_service_started_idx"),
            # ?status= filter.and "latest build per status" in the summary.
            models.Index(fields=["status", "-started_at", "-id"], name="build_status_started_idx"),
        ]
        constraints = [
            # The same build reported twice (e.g. load_seed run again) can't create a 2nd row.
            models.UniqueConstraint(
                fields=["service", "commit_sha", "started_at"], 
                name="build_unique_run", 
                violation_error_message="This build was already recorded "
                "(same service, commit and start time).",
            ),
            # Last line of defence if something bypasses the serializer.
            models.CheckConstraint(
                condition=models.Q(status__in=["success", "failed", "cancelled"]),
                name="build_status_valid",
            ),
            models.CheckConstraint(
                condition=Exact(Length("commit_sha"), 40), name="build_sha_length_40"
            ),
        ]