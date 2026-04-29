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

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @newsflow/api build

ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
