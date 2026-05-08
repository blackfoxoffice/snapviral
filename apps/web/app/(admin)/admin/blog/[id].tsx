import { useEffect, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Send,
  Trash2,
  ExternalLink,
  Upload,
  ImagePlus,
  X,
  Plus,
  Hash,
  Link2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import {
  useAdminBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  useUploadBlogImage,
} from '../../../../lib/queries';
import { Markdown } from '../../../../components/ui/Markdown';
import { toast } from '../../../../components/ui';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

export default function AdminBlogEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1000;

  const { data: post, isLoading } = useAdminBlogPost(id);
  const update = useUpdateBlogPost();
  const remove = useDeleteBlogPost();
  const upload = useUploadBlogImage();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!post) return;
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt ?? '');
    setContent(post.content_md ?? '');
    setCoverUrl(post.cover_image_url ?? '');
    setTags(post.tags ?? []);
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
        tags,
      };
      if (opts?.publish) next.status = 'published';
      if (opts?.unpublish) next.status = 'draft';
      const updated = await update.mutateAsync(next);
      setStatus(updated.status);
      setSlug(updated.slug);
      setDirty(false);
      toast.success(opts?.publish ? 'Published' : opts?.unpublish ? 'Unpublished' : 'Saved');
    } catch (e) {
      toast.error('Save failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Post deleted');
      router.replace('/admin/blog' as any);
    } catch (e) {
      toast.error('Delete failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('That file isn\'t an image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const out = await upload.mutateAsync({ dataUrl, filename: file.name });
        markDirty(setCoverUrl)(out.url);
        toast.success('Cover uploaded');
      } catch (e) {
        toast.error('Upload failed', e instanceof Error ? e.message : undefined);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAddTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput('');
      return;
    }
    markDirty(setTags)([...tags, t]);
    setTagInput('');
  }

  function handleRemoveTag(t: string) {
    markDirty(setTags)(tags.filter((x) => x !== t));
  }

  if (isLoading || !post) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF7' }}
      >
        <ActivityIndicator color="#E11D2C" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      {/* ============================================================ */}
      {/* Sticky save bar                                                */}
      {/* ============================================================ */}
      <View
        style={{
          position: 'sticky' as any,
          top: 0,
          zIndex: 20,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(10,10,11,0.08)',
          paddingHorizontal: isMobile ? 16 : 32,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Pressable
          onPress={() => router.push('/admin/blog' as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            height: 32,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(10,10,11,0.08)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <ArrowLeft size={12} color="#475569" />
          <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#27272A', fontWeight: '600' }}>
            All posts
          </Text>
        </Pressable>

        <View
          style={{
            paddingHorizontal: 8,
            height: 22,
            borderRadius: 6,
            backgroundColor: status === 'published' ? 'rgba(22,163,74,0.10)' : 'rgba(245,158,11,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: '700',
              color: status === 'published' ? '#16A34A' : '#D97706',
              letterSpacing: 0.6,
            }}
          >
            {status.toUpperCase()}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: dirty ? '#F59E0B' : '#16A34A',
            }}
          />
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: '#71717A' }}>
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: 2,
            backgroundColor: '#F4F4F5',
            borderRadius: 8,
            padding: 3,
          }}
        >
          {(['edit', 'preview'] as const).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={{
                  paddingHorizontal: 12,
                  height: 26,
                  borderRadius: 6,
                  backgroundColor: active ? '#FFFFFF' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 5,
                  ...(active ? ({ boxShadow: '0 1px 2px rgba(10,10,11,0.05)' } as any) : {}),
                }}
              >
                {t === 'edit' ? (
                  <EyeOff size={11} color={active ? '#0A0A0B' : '#71717A'} />
                ) : (
                  <Eye size={11} color={active ? '#0A0A0B' : '#71717A'} />
                )}
                <Text
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 12,
                    fontWeight: '600',
                    color: active ? '#0A0A0B' : '#71717A',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {status === 'published' && post.slug ? (
          <Pressable
            onPress={() => {
              if (typeof window !== 'undefined') window.open(`/blog/${post.slug}`, '_blank');
            }}
            style={iconBtn}
          >
            <ExternalLink size={12} color="#475569" />
          </Pressable>
        ) : null}

        <Pressable onPress={() => setConfirmDelete(true)} style={{ ...iconBtn, borderColor: '#FECACA' }}>
          <Trash2 size={12} color="#DC2626" />
        </Pressable>

        <Pressable
          onPress={() => save()}
          disabled={update.isPending}
          style={{
            ...iconBtn,
            paddingHorizontal: 12,
            width: undefined,
            flexDirection: 'row',
            gap: 5,
            opacity: update.isPending ? 0.6 : 1,
          }}
        >
          <Save size={12} color="#475569" />
          <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#27272A', fontWeight: '600' }}>
            {update.isPending && !update.variables?.status ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>

        {status === 'published' ? (
          <Pressable
            onPress={() => save({ unpublish: true })}
            disabled={update.isPending}
            style={{
              paddingHorizontal: 14,
              height: 32,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.20)',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: update.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#0A0A0B', fontWeight: '700' }}>
              Unpublish
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => save({ publish: true })}
            disabled={update.isPending}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#E11D2C',
              opacity: update.isPending ? 0.6 : 1,
              ...({ boxShadow: '0 4px 12px -4px rgba(225,29,44,0.4)' } as any),
            }}
          >
            <Send size={12} color="#FFFFFF" />
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>
              Publish
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flex: 1 }}>
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
          {/* ====================================================== */}
          {/* Main content panel                                       */}
          {/* ====================================================== */}
          <View
            style={{
              flex: isMobile ? undefined : 2,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.08)',
              overflow: 'hidden',
            }}
          >
            {/* Cover image area */}
            <CoverImageBlock
              url={coverUrl}
              uploading={upload.isPending}
              onPickFile={() => fileInputRef.current?.click()}
              onClear={() => markDirty(setCoverUrl)('')}
              onUrlChange={markDirty(setCoverUrl)}
              onDropFile={handleFile}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />

            {/* Title */}
            <View style={{ paddingHorizontal: 28, paddingTop: 24, paddingBottom: 8 }}>
              <SectionLabel>Title</SectionLabel>
              <TextInput
                value={title}
                onChangeText={markDirty(setTitle)}
                placeholder="A title that makes them click."
                placeholderTextColor="#A1A1AA"
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 30,
                  fontWeight: '800',
                  color: '#0A0A0B',
                  letterSpacing: -1,
                  marginTop: 4,
                  ...({ outlineStyle: 'none' } as any),
                }}
              />
            </View>

            {/* Excerpt */}
            <View style={{ paddingHorizontal: 28, paddingTop: 16, paddingBottom: 8 }}>
              <SectionLabel>Excerpt</SectionLabel>
              <TextInput
                value={excerpt}
                onChangeText={markDirty(setExcerpt)}
                placeholder="One-paragraph summary shown on the blog list and at the top of the post."
                placeholderTextColor="#A1A1AA"
                multiline
                style={{
                  fontFamily: FONT.serif,
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: '#475569',
                  lineHeight: 24,
                  marginTop: 4,
                  ...({ outlineStyle: 'none' } as any),
                }}
              />
            </View>

            {/* Body editor / preview */}
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(10,10,11,0.06)', marginTop: 12 }}>
              {tab === 'edit' ? (
                <View style={{ paddingHorizontal: 28, paddingTop: 18, paddingBottom: 28 }}>
                  <SectionLabel>Body · markdown</SectionLabel>
                  <TextInput
                    value={content}
                    onChangeText={markDirty(setContent)}
                    placeholder={
                      '# Heading\n\nBody copy.\n\nUse **bold**, *italic*, `code`, [links](https://example.com), bullet lists, > blockquotes, and ```fenced code``` blocks.'
                    }
                    placeholderTextColor="#A1A1AA"
                    multiline
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 13,
                      color: '#0A0A0B',
                      lineHeight: 22,
                      minHeight: 480,
                      marginTop: 8,
                      ...({ outlineStyle: 'none' } as any),
                    }}
                  />
                </View>
              ) : (
                <View style={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 32 }}>
                  <Markdown source={content} />
                </View>
              )}
            </View>
          </View>

          {/* ====================================================== */}
          {/* Sidebar — metadata                                        */}
          {/* ====================================================== */}
          <View
            style={{
              flex: isMobile ? undefined : 1,
              minWidth: isMobile ? undefined : 280,
              maxWidth: isMobile ? undefined : 360,
              gap: 14,
            }}
          >
            <SidebarCard title="Slug" Icon={Link2}>
              <TextInput
                value={slug}
                onChangeText={markDirty(setSlug)}
                placeholder="post-url-slug"
                placeholderTextColor="#A1A1AA"
                autoCapitalize="none"
                style={inputBase}
              />
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: '#71717A', marginTop: 8 }}>
                /blog/{slug || '…'}
              </Text>
              <Text style={{ fontFamily: FONT.sans, fontSize: 11, color: '#A1A1AA', marginTop: 4, lineHeight: 16 }}>
                Slug clashes are auto-resolved on save (you'll get{' '}
                <Text style={{ fontFamily: FONT.mono }}>-2</Text>,{' '}
                <Text style={{ fontFamily: FONT.mono }}>-3</Text> appended).
              </Text>
            </SidebarCard>

            <SidebarCard title="Tags" Icon={Hash}>
              {tags.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {tags.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => handleRemoveTag(t)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 9,
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: '#F4F4F5',
                        borderWidth: 1,
                        borderColor: 'rgba(10,10,11,0.08)',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 11,
                          fontWeight: '600',
                          color: '#27272A',
                        }}
                      >
                        {t}
                      </Text>
                      <X size={10} color="#71717A" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Add a tag…"
                    placeholderTextColor="#A1A1AA"
                    autoCapitalize="none"
                    style={inputBase}
                    onSubmitEditing={handleAddTag}
                  />
                </View>
                <Pressable
                  onPress={handleAddTag}
                  disabled={!tagInput.trim()}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: '#0A0A0B',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: tagInput.trim() ? 1 : 0.4,
                  }}
                >
                  <Plus size={14} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text style={{ fontFamily: FONT.sans, fontSize: 11, color: '#A1A1AA', marginTop: 8, lineHeight: 16 }}>
                First tag becomes the post's category badge.
              </Text>
            </SidebarCard>

            <SidebarCard title="Stats">
              <Stat label="Views" value={(post.view_count ?? 0).toLocaleString()} />
              <Stat label="Read time" value={`${post.read_minutes ?? 3} min`} />
              <Stat
                label="Created"
                value={new Date(post.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
              {post.published_at ? (
                <Stat
                  label="Published"
                  value={new Date(post.published_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
              ) : null}
              <Stat
                label="Updated"
                value={new Date(post.updated_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                last
              />
            </SidebarCard>
          </View>
        </View>
      </ScrollView>

      {/* Delete confirm */}
      {confirmDelete ? (
        <DeleteConfirm
          title={post.title}
          loading={remove.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </View>
  );
}

// =====================================================================
// Cover image block — drag-drop + button
// =====================================================================
function CoverImageBlock({
  url,
  uploading,
  onPickFile,
  onClear,
  onUrlChange,
  onDropFile,
}: {
  url: string;
  uploading: boolean;
  onPickFile: () => void;
  onClear: () => void;
  onUrlChange: (v: string) => void;
  onDropFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);

  const dropProps =
    typeof window !== 'undefined'
      ? {
          onDragOver: (e: any) => {
            e.preventDefault();
            setDragging(true);
          },
          onDragLeave: () => setDragging(false),
          onDrop: (e: any) => {
            e.preventDefault();
            setDragging(false);
            const f = (e.dataTransfer as DataTransfer)?.files?.[0];
            if (f) onDropFile(f);
          },
        }
      : {};

  if (url) {
    return (
      <View
        style={{
          aspectRatio: 16 / 6.5,
          backgroundColor: '#F4F4F5',
          position: 'relative',
        }}
      >
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Pressable
            onPress={onPickFile}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 10,
              height: 30,
              borderRadius: 8,
              backgroundColor: 'rgba(10,10,11,0.85)',
            }}
          >
            <Upload size={11} color="#FFFFFF" />
            <Text style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', color: '#FFFFFF' }}>
              Replace
            </Text>
          </Pressable>
          <Pressable
            onPress={onClear}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: 'rgba(10,10,11,0.85)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={11} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      // @ts-ignore — RN Web passes DOM event handlers through
      {...dropProps}
      style={{
        aspectRatio: 16 / 6.5,
        backgroundColor: dragging ? '#FEE2E2' : '#FAFAF7',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(10,10,11,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...({ transition: 'background 200ms ease' } as any),
      }}
    >
      {uploading ? (
        <>
          <ActivityIndicator color="#E11D2C" />
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: '#71717A' }}>uploading…</Text>
        </>
      ) : (
        <>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: dragging ? '#FECACA' : '#F4F4F5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImagePlus size={20} color={dragging ? '#DC2626' : '#52525B'} />
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '700', color: '#0A0A0B' }}>
              {dragging ? 'Drop to upload' : 'Add a cover image'}
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#71717A' }}>
              Drag a file here, click upload, or paste a URL
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={onPickFile}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                height: 34,
                borderRadius: 8,
                backgroundColor: '#0A0A0B',
              }}
            >
              <Upload size={12} color="#FFFFFF" />
              <Text style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>
                Upload image
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowUrlField((v) => !v)}
              style={{
                paddingHorizontal: 14,
                height: 34,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(10,10,11,0.10)',
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 5,
              }}
            >
              <Link2 size={11} color="#27272A" />
              <Text style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: '600', color: '#27272A' }}>
                Use URL
              </Text>
            </Pressable>
          </View>
          {showUrlField ? (
            <View style={{ width: '100%', maxWidth: 460, paddingHorizontal: 24, marginTop: 4 }}>
              <TextInput
                placeholder="https://..."
                placeholderTextColor="#A1A1AA"
                onChangeText={onUrlChange}
                autoCapitalize="none"
                style={inputBase}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

// =====================================================================
// Sidebar primitives
// =====================================================================

function SidebarCard({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon?: any;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.08)',
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(10,10,11,0.05)',
        }}
      >
        {Icon ? <Icon size={11} color="#71717A" strokeWidth={2.2} /> : null}
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: '700',
            color: '#71717A',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: '700',
        color: '#71717A',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

function Stat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(10,10,11,0.04)',
      }}
    >
      <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#71717A' }}>{label}</Text>
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 12,
          color: '#0A0A0B',
          fontWeight: '600',
          fontVariant: ['tabular-nums'] as any,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const inputBase = {
  fontFamily: FONT.sans,
  fontSize: 13,
  color: '#0A0A0B',
  paddingHorizontal: 12,
  paddingVertical: 9,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(10,10,11,0.10)',
  backgroundColor: '#FAFAF7',
  ...({ outlineStyle: 'none' } as any),
};

const iconBtn = {
  width: 32,
  height: 32,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(10,10,11,0.10)',
  backgroundColor: '#FFFFFF',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

// =====================================================================
// Delete confirm modal
// =====================================================================
function DeleteConfirm({
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
              {' '}will be permanently removed. This cannot be undone.
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
