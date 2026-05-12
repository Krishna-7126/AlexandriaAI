Development setup notes
-----------------------

1) Install backend dependencies (try the helper script):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
./scripts/install_backend_deps.ps1
```

If the full install fails due to `pydantic-core`/native build errors, the script will attempt a partial install (excluding `pydantic`) and provide guidance.

2) To resolve native build issues (pydantic-core):
- Install Visual Studio Build Tools with 'Desktop development with C++' workload.
- Install Rust via https://rustup.rs/
- Then re-run `./scripts/install_backend_deps.ps1` or run: `python -m pip install -r backend/requirements.txt`.

3) Alternative: Use a Python 3.11 virtualenv where prebuilt wheels for `pydantic-core` are widely available.

4) Alembic migrations:

From `backend` folder:

```powershell
cd backend
alembic upgrade head
```

5) Running tests locally:

```powershell
$env:PYTHONPATH = Get-Location
.\.venv\Scripts\Activate.ps1
pytest tests -q
```

6) Optional: Run Redis + background worker for queued educational analysis:

```powershell
docker compose -f docker-compose.redis-worker.yml up -d
```

With worker enabled, v3 educational analysis may return `status: queued` first,
then update automatically once the background job caches final results.
