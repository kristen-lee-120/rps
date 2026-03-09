"""Helpers for syncing public OSF files into the local dataset directory."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.request import urlopen, urlretrieve


OSF_FILES_URL = "https://api.osf.io/v2/nodes/4at6q/files/osfstorage/?format=json"
DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _list_osf_csv_files(url: str = OSF_FILES_URL) -> list[dict]:
    files = []
    next_url = url

    while next_url:
        with urlopen(next_url) as response:
            payload = json.load(response)

        files.extend(
            item
            for item in payload["data"]
            if item["attributes"]["kind"] == "file"
            and item["attributes"]["name"].endswith(".csv")
        )
        next_url = payload["links"]["next"]

    return files


def sync_osf(data_dir: Path | None = None) -> list[str]:
    """Download OSF CSVs into the local data directory and return paths."""

    target_dir = (data_dir or DEFAULT_DATA_DIR) / "raw"
    target_dir.mkdir(parents=True, exist_ok=True)

    for item in _list_osf_csv_files():
        destination = target_dir / item["attributes"]["name"]
        urlretrieve(item["links"]["download"], destination)

    result = sorted(str(path) for path in target_dir.glob("*.csv"))
    print(f'Synced {len(result)} CSV files from OSF to {target_dir}')
    return result
