#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch Player Photos from Wikipedia API
Fetches official creative commons thumbnail photos for all tennis players across all categories.
"""

import json
import os
import time
import urllib.request
import urllib.parse

def get_wiki_image(name):
    # 検索候補
    candidates = [
        name,
        f"{name} (tennis)",
        f"{name} (tennis player)"
    ]

    for cand in candidates:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(cand)}&prop=pageimages&format=json&pithumbsize=400"
        req = urllib.request.Request(url, headers={'User-Agent': 'TennisTrackerApp/1.0 (info@example.com)'})
        try:
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                pages = data.get('query', {}).get('pages', {})
                for page_id, page_info in pages.items():
                    if page_id != "-1" and 'thumbnail' in page_info:
                        return page_info['thumbnail']['source']
        except Exception:
            pass
        time.sleep(0.05) # レートリミット対策

    return None

def fetch_all_photos():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")

    files = [
        "players_atp_singles.json",
        "players_wta_singles.json",
        "players_wheelchair.json",
        "players_atp_doubles.json",
        "players_wta_doubles.json"
    ]

    total_updated = 0

    for fname in files:
        fpath = os.path.join(data_dir, fname)
        if not os.path.exists(fpath):
            continue

        with open(fpath, "r", encoding="utf-8") as f:
            players = json.load(f)

        print(f"\n--- Processing {fname} ({len(players)} players) ---")
        file_updated = 0

        for idx, p in enumerate(players):
            name = p.get("name")
            if not name or "Tour Player" in name:
                continue

            current_img = p.get("imageUrl", "")
            # すでにthumb.wikimedia.orgやwikipediaのURLがある場合でも、最新画像に更新可能
            # または画像がない、あるいはunsplashなどの汎用画像の場合に取得
            need_fetch = (not current_img) or ("unsplash.com" in current_img) or ("wikimedia.org" not in current_img)

            if need_fetch:
                print(f"Fetching photo for #{p.get('rank')} {name} ...", end=" ", flush=True)
                img_url = get_wiki_image(name)
                if img_url:
                    p["imageUrl"] = img_url
                    file_updated += 1
                    total_updated += 1
                    print("✅ Found!")
                else:
                    print("❌ Not found")
                time.sleep(0.08)

        # ファイル保存
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(players, f, ensure_ascii=False, indent=2)

        print(f"Saved {fname}: {file_updated} photos updated.")

    print(f"\n🎉 Complete! Total {total_updated} player photos fetched and saved.")

if __name__ == "__main__":
    fetch_all_photos()
