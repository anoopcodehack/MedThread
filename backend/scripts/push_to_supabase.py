"""
Direct Supabase PostgreSQL Schema Push & Seeder
Uses SQLAlchemy to connect directly to Supabase cloud PostgreSQL,
create all 5 enterprise tables, and seed initial benchmark data.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import create_engine, text
from backend.models.clinical_models import Base

# Candidate connection strings based on Supabase credentials
CANDIDATE_URLS = [
    # Standard Supabase Direct Postgres connection with postgres user
    "postgresql://postgres:MedThread_123@db.znwoerjmclnajtxhecek.supabase.co:5432/postgres",
    # Supabase connection pooler (Session mode - port 5432)
    "postgresql://postgres.znwoerjmclnajtxhecek:MedThread_123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
    # Supabase connection pooler (Transaction mode - port 6543)
    "postgresql://postgres.znwoerjmclnajtxhecek:MedThread_123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    # Custom username MedThread
    "postgresql://MedThread:MedThread_123@db.znwoerjmclnajtxhecek.supabase.co:5432/postgres",
]

def push_schema():
    print("=" * 70)
    print(" 🚀 CONNECTING TO SUPABASE CLOUD POSTGRESQL")
    print("=" * 70)
    
    active_engine = None
    working_url = None

    for i, url in enumerate(CANDIDATE_URLS, 1):
        masked = url.split("@")[1] if "@" in url else url
        print(f"\n[{i}/{len(CANDIDATE_URLS)}] Testing endpoint: {masked} ...")
        try:
            eng = create_engine(url, connect_args={"connect_timeout": 5})
            with eng.connect() as conn:
                res = conn.execute(text("SELECT version();")).scalar()
                print(f"  ✅ Connected successfully to Supabase PostgreSQL!")
                print(f"  Server Version: {res[:45]}...")
                active_engine = eng
                working_url = url
                break
        except Exception as e:
            err_msg = str(e).split("\n")[0]
            print(f"  ❌ Failed: {err_msg[:80]}")

    if not active_engine:
        print("\n" + "=" * 70)
        print(" ℹ️ DIRECT TCP CONNECTION WAS BLOCKED OR CREDENTIALS DIFFER")
        print(" 💡 To populate your Supabase schema instantly with 1 click:")
        print("    1. Open your Supabase Dashboard")
        print("    2. Click 'SQL Editor' (>_) on the left menu")
        print("    3. Paste backend/scripts/supabase_schema.sql and click 'RUN'")
        print("=" * 70)
        return False

    print("\n📦 Provisioning all 5 tables in Supabase public schema...")
    Base.metadata.create_all(bind=active_engine)
    print("✅ All tables created in Supabase!")

    # Execute SQL seed data if needed
    sql_path = PROJECT_ROOT / "backend" / "scripts" / "supabase_schema.sql"
    if sql_path.exists():
        print("🌱 Seeding 5 benchmark patients and clinical findings into Supabase...")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql_script = f.read()
        with active_engine.connect() as conn:
            conn.execute(text(sql_script))
            conn.commit()
        print("✅ Supabase cloud database fully seeded!")

    return True

if __name__ == "__main__":
    push_schema()
