#!/bin/sh
# ================================================================
#  Morning Stars — Docker Entrypoint
#
#  Converts Railway's DATABASE_URL (postgres://...) to JDBC format
#  before starting Spring Boot.
# ================================================================

echo "[Entrypoint] Morning Stars starting..."

# ── Convert DATABASE_URL to JDBC format ──────────────────────────
if [ -z "$SPRING_DATASOURCE_URL" ]; then
  if [ -n "$DATABASE_URL" ]; then
    JDBC_URL=$(echo "$DATABASE_URL" \
      | sed 's|^postgres://|jdbc:postgresql://|' \
      | sed 's|^postgresql://|jdbc:postgresql://|')
    export SPRING_DATASOURCE_URL="$JDBC_URL"
    export SPRING_DATASOURCE_DRIVER_CLASS_NAME="org.postgresql.Driver"
    echo "[Entrypoint] DATABASE_URL converted to JDBC URL."
  else
    echo "[Entrypoint] No DATABASE_URL found. Using H2 in-memory database."
  fi
else
  echo "[Entrypoint] SPRING_DATASOURCE_URL already set — using as-is."
fi

# ── Credentials: fall back to PG* vars if SPRING_DATASOURCE_* not set ──
if [ -z "$SPRING_DATASOURCE_USERNAME" ]; then
  if [ -n "$PGUSER" ]; then
    export SPRING_DATASOURCE_USERNAME="$PGUSER"
    echo "[Entrypoint] Username sourced from PGUSER."
  fi
fi
if [ -z "$SPRING_DATASOURCE_PASSWORD" ]; then
  if [ -n "$PGPASSWORD" ]; then
    export SPRING_DATASOURCE_PASSWORD="$PGPASSWORD"
    echo "[Entrypoint] Password sourced from PGPASSWORD."
  fi
fi

# ── Extract credentials from DATABASE_URL if still missing ───────
# Railway sometimes embeds user:pass in the URL: postgres://user:pass@host/db
if [ -z "$SPRING_DATASOURCE_USERNAME" ] && [ -n "$DATABASE_URL" ]; then
  DB_USER=$(echo "$DATABASE_URL" | sed 's|.*://||' | sed 's|:.*||')
  DB_PASS=$(echo "$DATABASE_URL" | sed 's|.*://[^:]*:||' | sed 's|@.*||')
  if [ -n "$DB_USER" ]; then
    export SPRING_DATASOURCE_USERNAME="$DB_USER"
    export SPRING_DATASOURCE_PASSWORD="$DB_PASS"
    echo "[Entrypoint] Credentials extracted from DATABASE_URL."
  fi
fi

# ── Log final config ──────────────────────────────────────────────
echo "[Entrypoint] DB URL:    ${SPRING_DATASOURCE_URL:-<not set>}"
echo "[Entrypoint] DB Driver: ${SPRING_DATASOURCE_DRIVER_CLASS_NAME:-<not set>}"
echo "[Entrypoint] DB User:   ${SPRING_DATASOURCE_USERNAME:-<not set>}"
echo "[Entrypoint] Port:      ${PORT:-8080}"

# ── Start Spring Boot ─────────────────────────────────────────────
exec java \
  -Xmx400m \
  -Xms64m \
  -XX:+UseContainerSupport \
  -Dserver.port="${PORT:-8080}" \
  -Djava.security.egd=file:/dev/./urandom \
  -jar app.jar
