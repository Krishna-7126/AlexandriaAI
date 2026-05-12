Migration scaffolding (manual step)

This folder is a placeholder for Alembic migrations. To generate and run migrations locally:

1. Install Alembic in the project virtualenv:

```powershell
cd z:\AI-Learning-Companion
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

2. Initialize Alembic (one-time):

```powershell
cd backend
alembic init alembic
```

3. Edit `alembic/env.py` to configure the SQLAlchemy `engine`/`target_metadata` used by this project.

4. Generate a revision (autogenerate):

```powershell
alembic revision --autogenerate -m "Initial models"
```

5. Apply migrations:

```powershell
alembic upgrade head
```

If you want, I can scaffold an `alembic.ini` template and a basic `env.py` here, but it will need project-specific DB URL and metadata wiring.
