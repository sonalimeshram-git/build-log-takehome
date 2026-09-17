"""Load data/seed_builds.json into the database.

    python manage.py load_seed
    python manage.py load_seed --path data/seed_builds.json

The file reading and CLI wiring are done. What's missing is the part that
actually creates rows -- that's yours, and it depends on how you modelled
things. Re-running this should be safe; how you achieve that is up to you.
"""

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

DEFAULT_PATH = "data/seed_builds.json"


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

        self.stdout.write(
            self.style.WARNING("load_seed is not implemented yet -- nothing was saved.")
        )
