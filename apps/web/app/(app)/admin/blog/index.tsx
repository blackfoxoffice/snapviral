import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ExternalLink,
  CheckCircle,
  Clock,
  Newspaper,
} from 'lucide-react-native';
import { useAdminBlogPosts, useDeleteBlogPost, useCreateBlogPost } from '../../../../lib/queries';
import { toast } from '../../../../components/ui';

export default function AdminBlogIndex() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { data, isLoading, refetch } = useAdminBlogPosts();
  const createPost = useCreateBlogPost();
  const deletePost = useDeleteBlogPost();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const posts = data?.posts ?? [];
  const drafts = posts.filter((p) => p.status === 'draft');
  const published = posts.filter((p) => p.status === 'published');

  async function handleNew() {
    try {
      const post = await createPost.mutateAsync({
        title: 'Untitled draft',
        content_md: '# Untitled draft\n\nStart writing here…',
      });
      toast.success('Draft created');
      router.push(`/admin/blog/${post.id}` as any);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create draft');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${title}"? This cannot be undone.`))
      return;
    setPendingDelete(id);
    try {
      await deletePost.mutateAsync(id);
      toast.success('Post deleted');
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-[1100px]"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: 24, paddingBottom: 80 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <View>
            <Text className="text-[24px] font-bold text-ink mb-1" style={{ letterSpacing: -0.5 }}>
              Blog
            </Text>
            <Text className="text-[13px] text-ink-muted">
              Publish posts to the public blog at /blog. Markdown supported.
            </Text>
          </View>
          <Pressable
            onPress={handleNew}
            disabled={createPost.isPending}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#0F172A',
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderRadius: 10,
              alignSelf: isMobile ? 'flex-start' : 'auto',
              opacity: createPost.isPending ? 0.7 : 1,
            }}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
              {createPost.isPending ? 'Creating…' : 'New post'}
            </Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatTile label="Published" value={published.length} accent="#10B981" Icon={CheckCircle} />
          <StatTile label="Drafts" value={drafts.length} accent="#F59E0B" Icon={Clock} />
          <StatTile label="Total" value={posts.length} accent="#0F172A" Icon={Newspaper} />
        </View>

        {/* Posts table */}
        {isLoading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator color="#E53935" />
          </View>
        ) : posts.length === 0 ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(15,23,42,0.08)',
              borderStyle: 'dashed',
              padding: 48,
              alignItems: 'center',
              backgroundColor: '#FAFAFA',
            }}
          >
            <Newspaper size={36} color="#94A3B8" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 14 }}>
              No posts yet
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
              Create your first draft to get started.
            </Text>
            <Pressable
              onPress={handleNew}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#E53935',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Plus size={13} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>New post</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(15,23,42,0.06)',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            {/* Table header (desktop only) */}
            {!isMobile ? (
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: '#FAFAFA',
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(15,23,42,0.06)',
                }}
              >
                <Text style={{ ...tableHeaderStyle, flex: 2 }}>Title</Text>
                <Text style={{ ...tableHeaderStyle, width: 120 }}>Status</Text>
                <Text style={{ ...tableHeaderStyle, width: 140 }}>Updated</Text>
                <Text style={{ ...tableHeaderStyle, width: 80 }}>Views</Text>
                <Text style={{ ...tableHeaderStyle, width: 120, textAlign: 'right' }}>Actions</Text>
              </View>
            ) : null}

            {posts.map((p, idx) => (
              <View
                key={p.id}
                style={{
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: idx === posts.length - 1 ? 0 : 1,
                  borderBottomColor: 'rgba(15,23,42,0.04)',
                  gap: isMobile ? 10 : 0,
                }}
              >
                {/* Title */}
                <View style={{ flex: isMobile ? undefined : 2, flexDirection: 'column' }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 2 }}
                    numberOfLines={1}
                  >
                    {p.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }} numberOfLines={1}>
                    /{p.slug}
                  </Text>
                </View>

                {/* Status */}
                <View style={{ width: isMobile ? undefined : 120, flexDirection: 'row' }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: p.status === 'published' ? '#D1FAE5' : '#FEF3C7',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: p.status === 'published' ? '#059669' : '#D97706',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      {p.status}
                    </Text>
                  </View>
                </View>

                {/* Updated */}
                <Text
                  style={{
                    width: isMobile ? undefined : 140,
                    fontSize: 12,
                    color: '#64748B',
                  }}
                >
                  {new Date(p.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>

                {/* Views */}
                <Text
                  style={{
                    width: isMobile ? undefined : 80,
                    fontSize: 12,
                    color: '#64748B',
                    fontVariant: ['tabular-nums'] as any,
                  }}
                >
                  {p.view_count.toLocaleString()}
                </Text>

                {/* Actions */}
                <View
                  style={{
                    width: isMobile ? undefined : 120,
                    flexDirection: 'row',
                    justifyContent: isMobile ? 'flex-start' : 'flex-end',
                    gap: 8,
                  }}
                >
                  <Pressable
                    onPress={() => router.push(`/admin/blog/${p.id}` as any)}
                    style={iconBtnStyle}
                  >
                    <Pencil size={13} color="#475569" />
                  </Pressable>
                  {p.status === 'published' ? (
                    <Pressable
                      onPress={() => {
                        if (typeof window !== 'undefined') {
                          window.open(`/blog/${p.slug}`, '_blank');
                        }
                      }}
                      style={iconBtnStyle}
                    >
                      <ExternalLink size={13} color="#475569" />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => handleDelete(p.id, p.title)}
                    disabled={pendingDelete === p.id}
                    style={{
                      ...iconBtnStyle,
                      opacity: pendingDelete === p.id ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={13} color="#E11D48" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const iconBtnStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(15,23,42,0.10)',
  backgroundColor: '#FFFFFF',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const tableHeaderStyle = {
  fontSize: 10,
  fontWeight: '700' as const,
  color: '#94A3B8',
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
};

function StatTile({
  label,
  value,
  accent,
  Icon,
}: {
  label: string;
  value: number;
  accent: string;
  Icon: any;
}) {
  return (
    <View
      style={{
        flexBasis: '30%',
        flexGrow: 1,
        minWidth: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.06)',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: `${accent}14`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={accent} />
      </View>
      <View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>
          {value}
        </Text>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: '#64748B',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
