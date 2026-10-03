from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    # This line forces Pydantic to read your .env file
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def sync_database_url(self) -> str:
        # SQLAlchemy requires postgresql+psycopg:// for the psycopg3 driver
        url = self.DATABASE_URL.replace("postgres://", "postgresql+psycopg://")
        
        # Neon DB requires SSL
        if "?" not in url:
            url += "?sslmode=require"
        return url

settings = Settings()