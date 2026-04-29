import type { ProjectStatus } from '@newsflow/shared';
import { Badge } from '../ui/Badge';

const MAP: Record<ProjectStatus, { label: string; variant: Parameters<typeof Badge>[0]['variant'] }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  queued: { label: 'Queued', variant: 'info' },
  running: { label: 'Running', variant: 'warning' },
  ready: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const c = MAP[status];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
