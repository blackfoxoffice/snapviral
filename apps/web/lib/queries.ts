import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput, SocialHandles } from '@newsflow/shared';
import { api } from './api';

export const qk = {
  dashboardStats: ['dashboard', 'stats'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  voices: (language: string) => ['voices', language] as const,
  logo: ['profile', 'logo'] as const,
  social: ['profile', 'social'] as const,
  ytStatus: ['youtube', 'status'] as const,
  adminOverview: ['admin', 'overview'] as const,
  adminSecrets: ['admin', 'secrets'] as const,
  adminAuditLog: ['admin', 'audit'] as const,
  adminUsers: ['admin', 'users'] as const,
  billingPlans: ['billing', 'plans'] as const,
  billingMe: ['billing', 'me'] as const,
  automationStatus: ['automation', 'status'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: qk.dashboardStats,
    queryFn: api.getDashboardStats,
    refetchInterval: 30000,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: qk.projects,
    queryFn: api.listProjects,
  });
}

export function useProject(id: string | undefined, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: id ? qk.project(id) : ['projects', 'none'],
    queryFn: () => api.getProject(id as string),
    enabled: !!id && (opts.enabled ?? true),
    refetchInterval: 4000,
  });
}

export function useLogo() {
  return useQuery({
    queryKey: qk.logo,
    queryFn: api.getLogo,
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dataUrl: string) => api.uploadLogo(dataUrl),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.logo });
    },
  });
}

export function useDeleteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteLogo(),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.logo });
    },
  });
}

export function useVoices(language: string) {
  return useQuery({
    queryKey: qk.voices(language),
    queryFn: () => api.listVoices(language),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => api.createProject(input),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.projects });
    },
  });
}

export function useGenerateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.generate(id),
    onSuccess(_data, id) {
      qc.invalidateQueries({ queryKey: qk.project(id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.projects });
    },
  });
}

export function useSocialHandles() {
  return useQuery({
    queryKey: qk.social,
    queryFn: api.getSocialHandles,
  });
}

export function useUpdateSocialHandles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handles: Partial<SocialHandles>) => api.updateSocialHandles(handles),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.social });
    },
  });
}

export function useYouTubeStatus() {
  return useQuery({
    queryKey: qk.ytStatus,
    queryFn: api.getYouTubeStatus,
  });
}

export function useDisconnectYouTube() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.disconnectYouTube(),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.ytStatus });
    },
  });
}

export function useGenerateYouTubeMetadata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.generateYouTubeMetadata(projectId),
    onSuccess(_data, projectId) {
      qc.invalidateQueries({ queryKey: qk.project(projectId) });
    },
  });
}

export function usePublishToYouTube() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { projectId: string; title?: string; description?: string; tags?: string[]; privacy?: 'public' | 'unlisted' | 'private'; scheduled_at?: string | null }) =>
      api.publishToYouTube(args.projectId, args),
    onSuccess(_data, args) {
      qc.invalidateQueries({ queryKey: qk.project(args.projectId) });
      qc.invalidateQueries({ queryKey: qk.projects });
    },
  });
}

export function useScheduleYouTube() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { projectId: string; scheduled_at: string; title?: string; description?: string; tags?: string[]; privacy?: 'public' | 'unlisted' | 'private' }) =>
      api.scheduleYouTube(args.projectId, args),
    onSuccess(_data, args) {
      qc.invalidateQueries({ queryKey: qk.project(args.projectId) });
      qc.invalidateQueries({ queryKey: qk.projects });
    },
  });
}

export function useCancelSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.cancelSchedule(projectId),
    onSuccess(_data, projectId) {
      qc.invalidateQueries({ queryKey: qk.project(projectId) });
    },
  });
}

// ===== Admin =====

export function useAdminOverview() {
  return useQuery({
    queryKey: qk.adminOverview,
    queryFn: api.getAdminOverview,
    refetchInterval: 30_000,
  });
}

export function useAdminSecrets() {
  return useQuery({
    queryKey: qk.adminSecrets,
    queryFn: api.listAdminSecrets,
  });
}

export function useCreateAdminSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { key_name: string; value: string; description?: string }) =>
      api.createAdminSecret(args),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.adminSecrets });
      qc.invalidateQueries({ queryKey: qk.adminAuditLog });
    },
  });
}

export function useRotateAdminSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { key_name: string; value: string }) =>
      api.rotateAdminSecret(args.key_name, args.value),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.adminSecrets });
      qc.invalidateQueries({ queryKey: qk.adminAuditLog });
    },
  });
}

export function useDeleteAdminSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key_name: string) => api.deleteAdminSecret(key_name),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.adminSecrets });
      qc.invalidateQueries({ queryKey: qk.adminAuditLog });
    },
  });
}

export function useAdminAuditLog(limit = 50) {
  return useQuery({
    queryKey: [...qk.adminAuditLog, limit],
    queryFn: () => api.getAdminAuditLog(limit),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: qk.adminUsers,
    queryFn: api.listAdminUsers,
  });
}

// ===== Billing =====

export function usePlans() {
  return useQuery({
    queryKey: qk.billingPlans,
    queryFn: api.listPlans,
    staleTime: 1000 * 60 * 60,
  });
}

export function useBillingMe() {
  return useQuery({
    queryKey: qk.billingMe,
    queryFn: api.getBillingMe,
    refetchInterval: 30_000,
  });
}

export function useCreateBillingCheckout() {
  return useMutation({
    mutationFn: api.createBillingCheckout,
  });
}

export function useOpenBillingPortal() {
  return useMutation({
    mutationFn: api.openBillingPortal,
  });
}

// ===== Automation =====

export function useAutomationStatus() {
  return useQuery({
    queryKey: qk.automationStatus,
    queryFn: api.getAutomationStatus,
    refetchInterval: 30_000,
  });
}

export function useUpdateAutomationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateAutomationSettings,
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.automationStatus });
    },
  });
}

export function useAddTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topics: Array<string | { topic: string; scheduled_at?: string }>) =>
      api.addTopics(topics),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.automationStatus });
    },
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string;
      topic?: string;
      scheduled_at?: string | null;
      language?: 'ta' | 'en' | 'hi' | null;
      voice_id?: string | null;
      user_script?: string | null;
    }) => {
      const { id, ...rest } = args;
      return api.updateTopic(id, rest);
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.automationStatus });
    },
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTopic(id),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.automationStatus });
    },
  });
}

export function useClearTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.clearTopics(),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.automationStatus });
    },
  });
}

export function useAutoScheduleTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.autoScheduleTopics(),
    onSuccess() {
      qc.invalidateQueries({ queryKey: qk.automationStatus });
    },
  });
}

export function useGenerateTopicSuggestions() {
  return useMutation({
    mutationFn: (args: { language?: 'ta' | 'en' | 'hi'; niche?: string; count?: number }) =>
      api.generateTopicSuggestions(args),
  });
}
