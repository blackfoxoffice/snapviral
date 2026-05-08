import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Newspaper,
  Search,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react-native';
import { useAdminBlogPosts, useDeleteBlogPost, useCreateBlogPost } from '../../../../lib/queries';
import { toast } from '../../../../components/ui';
import type { BlogPost } from '@newsflow/shared';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminBlogIndex() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const { data, isLoading, refetch } = useAdminBlogPosts();
  const createPost = useCreateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [confirmTarget, setConfirmTarget] = useState<BlogPost | null>(null);

  const posts = data?.posts ?? [];
  const drafts = posts.filter((p) => p.status === 'draft');
  const published = posts.filter((p) => p.status === 'published');
  const totalViews = posts.reduce((s, p) => s + (p.view_count ?? 0), 0);

  const filtered = useMemo(() => {
    let out = posts;
    if (filter !== 'all') out = out.filter((p) => p.status === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return out;
  }, [posts, query, filter]);

  async function handleNew() {
    try {
      const post = await createPost.mutateAsync({
        title: 'Untitled draft',
        content_md: '# Untitled draft\n\nStart writing here.',
      });
      toast.success('Draft created');
      router.push(`/admin/blog/${post.id}` as any);
    } catch (e) {
      toast.error('Could not create draft', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    try {
      await deletePost.mutateAsync(confirmTarget.id);
      toast.success('Post deleted', confirmTarget.title);
      setConfirmTarget(null);
      refetch();
    } catch (e) {
      toast.error('Delete failed', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: isMobile ? 16 : 32,
          paddingTop: 28,
          paddingBottom: 80,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E11D2C' }} />
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#E11D2C',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Editorial
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: isMobile ? 26 : 34,
                fontWeight: '700',
                color: '#0A0A0B',
                letterSpacing: -1.2,
                marginBottom: 6,
              }}
            >
              Blog
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: '#52525B', maxWidth: 540, lineHeight: 22 }}>
              Publish field notes, product updates and long-form essays to{' '}
              <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: '#0A0A0B' }}>/blog</Text>.
              Markdown supported, slugs collision-proof.
            </Text>
          </View>
          <Pressable
            onPress={handleNew}
            disabled={createPost.isPending}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingHorizontal: 16,
              height: 42,
              borderRadius: 12,
              backgroundColor: '#0A0A0B',
              opacity: createPost.isPending ? 0.7 : 1,
              ...({ boxShadow: '0 8px 24px -8px rgba(10,10,11,0.20)' } as any),
            }}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 }}>
              {createPost.isPending ? 'Creating…' : 'New post'}
            </Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <Stat label="Published" value={published.length} accent="#16A34A" Icon={CheckCircle2} />
          <Stat label="Drafts" value={drafts.length} accent="#F59E0B" Icon={Clock} />
          <Stat label="Total" value={posts.length} accent="#0A0A0B" Icon={Newspaper} />
          <Stat label="Total views" value={totalViews} accent="#7C3AED" Icon={Eye} />
        </View>

        {/* Toolbar */}
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              height: 42,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.08)',
            }}
          >
            <Search size={14} color="#71717A" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search title, slug or tag…"
              placeholderTextColor="#A1A1AA"
              style={{
                flex: 1,
                fontFamily: FONT.sans,
                fontSize: 13,
                color: '#0A0A0B',
                ...({ outlineStyle: 'none' } as any),
              }}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')}>
                <X size={13} color="#71717A" />
              </Pressable>
            ) : null}
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 4,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 4,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.08)',
            }}
          >
            {(['all', 'published', 'draft'] as const).map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: 14,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: active ? '#0A0A0B' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: 12,
                      fontWeight: '600',
                      color: active ? '#FFFFFF' : '#52525B',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator color="#E11D2C" />
          </View>
        ) : filtered.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.10)',
              borderStyle: 'dashed',
              padding: 56,
              alignItems: 'center',
            }}
          >
            <Newspaper size={28} color="#A1A1AA" />
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 15,
                fontWeight: '700',
                color: '#0A0A0B',
                marginTop: 14,
              }}
            >
              {posts.length === 0 ? 'No posts yet' : 'No posts match'}
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 13,
                color: '#71717A',
                marginTop: 6,
                marginBottom: posts.length === 0 ? 18 : 0,
              }}
            >
              {posts.length === 0 ? 'Create your first draft to get started.' : 'Try a different keyword or filter.'}
            </Text>
            {posts.length === 0 ? (
              <Pressable
                onPress={handleNew}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#0A0A0B',
                  paddingHorizontal: 16,
                  height: 38,
                  borderRadius: 10,
                }}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  New post
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.08)',
              overflow: 'hidden',
            }}
          >
            {filtered.map((p, i) => (
              <PostRow
                key={p.id}
                post={p}
                last={i === filtered.length - 1}
                onEdit={() => router.push(`/admin/blog/${p.id}` as any)}
                onView={() => {
                  if (typeof window !== 'undefined') window.open(`/blog/${p.slug}`, '_blank');
                }}
                onDelete={() => setConfirmTarget(p)}
                isMobile={isMobile}
              />
            ))}
          </View>
        )}
      </View>

      {confirmTarget ? (
        <DeleteConfirmModal
          title={confirmTarget.title}
          loading={deletePost.isPending}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </ScrollView>
  );
}

