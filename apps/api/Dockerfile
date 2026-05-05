FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-noto \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    fonts-noto-extra \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# fonts-noto-extra includes Noto Sans Tamil, used by the FFmpeg subtitle burn-in.

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Copy workspace manifests, the shared package, the API package, and the root tsconfig
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install all workspace deps (incl. tsx for runtime TS execution)
RUN pnpm install --frozen-lockfile || pnpm install

ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

EXPOSE 4000

# Run TypeScript directly with tsx — no build step. Avoids monorepo rootDir
# issues and third-party type quirks. tsx is fast enough for production API
# duty and the hot path is FFmpeg/HTTP, not TS overhead.
CMD ["pnpm", "--filter", "@newsflow/api", "exec", "tsx", "src/index.ts"]
