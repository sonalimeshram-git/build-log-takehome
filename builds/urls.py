from django.urls import path

from . import views

# TODO(candidate): route your endpoints here (or swap in a DRF router).
urlpatterns = [
    path("health/", views.health, name="health"),
]
