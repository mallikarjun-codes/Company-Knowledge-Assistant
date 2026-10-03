from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def sync_database_url(self) -> str:
        url = self.DATABASE_URL.replace("postgres://", "postgresql+psycopg://")
        if "?" not in url:
            url += "?sslmode=require"
        return url

settings = Settings()
