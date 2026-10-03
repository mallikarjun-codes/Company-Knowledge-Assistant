from sqlalchemy import create_engine
from app.core.config import settings

# pool_pre_ping prevents disconnected connections from hanging
engine = create_engine(
    settings.sync_database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10}
)