"""Load data/seed_builds.json into the database.

    python manage.py load_seed
    python manage.py load_seed --path data/seed_builds.json

The file reading and CLI wiring are done. What's missing is the part that
actually creates rows -- that's yours, and it depends on how you modelled
things. Re-running this should be safe; how you achieve that is up to you.
"""

import json
import time
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.core.management.base import BaseCommand, CommandError
from builds.models import Build
from builds.serializers import BuildSerializer

DEFAULT_PATH = "data/seed_builds.json"
BATCH_SIZE = 500
MAX_ERRORS_SHOWN = 10


class SeedBuildSerializer(BuildSerializer):
    """Same field rules as the API, minus the per-record duplicate check. """

    class Meta(BuildSerializer.Meta):
        validators = []


class Command(BaseCommand):
    help = "Load seed build records from a JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default=DEFAULT_PATH,
            help=f"Path to the seed JSON file (default: {DEFAULT_PATH})",
        )

    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.is_absolute():
            path = Path(settings.BASE_DIR) / path

        if not path.exists():
            raise CommandError(f"Seed file not found: {path}")

        with path.open(encoding="utf-8") as fh:
            records = json.load(fh)

        self.stdout.write(f"Read {len(records)} records from {path}")

        # TODO(candidate): persist `records`. Consider how long this takes and
        # what happens if someone runs it twice.
        
        started = time.monotonic()

        # 1. Validate everything first, using the API's rules.
        valid, invalid = [], []
        for index, record in enumerate(records):
            serializer = SeedBuildSerializer(data=record)
            if serializer.is_valid():
                valid.append(Build(**serializer.validated_data))
            else:
                invalid.append((index, serializer.errors))

        # 2. Insert in batches, in one transaction: all or nothing.
        before = Build.objects.count()
        with transaction.atomic():
            Build.objects.bulk_create(valid, batch_size=BATCH_SIZE, ignore_conflicts=True)
        inserted = Build.objects.count() - before

        # 3. Report.
        elapsed = time.monotonic() - started
        already_present = len(valid) - inserted
        self.stdout.write(
            self.style.SUCCESS(
                f"Inserted {inserted}, skipped {already_present} already present, "
                f"rejected {len(invalid)} invalid ({elapsed:.2f}s). "
                f"Total builds: {before + inserted}."
            )
        )
        for index, errors in invalid[:MAX_ERRORS_SHOWN]:
            self.stdout.write(self.style.WARNING(f"  record {index}: {dict(errors)}"))
        if len(invalid) > MAX_ERRORS_SHOWN:
            self.stdout.write(self.style.WARNING(f"  ... and {len(invalid) - MAX_ERRORS_SHOWN} more"))