function PostRow({
  post,
  last,
  onEdit,
  onView,
  onDelete,
  isMobile,
}: {
  post: BlogPost;
  last: boolean;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  isMobile: boolean;
}) {
  const isPublished = post.status === 'published';
  return (
    <View
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(10,10,11,0.05)',
      }}
    >
      {/* Cover thumbnail */}
      <View
        style={{
          width: isMobile ? '100%' : 88,
          aspectRatio: isMobile ? 16 / 9 : 16 / 10,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#F4F4F5',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(10,10,11,0.06)',
        }}
      >
        {post.cover_image_url ? (
          <Image source={{ uri: post.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Newspaper size={20} color="#A1A1AA" />
        )}
      </View>

      {/* Title + meta */}
      <Pressable onPress={onEdit} style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 15,
              fontWeight: '700',
              color: '#0A0A0B',
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {post.title}
          </Text>
          <View
            style={{
              paddingHorizontal: 7,
              height: 18,
              borderRadius: 4,
              backgroundColor: isPublished ? 'rgba(22,163,74,0.10)' : 'rgba(245,158,11,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: '700',
                color: isPublished ? '#16A34A' : '#D97706',
                letterSpacing: 0.5,
              }}
            >
              {post.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: '#71717A', marginBottom: 4 }} numberOfLines={1}>
          /blog/{post.slug}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#A1A1AA' }}>
            updated {timeAgo(post.updated_at)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Eye size={10} color="#71717A" />
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#71717A', fontVariant: ['tabular-nums'] as any }}>
              {(post.view_count ?? 0).toLocaleString()}
            </Text>
          </View>
          {(post.tags ?? []).length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(post.tags ?? []).slice(0, 3).map((t) => (
                <View
                  key={t}
                  style={{
                    paddingHorizontal: 6,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: '#F4F4F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#27272A', fontWeight: '600' }}>
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end' }}>
        <IconBtn Icon={Pencil} onPress={onEdit} />
        {isPublished ? <IconBtn Icon={ExternalLink} onPress={onView} /> : null}
        <IconBtn Icon={Trash2} onPress={onDelete} danger />
      </View>
    </View>
  );
}

function IconBtn({ Icon, onPress, danger }: { Icon: any; onPress: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: danger
          ? hover
            ? '#FECACA'
            : 'rgba(10,10,11,0.10)'
          : hover
            ? 'rgba(10,10,11,0.20)'
            : 'rgba(10,10,11,0.10)',
        backgroundColor: danger ? (hover ? '#FEF2F2' : '#FFFFFF') : hover ? '#F4F4F5' : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...({ transition: 'all 180ms ease' } as any),
      }}
    >
      <Icon size={13} color={danger ? '#DC2626' : '#475569'} />
    </Pressable>
  );
}

function Stat({
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
        flexBasis: '22%',
        flexGrow: 1,
        minWidth: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.08)',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: `${accent}14`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} color={accent} strokeWidth={2.2} />
      </View>
      <View>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 22,
            fontWeight: '700',
            color: '#0A0A0B',
            letterSpacing: -0.5,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {value.toLocaleString()}
        </Text>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: '700',
            color: '#71717A',
            letterSpacing: 1.2,
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

function DeleteConfirmModal({
  title,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View
      style={{
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10,10,11,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 100,
        ...({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any),
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          ...({ boxShadow: '0 30px 60px -15px rgba(10,10,11,0.4)' } as any),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={18} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 18,
                fontWeight: '700',
                color: '#0A0A0B',
                letterSpacing: -0.4,
                marginBottom: 6,
              }}
            >
              Delete this post?
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, lineHeight: 20, color: '#52525B' }}>
              <Text style={{ fontWeight: '700', color: '#0A0A0B' }}>{title}</Text>
              {' '}will be permanently removed. Cover image stays in storage. This cannot be undone.
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={onCancel}
            disabled={loading}
            style={{
              paddingHorizontal: 16,
              height: 40,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.10)',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: '#27272A' }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={loading}
            style={{
              paddingHorizontal: 16,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#DC2626',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2 size={12} color="#FFFFFF" />
                <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  Delete post
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
