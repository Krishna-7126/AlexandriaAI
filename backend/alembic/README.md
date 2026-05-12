Alembic folder for migrations. Use `alembic` CLI from the `backend` folder.

Example:

```powershell
cd backend
alembic revision --autogenerate -m "Initial models"
alembic upgrade head
```
