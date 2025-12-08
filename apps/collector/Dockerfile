FROM node:22.14.0-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN npm install turbo --global
COPY . .
RUN turbo prune collector --docker

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    POETRY_VERSION=1.8.2 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1

ENV PATH="$POETRY_HOME/bin:$PATH"

FROM base AS installer
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential


RUN curl -sSL https://install.python-poetry.org | python3 -
COPY --from=pruner /app/out/full/ .
WORKDIR /app/apps/collector
RUN poetry install --only main --no-root

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 python_group
RUN adduser --system --uid 1001 python_user

USER python_user
COPY --from=installer --chown=python_user:python_group /app/apps/collector .
ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "src/main.py"]