FROM node:22.14.0-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install turbo --global
COPY . .
RUN turbo prune worker --docker

FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/ .

WORKDIR /app/apps/worker

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o worker_binary ./cmd/worker

FROM alpine:3.19 AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 go_group
RUN adduser --system --uid 1001 go_user

COPY --from=builder --chown=go_user:go_group /app/apps/worker/worker_binary .
RUN mkdir -p logs && chown -R go_user:go_group logs
USER go_user

CMD ["./worker_binary"]