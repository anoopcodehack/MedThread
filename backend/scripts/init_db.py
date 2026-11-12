"""
MedThread Database Initialization Script
Initializes all database tables in either SQLite (Offline Mode) or Supabase PostgreSQL (Cloud Mode).
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import inspect
from backend.core.database import engine, Base
from backend.core.config import settings
from backend.models.clinical_models import Patient, Document, TimelineEvent, Contradiction, ReviewAuditLog

def initialize_database():
    dialect_name = engine.dialect.name
    is_postgres = "postgres" in dialect_name
    mode = "Supabase PostgreSQL Cloud" if is_postgres else "SQLite Bulletproof Local"
    
    print("=" * 70)
    print(" 🏥 MEDTHREAD DATABASE PROVISIONING")
    print("=" * 70)
    print(f" Engine Dialect : {dialect_name}")
    print(f" Target Mode    : {mode}")
    print(f" Database URL   : {settings.DATABASE_URL}")
    print("-" * 70)

    # Create all tables defined in ORM models
    Base.metadata.create_all(bind=engine)
    
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    print("\n📦 Verified Database Tables:")
    for tbl in sorted(table_names):
        columns = inspector.get_columns(tbl)
        print(f"  • {tbl.ljust(22)} ({len(columns)} columns)")
        
    required_tables = {"patients", "documents", "timeline_events", "contradictions", "review_audit_logs"}
    missing = required_tables - set(table_names)
    
    if not missing:
        print("\n✅ All 5 Enterprise Tables Successfully Provisioned!")
    else:
        print(f"\n❌ Error: Missing tables: {missing}")
        sys.exit(1)
        
    print("=" * 70)

if __name__ == "__main__":
    initialize_database()
