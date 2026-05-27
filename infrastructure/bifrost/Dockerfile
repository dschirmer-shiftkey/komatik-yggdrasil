FROM maximhq/bifrost:latest

COPY entrypoint.sh bootstrap.sh /app/
# Strip CRLF from Windows checkouts (breaks `set -e` under Alpine sh).
RUN tr -d '\r' < /app/entrypoint.sh > /tmp/entrypoint.sh && mv /tmp/entrypoint.sh /app/entrypoint.sh \
    && tr -d '\r' < /app/bootstrap.sh > /tmp/bootstrap.sh && mv /tmp/bootstrap.sh /app/bootstrap.sh

# Invoke via sh — avoids chmod on bases where / is not mutable (Docker Desktop/WSL).
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
