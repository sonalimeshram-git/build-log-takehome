"""A single smoke test, so you know the test setup works before you start.

Run it with:  pytest

Delete or rewrite this file freely. ASSIGNMENT.md asks for tests on the parts
you'd be nervous about a teammate changing -- this isn't one of them.
"""

import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_health_endpoint_reports_ok(client):
    response = client.get(reverse("health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
