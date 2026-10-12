"""A single smoke test, so you know the test setup works before you start.

Run it with:  pytest

Delete or rewrite this file freely. ASSIGNMENT.md asks for tests on the parts
you'd be nervous about a teammate changing -- this isn't one of them.
"""

import pytest
from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone
from builds.models import Build


@pytest.mark.django_db
def test_health_endpoint_reports_ok(client):
    response = client.get(reverse("health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}

@pytest.mark.django_db
def test_build_can_be_inserted():
    build = Build.objects.create(
        service="payments",
        branch="main",
        commit_sha="a" * 40,
        status=Build.Status.SUCCESS,
        started_at=timezone.now(),
        duration_ms=1200,
        triggered_by=Build.Trigger.PUSH,
        author="test-user",
    )

    saved_build = Build.objects.get(pk=build.pk)
    assert saved_build.service == "payments"
    assert saved_build.commit_sha == "a" * 40


@pytest.mark.django_db
def test_same_build_cannot_be_inserted_twice():
    build_data = {
        "service": "payments",
        "branch": "main",
        "commit_sha": "a" * 40,
        "status": Build.Status.SUCCESS,
        "started_at": timezone.now(),
        "duration_ms": 1200,
        "triggered_by": Build.Trigger.PUSH,
        "author": "test-user",
    }
    Build.objects.create(**build_data)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Build.objects.create(**build_data)
