# Pin to digest to guard against supply chain attacks (Docker Hub compromise Apr 22 2026)
# Current digest as of 2026-04-23. Re-validate on next dependency update.
FROM maximhq/bifrost@sha256:ef9efcf3332e559d3d6748c807006e4271860f7d256ebd6ae0f714c6929792c3

# Use --chmod to set executable bit at copy time.
# RUN chmod is not allowed — bifrost runs as non-root appuser.
COPY --chmod=755 entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
