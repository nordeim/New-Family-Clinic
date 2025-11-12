```bash
echo "Ensuring supabase_admin exists (separate step to avoid shell heredoc issues)..." && \
PGPASSWORD="local_dev_password_change_me" psql "postgres://postgres@localhost:54322/postgres" -v ON_ERROR_STOP=1 << 'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin LOGIN SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS PASSWORD 'local_dev_password_change_me';
  END IF;
END;
$$;
SQL
```

---

```bash
export DATABASE_URL="postgres://postgres:local_dev_password_change_me@localhost:54322/postgres" && \
echo "Using DATABASE_URL=$DATABASE_URL" && \
echo "Running migrations after disabling prevent_appointment_overlap constraint in 005..." && \
npm run db:run-migrations && \
echo "Running seeds on successful schema..." && \
npm run db:run-seeds
```

---

```bash
export DATABASE_URL="postgres://postgres:local_dev_password_change_me@localhost:54322/postgres" && \
echo "Using clean DATABASE_URL=$DATABASE_URL" && \
echo "Running migrations on clean, healthy DB..." && \
npm run db:run-migrations
```

---

```bash
echo "Resetting local DB to guarantee a clean run, then re-running migrations with corrected 005 (no generated columns)..." && \
cd supabase && \
docker compose --env-file .env.docker down -v && \
docker compose --env-file .env.docker up -d supabase-db && \
echo "Waiting for supabase-db-local to become healthy..." && \
for i in {1..40}; do \
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' supabase-db-local 2>/dev/null || echo "unknown"); \
  echo "Check #$i: status=$STATUS"; \
  if [ "$STATUS" = "healthy" ]; then \
    echo "Postgres is healthy."; \
    break; \
  fi; \
  if [ "$STATUS" = "unhealthy" ]; then \
    echo "Postgres reported unhealthy. Logs:"; \
    docker logs supabase-db-local || true; \
    exit 1; \
  fi; \
  sleep 3; \
done && \
cd .. && \
export DATABASE_URL="postgres://postgres:local_dev_password_change_me@localhost:54322/postgres" && \
echo "Using clean DATABASE_URL=$DATABASE_URL" && \
echo "Creating supabase_admin role once for this clean DB..." && \
PGPASSWORD="local_dev_password_change_me" psql "postgres://postgres@localhost:54322/postgres" -v ON_ERROR_STOP=1 << 'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin LOGIN SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS PASSWORD 'local_dev_password_change_me';
  END IF;
END;
$$;
SQL && \
echo "Running migrations on truly clean DB..." && \
npm run db:run-migrations
```

---

```bash
cd supabase && \
echo "Checking supabase-db-local health after restart..." && \
for i in {1..40}; do \
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' supabase-db-local 2>/dev/null || echo "unknown"); \
  echo "Check #$i: status=$STATUS"; \
  if [ "$STATUS" = "healthy" ]; then \
    echo "Postgres is healthy."; \
    exit 0; \
  fi; \
  if [ "$STATUS" = "unhealthy" ]; then \
    echo "Postgres reported unhealthy. Logs:"; \
    docker logs supabase-db-local || true; \
    exit 1; \
  fi; \
  sleep 3; \
done && \
echo "Timed out waiting for supabase-db-local to become healthy. Logs:" && \
docker logs supabase-db-local || true && \
exit 1
```

---

```bash
echo "Ensuring supabase_admin exists with a clean, literal DO block..." && \
PGPASSWORD="local_dev_password_change_me" psql "postgres://postgres@localhost:54322/postgres" -v ON_ERROR_STOP=1 << 'SQL'
DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin
      LOGIN
      SUPERUSER
      CREATEDB
      CREATEROLE
      REPLICATION
      BYPASSRLS
      PASSWORD 'local_dev_password_change_me';
  END IF;
END;
$block$;
SQL
```
