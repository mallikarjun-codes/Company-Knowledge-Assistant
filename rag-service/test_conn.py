import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
print(f"SQLAlchemy URL: {settings.SQLALCHEMY_DATABASE_URL[:80]}...")

from sqlalchemy import create_engine, text

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URL,
    connect_args={"connect_timeout": 5}
)

print("Attempting engine.connect()...")
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(f"OK: SELECT 1 returned {result.fetchone()}")
except Exception as e:
    print(f"FAIL: {type(e).__name__}: {e}")
finally:
    engine.dispose()
