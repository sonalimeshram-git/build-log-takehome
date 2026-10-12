from django.db import IntegrityError, connection, transaction
from django.db.models import Count, Max, OuterRef, Q, Subquery
from rest_framework import generics, serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Build
from .serializers import BuildSerializer, ServiceSummarySerializer

# TODO(candidate): implement the three endpoints from ASSIGNMENT.md.
#
#   POST /api/builds/     -- record a build
#   GET  /api/builds/     -- paginated, filterable list
#   GET  /api/services/   -- one row per service, incl. its most recent build
#
# Use whatever DRF constructs you prefer: APIView, generics, ViewSets. The
# health check below is just here to prove the stack is wired up -- you can
# delete it once you have real endpoints, or leave it, your call.


@api_view(["GET"])
def health(request):
    """Confirms Django, DRF, and the database are all reachable."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()

    return Response({"status": "ok", "database": "ok"})

class BuildListCreateView(generics.ListCreateAPIView):
    """
    POST /api/builds/  record a build (validated by BuildSerializer)
    GET  /api/builds/  paginated list, newest first (filters added in Step 3)
    """

    serializer_class = BuildSerializer

    #  POST /api/builds/ -> record a build, return 201 Created with the new record, or 400 Bad Request with field errors.
    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            raise serializers.ValidationError(
                {"non_field_errors": ["This build was already recorded."]}
            )

    #  GET  /api/builds/?service=..&status=.. -> paginated list, newest first
    def get_queryset(self):
        
        queryset = Build.objects.all()

        service = self.request.query_params.get("service")
        if service:
            queryset = queryset.filter(service=service)

        status = self.request.query_params.get("status")
        if status:
            if status not in Build.Status.values:
                raise serializers.ValidationError(
                    {"status": [f"Must be one of: {', '.join(Build.Status.values)}."]}
                )
            queryset = queryset.filter(status=status)

        return queryset

class ServiceSummaryView(APIView):
    """
    GET /api/services/  one row per service: build counts, success rate, latest build status.

    Computed in a single SQL query (GROUP BY service, plus a correlated subquery for the
    latest status), so the number of queries doesn't grow with the number of services.
    """

    def get(self, request):
        latest = Build.objects.filter(service=OuterRef("service")).order_by("-started_at", "-id")

        rows = (
            Build.objects.order_by()  # clear default ordering so GROUP BY is only on service
            .values("service")
            .annotate(
                total_builds=Count("id"),
                success_count=Count("id", filter=Q(status=Build.Status.SUCCESS)),
                failed_count=Count("id", filter=Q(status=Build.Status.FAILED)),
                cancelled_count=Count("id", filter=Q(status=Build.Status.CANCELLED)),
                latest_status=Subquery(latest.values("status")[:1]),
                latest_started_at=Max("started_at"),
            )
            .order_by("service")
        )
        return Response(ServiceSummarySerializer(rows, many=True).data)