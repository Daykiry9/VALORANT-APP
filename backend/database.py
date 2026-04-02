import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# We check for a POSTGRES_DATABASE_URL or DATABASE_URL if user sets up supabase connection directly,
# else fall back to local sqlite for dev continuity before DB string is populated.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./val_analytics.db")

# For sqlite we need check_same_thread false, for postgres we don't.
# We determine the args dynamically.
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif DATABASE_URL.startswith("postgres"):
    # Fix sqlalchemy postgres driver compatibility
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
