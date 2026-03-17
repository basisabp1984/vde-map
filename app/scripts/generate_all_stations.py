"""
generate_all_stations.py — генерація all_stations.js з кандидатського CSV

Читає candidate CSV і записує const ALL_STATIONS = [...]; до двох файлів.

Використання:
  python app/scripts/generate_all_stations.py

Шляхи можна перевизначити через змінні середовища або редагуючи константи нижче.
"""

import csv
import json
import os
import sys
from pathlib import Path

# ── Конфігурація шляхів ─────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

INPUT_CSV = Path(os.environ.get(
    'INPUT_CSV',
    str(REPO_ROOT.parent / 'candidate_dataset' / 'stations_master_candidate_2026-03-17.csv')
))

OUTPUT_FILES = [
    Path(os.environ.get('OUTPUT_1', str(REPO_ROOT / 'app' / 'all_stations.js'))),
    Path(os.environ.get('OUTPUT_2', str(REPO_ROOT / 'all_stations.js'))),
]

# ── Нормалізація областей ────────────────────────────────────────────────────
# Зводить різні форми назв областей до стандартного вигляду (з "обл.")

OBLAST_MAP = {
    'Вінницька':          'Вінницька обл.',
    'Волинська':          'Волинська обл.',
    'Дніпропетровська':   'Дніпропетровська обл.',
    'Донецька':           'Донецька обл.',
    'Житомирська':        'Житомирська обл.',
    'Закарпатська':       'Закарпатська обл.',
    'Запорізька':         'Запорізька обл.',
    'Івано-Франківська':  'Івано-Франківська обл.',
    'Київська':           'Київська обл.',
    'Кіровоградська':     'Кіровоградська обл.',
    'Луганська':          'Луганська обл.',
    'Львівська':          'Львівська обл.',
    'Львівської':         'Львівська обл.',
    'Миколаївська':       'Миколаївська обл.',
    'Одеська':            'Одеська обл.',
    'Полтавська':         'Полтавська обл.',
    'Рівненська':         'Рівненська обл.',
    'Сумська':            'Сумська обл.',
    'Тернопільська':      'Тернопільська обл.',
    'Харківська':         'Харківська обл.',
    'Херсонська':         'Херсонська обл.',
    'Хмельницька':        'Хмельницька обл.',
    'Черкаська':          'Черкаська обл.',
    'Чернівецька':        'Чернівецька обл.',
    'Чернігівська':       'Чернігівська обл.',
    # Вже нормалізовані (з "обл.")
    'Вінницька обл.':         'Вінницька обл.',
    'Волинська обл.':         'Волинська обл.',
    'Дніпропетровська обл.':  'Дніпропетровська обл.',
    'Донецька обл.':          'Донецька обл.',
    'Житомирська обл.':       'Житомирська обл.',
    'Закарпатська обл.':      'Закарпатська обл.',
    'Запорізька обл.':        'Запорізька обл.',
    'Івано-Франківська обл.': 'Івано-Франківська обл.',
    'Київська обл.':          'Київська обл.',
    'Кіровоградська обл.':    'Кіровоградська обл.',
    'Луганська обл.':         'Луганська обл.',
    'Львівська обл.':         'Львівська обл.',
    'Миколаївська обл.':      'Миколаївська обл.',
    'Одеська обл.':           'Одеська обл.',
    'Полтавська обл.':        'Полтавська обл.',
    'Рівненська обл.':        'Рівненська обл.',
    'Сумська обл.':           'Сумська обл.',
    'Тернопільська обл.':     'Тернопільська обл.',
    'Харківська обл.':        'Харківська обл.',
    'Херсонська обл.':        'Херсонська обл.',
    'Хмельницька обл.':       'Хмельницька обл.',
    'Черкаська обл.':         'Черкаська обл.',
    'Чернівецька обл.':       'Чернівецька обл.',
    'Чернігівська обл.':      'Чернігівська обл.',
    # Спецвипадки
    'АР Крим':   'АР Крим',
    'Київ':      'м. Київ',
    'м. Київ':   'м. Київ',
}

# Рядки у полі region, які НЕ є назвою області (технічний сміття з реєстру)
NON_OBLAST_PATTERNS = {
    'ЧЕРГА', 'ПУСКОВ', 'ДАХОВА', 'НАЗЕМНА', 'КАДАСТРОВ', 'ФОТОВОЛЬТ',
    'МАРКИ', 'РУБАНІ', 'ПАРТИЗАН', 'ПЕРЕТВОР', 'ЗА МЕЖАМИ', 'М. ВІННИЦЯ',
}


def normalize_oblast(region_raw: str) -> str:
    """Повертає нормалізовану назву області або 'Невідомо'."""
    r = (region_raw or '').strip()
    if not r:
        return 'Невідомо'
    # Перевірити чи це не технічний текст
    r_upper = r.upper()
    for pat in NON_OBLAST_PATTERNS:
        if pat in r_upper:
            return 'Невідомо'
    return OBLAST_MAP.get(r, 'Невідомо')


# ── Перетворення рядка CSV → JS-об'єкт ──────────────────────────────────────

