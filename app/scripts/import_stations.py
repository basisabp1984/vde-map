"""
import_stations.py — початковий імпорт станцій з all_stations.js до Supabase

Використання:
  pip install supabase
  python scripts/import_stations.py

Потрібні змінні середовища (або замінити в коді):
  SUPABASE_URL          — https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY  — service_role key (не anon key!)
"""

import os
import re
import json
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("Встановіть бібліотеку: pip install supabase")
    raise

# ── Налаштування ─────────────────────────────────────────────────────────────
SUPABASE_URL         = os.environ.get('SUPABASE_URL', 'SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_KEY')
BATCH_SIZE = 100

# Шлях до all_stations.js відносно цього скрипту
ALL_STATIONS_JS = Path(__file__).parent.parent.parent / 'all_stations.js'

# ── Зчитати all_stations.js ───────────────────────────────────────────────────
def load_all_stations(path: Path) -> list[dict]:
    text = path.read_text(encoding='utf-8')
    # Витягуємо масив між першим [ і останнім ]
    m = re.search(r'const ALL_STATIONS\s*=\s*(\[[\s\S]*\])', text)
    if not m:
        raise ValueError(f"Не знайдено ALL_STATIONS у {path}")
    return json.loads(m.group(1))

# ── Поля, які зберігаємо в Supabase ──────────────────────────────────────────
KEEP_FIELDS = [
    'station_id','name','type','oblast','region',
    'company','company_name','company_edrpou',
    'phone','contact_phone','contact_email','website',
    'capacity_mw','lat','lon',
    'is_approximate','location_precision','location_confidence',
    'license_num','license_date',
    'address','site_location','official_object_name','official_object_region',
    'official_technology','official_energy_source',
    'support_scheme','support_scheme_date',
    'source','source_primary','verification_status','data_completeness_score',
]

def clean_station(s: dict) -> dict:
    row = { k: s.get(k) for k in KEEP_FIELDS }
    # Переконуємось що type — один з дозволених значень
    if row.get('type') not in ('solar','wind','other'):
        row['type'] = 'solar'
    return row

# ── Основна логіка ────────────────────────────────────────────────────────────
def main():
    if 'SUPABASE_URL' in (SUPABASE_URL, SUPABASE_SERVICE_KEY):
        print("❌ Вставте реальні SUPABASE_URL і SUPABASE_SERVICE_KEY")
        return

    print(f"Зчитую {ALL_STATIONS_JS}...")
    stations = load_all_stations(ALL_STATIONS_JS)
    print(f"Знайдено {len(stations)} станцій")

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    rows = [clean_station(s) for s in stations]

    inserted = updated = errors = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i+BATCH_SIZE]
        try:
            res = client.table('stations').upsert(batch, on_conflict='station_id').execute()
            # supabase-py повертає список вставлених/оновлених записів
            inserted += len(res.data or [])
            print(f"  [{i+len(batch)}/{len(rows)}] ОК")
        except Exception as e:
            errors += 1
            print(f"  [{i+len(batch)}/{len(rows)}] Помилка: {e}")

    print(f"\nГотово. Оброблено: {inserted}. Помилок: {errors}.")

if __name__ == '__main__':
    main()
