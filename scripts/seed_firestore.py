#!/usr/bin/env python3
"""
Seed all local tennis datasets into Firebase Firestore (project: tennis-510714).
Works via Firestore REST API (no firebase CLI or Google auth required in test mode).
"""

import json
import os
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "tennis-510714"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

DATA_FILES = {
    "atp_singles": "data/players_atp_singles.json",
    "wta_singles": "data/players_wta_singles.json",
    "atp_doubles": "data/players_atp_doubles.json",
    "wta_doubles": "data/players_wta_doubles.json",
    "wheelchair": "data/players_wheelchair.json",
    "tournaments": "data/tournaments.json",
}

def to_firestore_value(v):
    if v is None:
        return {"nullValue": None}
    elif isinstance(v, bool):
        return {"booleanValue": v}
    elif isinstance(v, int):
        return {"integerValue": str(v)}
    elif isinstance(v, float):
        return {"doubleValue": v}
    elif isinstance(v, str):
        return {"stringValue": v}
    elif isinstance(v, list):
        return {"arrayValue": {"values": [to_firestore_value(x) for x in v]}}
    elif isinstance(v, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(val) for k, val in v.items()}}}
    return {"stringValue": str(v)}

def upload_document(collection_name, item):
    doc_id = str(item.get("id") or f"item_{item.get('rank', 'x')}")
    # Replace slashes in doc_id
    doc_id = doc_id.replace("/", "_")
    url = f"{BASE_URL}/{collection_name}/{doc_id}"
    
    fields = {k: to_firestore_value(v) for k, v in item.items()}
    body = json.dumps({"fields": fields}).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status in (200, 201):
                return True, doc_id
            return False, f"Status {resp.status}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode('utf-8')[:100]}"
    except Exception as e:
        return False, str(e)

def seed_collection(collection_name, file_path):
    if not os.path.exists(file_path):
        print(f"⚠️ File not found: {file_path}")
        return 0, 0
    
    with open(file_path, "r", encoding="utf-8") as f:
        items = json.load(f)
    
    print(f"📦 Uploading {len(items)} items to '{collection_name}' collection...")
    success_count = 0
    failure_count = 0
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(upload_document, collection_name, item): item for item in items}
        for future in as_completed(futures):
            ok, msg = future.result()
            if ok:
                success_count += 1
            else:
                failure_count += 1
                print(f"  ❌ Failed: {msg}")
    
    print(f"  ✅ Completed '{collection_name}': {success_count} succeeded, {failure_count} failed.")
    return success_count, failure_count

def main():
    print(f"🚀 Starting Firestore Data Seeding for project: {PROJECT_ID}")
    total_ok = 0
    total_failed = 0
    
    for coll, path in DATA_FILES.items():
        ok, failed = seed_collection(coll, path)
        total_ok += ok
        total_failed += failed
        
    print("\n" + "=" * 50)
    print(f"🎉 Seeding finished! Total uploaded: {total_ok} documents ({total_failed} errors)")
    print("=" * 50)

if __name__ == "__main__":
    main()
