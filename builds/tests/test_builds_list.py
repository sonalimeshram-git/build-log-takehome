from datetime import datetime, timedelta, timezone

import pytest
from django.urls import reverse

from builds.models import Build

T0 = datetime(2026, 8, 1, 10, 0, tzinfo=timezone.utc)


def make(service, status, minutes, sha_char="a"):
    """Create a build `minutes` after T0. sha_char keeps (service, sha, started_at) unique."""
    return Build.objects.create(
        service=service, branch="main", commit_sha=sha_char * 40, status=status,
        started_at=T0 + timedelta(minutes=minutes), duration_ms=1000,
    )


# ---------- GET /api/builds/ ----------

@pytest.mark.django_db
def test_list_is_newest_first(client):
    make("api", "success", 1)
    make("api", "failed", 3)
    make("api", "success", 2)

    results = client.get(reverse("build-list")).json()["results"]

    assert [r["started_at"] for r in results] == [
        "2026-08-01T10:03:00Z", "2026-08-01T10:02:00Z", "2026-08-01T10:01:00Z",
    ]


@pytest.mark.django_db
def test_list_is_paginated_50_per_page(client):
    for i in range(55):
        make("api", "success", i)

    body = client.get(reverse("build-list")).json()

    assert body["count"] == 55
    assert len(body["results"]) == 50
    assert body["next"] is not None


@pytest.mark.django_db
def test_list_filters_by_service_and_status(client):
    make("api", "success", 1)
    make("api", "failed", 2)
    make("web", "failed", 3)
    url = reverse("build-list")

    assert client.get(url, {"service": "api"}).json()["count"] == 2
    assert client.get(url, {"status": "failed"}).json()["count"] == 2
    both = client.get(url, {"service": "api", "status": "failed"}).json()
    assert both["count"] == 1
    assert both["results"][0]["service"] == "api"
    assert client.get(url, {"service": "nope"}).json()["count"] == 0


@pytest.mark.django_db
def test_list_rejects_unknown_status_filter(client):
    response = client.get(reverse("build-list"), {"status": "passed"})

    assert response.status_code == 400
    assert "status" in response.json()


# ---------- GET /api/services/ ----------

@pytest.mark.django_db
def test_service_summary_counts_rate_and_latest(client):
    make("api", "success", 1, "a")
    make("api", "success", 2, "b")
    make("api", "failed", 3, "c")
    make("api", "cancelled", 4, "d")   # newest for "api"
    make("web", "failed", 1, "a")
    make("web", "success", 5, "b")     # newest for "web"

    rows = {r["service"]: r for r in client.get(reverse("service-summary")).json()}

    assert rows["api"] == {
        "service": "api",
        "total_builds": 4,
        "success_count": 2,
        "failed_count": 1,
        "cancelled_count": 1,
        "success_rate": 0.6667,          # 2 / (2 + 1): cancelled excluded
        "latest_status": "cancelled",
        "latest_started_at": "2026-08-01T10:04:00Z",
    }
    assert rows["web"]["latest_status"] == "success"
    assert rows["web"]["success_rate"] == 0.5


@pytest.mark.django_db
def test_service_with_only_cancelled_builds_has_null_rate(client):
    make("api", "cancelled", 1)

    row = client.get(reverse("service-summary")).json()[0]

    assert row["success_rate"] is None


@pytest.mark.django_db
def test_services_are_sorted_by_name(client):
    make("web", "success", 1)
    make("api", "success", 1)

    names = [r["service"] for r in client.get(reverse("service-summary")).json()]

    assert names == ["api", "web"]


@pytest.mark.django_db
def test_service_summary_is_one_query(client, django_assert_num_queries):
    for i, service in enumerate(["a-svc", "b-svc", "c-svc", "d-svc"]):
        make(service, "success", i)

    with django_assert_num_queries(1):
        client.get(reverse("service-summary"))