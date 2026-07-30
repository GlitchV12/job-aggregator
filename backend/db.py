import os
from sqlalchemy import text
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./jobs.db")

# SQLite needs check_same_thread=False; Postgres doesn't accept it
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)


def is_postgres() -> bool:
    return engine.dialect.name == "postgresql"


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def run_search_index_setup():
    """Add a generated tsvector column + GIN index for full-text job search.

    Postgres only: SQLModel's create_all() never alters existing tables, so
    this idempotent DDL is how the column/index get added post-deploy. On
    SQLite this is a no-op; search falls back to ILIKE there.
    """
    if not is_postgres():
        return
    with engine.begin() as conn:
        conn.execute(text(
            """
            ALTER TABLE job ADD COLUMN IF NOT EXISTS search_vector tsvector
                GENERATED ALWAYS AS (to_tsvector('english',
                    coalesce(title, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(description, '')
                )) STORED
            """
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_job_search_vector ON job USING GIN(search_vector)"
        ))


def get_session():
    with Session(engine) as session:
        yield session
