import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Send,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import {
  useAdminBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
} from '../../../../lib/queries';
import { Markdown } from '../../../../components/ui/Markdown';
import { toast } from '../../../../components/ui';

export default function AdminBlogEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const { data: post, isLoading } = useAdminBlogPost(id);
  const update = useUpdateBlogPost();
  const remove = useDeleteBlogPost();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Hydrate state when post arrives
  useEffect(() => {
    if (!post) return;
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt ?? '');
    setContent(post.content_md ?? '');
    setCoverUrl(post.cover_image_url ?? '');
    setTagsInput((post.tags ?? []).join(', '));
    setStatus(post.status);
    setDirty(false);
  }, [post]);

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function save(opts?: { publish?: boolean; unpublish?: boolean }) {
    if (!id) return;
    try {
      const next: Parameters<typeof update.mutateAsync>[0] = {
        id,
        title,
        slug: slug || undefined,
        excerpt: excerpt || null,
        content_md: content,
        cover_image_url: coverUrl || null,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (opts?.publish) next.status = 'published';
      if (opts?.unpublish) next.status = 'draft';
      const updated = await update.mutateAsync(next);
      setStatus(updated.status);
      setSlug(updated.slug);
      setDirty(false);
      toast.success(opts?.publish ? 'Published' : opts?.unpublish ? 'Unpublished' : 'Saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${title}"? This cannot be undone.`))
      return;
    try {
      await remove.mutateAsync(id);
      toast.success('Post deleted');
      router.replace('/admin/blog' as any);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  if (isLoading || !post) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Editor toolbar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: isMobile ? 16 : 32,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(15,23,42,0.06)',
          backgroundColor: '#FFFFFF',
          flexWrap: 'wrap',
        }}
      >
        <Pressable
          onPress={() => router.push('/admin/blog' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 }}
        >
          <ArrowLeft size={13} color="#475569" />
          <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>All posts</Text>
        </Pressable>

        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            backgroundColor: status === 'published' ? '#D1FAE5' : '#FEF3C7',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: status === 'published' ? '#059669' : '#D97706',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {status}
          </Text>
        </View>
        {dirty ? (
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>Unsaved changes</Text>
        ) : (
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>All changes saved</Text>
        )}

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={() => setShowPreview((s) => !s)}
          style={toolbarBtnStyle}
        >
          {showPreview ? <EyeOff size={12} color="#475569" /> : <Eye size={12} color="#475569" />}
          <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>
            {showPreview ? 'Edit' : 'Preview'}
          </Text>
        </Pressable>

        {status === 'published' && post?.slug ? (
          <Pressable
            onPress={() => {
              if (typeof window !== 'undefined') window.open(`/blog/${post.slug}`, '_blank');
            }}
            style={toolbarBtnStyle}
          >
            <ExternalLink size={12} color="#475569" />
            <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>View live</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={handleDelete} style={{ ...toolbarBtnStyle, borderColor: '#FEE2E2' }}>
          <Trash2 size={12} color="#E11D48" />
          <Text style={{ fontSize: 12, color: '#E11D48', fontWeight: '500' }}>Delete</Text>
        </Pressable>

        <Pressable
          onPress={() => save()}
          disabled={update.isPending}
          style={{ ...toolbarBtnStyle, opacity: update.isPending ? 0.6 : 1 }}
        >
          <Save size={12} color="#475569" />
          <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Save</Text>
        </Pressable>

        {status === 'published' ? (
          <Pressable
            onPress={() => save({ unpublish: true })}
            disabled={update.isPending}
            style={{
              ...toolbarBtnStyle,
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(15,23,42,0.20)',
              opacity: update.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '700' }}>Unpublish</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => save({ publish: true })}
            disabled={update.isPending}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#E53935',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              opacity: update.isPending ? 0.6 : 1,
            }}
          >
            <Send size={12} color="#FFFFFF" />
            <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>Publish</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            maxWidth: 1280,
            width: '100%',
            alignSelf: 'center',
            paddingHorizontal: isMobile ? 16 : 32,
            paddingTop: 24,
            paddingBottom: 80,
            gap: 24,
          }}
        >
          {/* Main: title + content */}
          <View
            style={{
              flex: isMobile ? undefined : 2,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(15,23,42,0.06)',
              padding: isMobile ? 18 : 28,
            }}
          >
            <TextInput
              value={title}
              onChangeText={markDirty(setTitle)}
              placeholder="Post title"
              placeholderTextColor="#CBD5E1"
              style={{
                fontSize: 30,
                fontWeight: '800',
                color: '#0F172A',
                letterSpacing: -0.8,
                marginBottom: 12,
                ...({ outlineStyle: 'none' } as any),
              }}
            />

            <TextInput
              value={excerpt}
              onChangeText={markDirty(setExcerpt)}
              placeholder="Short excerpt — shown on the blog list and at the top of the post"
              placeholderTextColor="#CBD5E1"
              multiline
              style={{
                fontSize: 15,
                color: '#475569',
                lineHeight: 24,
                marginBottom: 24,
                ...({ outlineStyle: 'none' } as any),
              }}
            />

            {showPreview ? (
              <View style={{ paddingTop: 8 }}>
                <Markdown source={content} />
              </View>
            ) : (
              <TextInput
                value={content}
                onChangeText={markDirty(setContent)}
                placeholder={'# Heading\n\nWrite the post body in markdown.\n\nUse **bold**, *italic*, `code`, [links](https://example.com), lists, > blockquotes, and ```fenced code```.'}
                placeholderTextColor="#CBD5E1"
                multiline
                style={{
                  fontFamily: 'monospace',
                  fontSize: 14,
                  color: '#0F172A',
                  lineHeight: 22,
                  minHeight: 480,
                  ...({ outlineStyle: 'none' } as any),
                }}
              />
            )}
          </View>

          {/* Sidebar: metadata */}
          <View
            style={{
              flex: isMobile ? undefined : 1,
              minWidth: isMobile ? undefined : 280,
              maxWidth: isMobile ? undefined : 340,
              gap: 16,
            }}
          >
            <SidebarCard title="Slug">
              <TextInput
                value={slug}
                onChangeText={markDirty(setSlug)}
                placeholder="post-url-slug"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                style={inputStyle}
              />
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                /blog/{slug || '...'}
              </Text>
            </SidebarCard>

            <SidebarCard title="Cover image URL">
              <TextInput
                value={coverUrl}
                onChangeText={markDirty(setCoverUrl)}
                placeholder="https://…"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                style={inputStyle}
              />
              {coverUrl ? (
                <View
                  style={{
                    marginTop: 10,
                    aspectRatio: 16 / 9,
                    borderRadius: 8,
                    backgroundColor: '#F1F5F9',
                    backgroundImage: `url(${coverUrl})` as any,
                    backgroundSize: 'cover' as any,
                    backgroundPosition: 'center' as any,
                  }}
                />
              ) : null}
            </SidebarCard>

            <SidebarCard title="Tags">
              <TextInput
                value={tagsInput}
                onChangeText={markDirty(setTagsInput)}
                placeholder="ai, automation, youtube"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                style={inputStyle}
              />
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                Comma-separated. The first tag becomes the category badge.
              </Text>
            </SidebarCard>

            <SidebarCard title="Stats">
              <Stat label="Views" value={post.view_count.toLocaleString()} />
              <Stat label="Read time" value={`${post.read_minutes ?? 3} min`} />
              <Stat
                label="Created"
                value={new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
              {post.published_at ? (
                <Stat
                  label="Published"
                  value={new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
              ) : null}
            </SidebarCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const toolbarBtnStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(15,23,42,0.10)',
  backgroundColor: '#FFFFFF',
};

const inputStyle = {
  fontSize: 13,
  color: '#0F172A',
  paddingHorizontal: 12,
  paddingVertical: 9,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(15,23,42,0.10)',
  backgroundColor: '#FFFFFF',
  ...({ outlineStyle: 'none' } as any),
};

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.06)',
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: '#94A3B8',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(15,23,42,0.04)',
      }}
    >
      <Text style={{ fontSize: 12, color: '#64748B' }}>{label}</Text>
      <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
