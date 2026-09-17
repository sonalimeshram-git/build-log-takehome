from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response

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
