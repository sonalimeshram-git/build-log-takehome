import pytest
from django.urls import reverse

from builds.models import Build

VALID = {
    "service": "checkout-api",
    "branch": "main",
    "commit_sha": "0529367c4583676370b25ecda8f05582d358a6b5",
    "status": "success",
    "started_at": "2026-10-10T10:00:00Z",
    "duration_ms": 83362,
}


def post(client, payload):
    return client.post(reverse("build-list"), payload, content_type="application/json")


@pytest.mark.django_db
def test_valid_build_is_created(client):
    response = post(client, VALID)
    assert response.status_code == 201, response.json()
    assert response.json()["started_at"] == "2026-10-10T10:00:00Z"
    assert Build.objects.count() == 1


@pytest.mark.django_db
@pytest.mark.parametrize("field, bad_value", [
    ("service", ""),
    ("branch", ""),
    ("commit_sha", "abc123"),
    ("commit_sha", "z" * 40),
    ("commit_sha", "a" * 41),
    ("status", "passed"),
    ("status", "Success"),
    ("started_at", "not-a-date"),
    ("started_at", "2026-10-10T10:00:00"),          # no timezone
    ("started_at", "2026-10-10T10:00:00+05:30"),    # not UTC
    ("started_at", "2026-13-01T10:00:00Z"),         # impossible month
    ("duration_ms", -1),
    ("duration_ms", "83362"),
    ("duration_ms", 12.5),
    ("duration_ms", True),
])
def test_bad_value_returns_400_on_that_field(client, field, bad_value):
    response = post(client, {**VALID, field: bad_value})
    assert response.status_code == 400
    assert field in response.json(), response.json()
    assert Build.objects.count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize("field", list(VALID))
def test_missing_field_returns_400_on_that_field(client, field):
    response = post(client, {k: v for k, v in VALID.items() if k != field})
    assert response.status_code == 400
    assert field in response.json()

@pytest.mark.django_db
def test_every_bad_field_is_reported_at_once(client):
    response = post(client, {"service": "", "commit_sha": "xyz", "status": "passed",
                             "started_at": "2026-08-01 10:00", "duration_ms": -5})
    assert response.status_code == 400
    assert set(response.json()) >= {"service", "branch", "commit_sha", "status", "started_at", "duration_ms"}

@pytest.mark.django_db
def test_same_run_twice_is_400_not_500(client):
    assert post(client, VALID).status_code == 201
    assert post(client, VALID).status_code == 400
    assert Build.objects.count() == 1

@pytest.mark.django_db
@pytest.mark.parametrize("bad_status", ["passed", "Success", "SUCCESS", "", 1])
def test_invalid_status_lists_the_allowed_values(client, bad_status):
    response = post(client, {**VALID, "status": bad_status})

    assert response.status_code == 400
    assert response.json()["status"] == ["Must be one of: success, failed, cancelled."]
    assert Build.objects.count() == 0

@pytest.mark.django_db
@pytest.mark.parametrize("field, good_value", [
    ("status", "success"),
    ("status", "failed"),
    ("status", "cancelled"),
])
def test_good_value_is_accepted(client, field, good_value):
    response = post(client, {**VALID, field: good_value})
    assert response.status_code == 201
    assert response.json()[field] == good_value
    assert field in response.json()