def to_float_or_null(val: str):
    """Повертає float або None."""
    v = val.strip() if val else ''
    if not v:
        return None
    try:
        return float(v)
    except ValueError:
        return None


def to_str_or_null(val: str):
    """Повертає рядок або None (порожній → None)."""
    v = (val or '').strip()
    return v if v else None


def to_int_or_null(val: str):
    v = (val or '').strip()
    if not v:
        return None
    try:
        return int(float(v))
    except ValueError:
        return None


def row_to_station(row: dict) -> dict:
    """Перетворює рядок CSV на об'єкт для all_stations.js."""
    region_raw = row.get('region', '') or ''
    oblast = normalize_oblast(region_raw)

    lat = to_float_or_null(row.get('lat', ''))
    lon = to_float_or_null(row.get('lon', ''))

    # is_approximate: True якщо координати не точні або відсутні
    location_confidence = (row.get('location_confidence') or '').strip()
    location_precision  = (row.get('location_precision')  or '').strip()
    is_approximate = (
        location_confidence in ('low', 'medium') or
        location_precision in ('region_only', 'settlement_estimated', 'oblast_centroid')
    )

    company_name = to_str_or_null(row.get('company_name', ''))
    contact_phone = to_str_or_null(row.get('contact_phone', ''))
    source_primary = to_str_or_null(row.get('source_primary', ''))
    source_urls    = to_str_or_null(row.get('source_urls', ''))

    capacity_raw = to_float_or_null(row.get('capacity_mw', ''))

    return {
        'station_id':            row.get('station_id', '').strip(),
        'name':                  (row.get('name') or '').strip(),
        'type':                  (row.get('type') or 'other').strip().lower(),
        'oblast':                oblast,
        'region':                oblast,                  # синхронізовано з oblast
        'company':               company_name,            # псевдонім для сумісності
        'company_name':          company_name,
        'company_edrpou':        to_str_or_null(row.get('company_edrpou', '')),
        'phone':                 contact_phone,           # псевдонім для сумісності
        'contact_phone':         contact_phone,
        'contact_email':         to_str_or_null(row.get('contact_email', '')),
        'website':               to_str_or_null(row.get('website', '')) or '',
        'capacity_mw':           capacity_raw,
        'lat':                   lat,
        'lon':                   lon,
        'location_precision':    location_precision or None,
        'location_confidence':   location_confidence or None,
        'is_approximate':        is_approximate,
        'license_num':           to_str_or_null(row.get('license_num', '')),
        'license_date':          to_str_or_null(row.get('license_date', '')),
        'commissioning_year':    to_int_or_null(row.get('commissioning_year', '')),
        'site_location':         to_str_or_null(row.get('site_location', '')),
        'address':               to_str_or_null(row.get('address', '')),
        'official_legal_region': to_str_or_null(row.get('official_legal_region', '')),
        'official_object_name':  to_str_or_null(row.get('official_object_name', '')),
        'official_object_region':to_str_or_null(row.get('official_object_region', '')),
        'official_technology':   to_str_or_null(row.get('official_technology', '')),
        'official_energy_source':to_str_or_null(row.get('official_energy_source', '')),
        'support_scheme':        to_str_or_null(row.get('support_scheme', '')),
        'support_scheme_date':   to_str_or_null(row.get('support_scheme_date', '')),
        'verification_status':   to_str_or_null(row.get('verification_status', '')),
        'source_primary':        source_primary,
        'source':                source_primary,          # псевдонім для сумісності
        'source_urls':           source_urls,
        'data_completeness_score': to_int_or_null(row.get('data_completeness_score', '')),
        'updated_at':            to_str_or_null(row.get('updated_at', '')),
        # Додаткові поля з кандидатського набору
        'status':                to_str_or_null(row.get('status', '')),
        'capacity_confidence':   to_str_or_null(row.get('capacity_confidence', '')),
        'contact_confidence':    to_str_or_null(row.get('contact_confidence', '')),
        'green_tariff_status':   to_str_or_null(row.get('green_tariff_status', '')),
        'notes':                 to_str_or_null(row.get('notes', '')),
    }


# ── Генерація JS ─────────────────────────────────────────────────────────────

def generate_js(stations: list) -> str:
    """Повертає рядок з вмістом all_stations.js."""
    encoded = json.dumps(stations, ensure_ascii=False, indent=2)
    return f'const ALL_STATIONS = {encoded};\n'


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f'Читаємо: {INPUT_CSV}')
    if not INPUT_CSV.exists():
        print(f'ПОМИЛКА: файл не знайдено: {INPUT_CSV}')
        sys.exit(1)

    stations = []
    with open(INPUT_CSV, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            stations.append(row_to_station(row))

    total = len(stations)
    with_coords = sum(1 for s in stations if s['lat'] is not None and s['lon'] is not None)
    print(f'Станцій зчитано: {total}')
    print(f'З координатами: {with_coords}')

    js_content = generate_js(stations)

    for out_path in OUTPUT_FILES:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(js_content, encoding='utf-8')
        size_kb = out_path.stat().st_size // 1024
        print(f'Записано ({size_kb} KB): {out_path}')

    print('Готово.')


if __name__ == '__main__':
    main()
