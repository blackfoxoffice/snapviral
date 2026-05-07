import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ArrowLeft, Calendar, Clock } from 'lucide-react-native';
import { useBlogPosts } from '../../lib/queries';
import { SnapViralLogo } from '../../components/icons/SnapViralLogo';

export default function BlogIndex() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isWide = width >= 1100;
  const PADDING_X = isMobile ? 20 : isWide ? 64 : 40;

  const { data, isLoading } = useBlogPosts({ limit: 50 });
  const posts = data?.posts ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top nav */}
      <BlogNav padX={PADDING_X} isMobile={isMobile} router={router} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: PADDING_X,
          paddingTop: isMobile ? 56 : 96,
          paddingBottom: isMobile ? 32 : 56,
          backgroundImage:
            'radial-gradient(800px 400px at 20% -50px, rgba(229,57,53,0.07), transparent 60%), ' +
            'radial-gradient(600px 300px at 80% 0%, rgba(79,70,229,0.05), transparent 60%)' as any,
        }}
      >
        <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#E53935',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            The SnapViral Blog
          </Text>
          <Text
            style={{
              fontSize: isMobile ? 40 : 64,
              lineHeight: isMobile ? 44 : 68,
              fontWeight: '800',
              color: '#0F172A',
              letterSpacing: -2,
              maxWidth: 800,
            }}
          >
            Notes on shipping a{' '}
            <Text style={{ color: '#E53935', fontStyle: 'italic' }}>viral channel.</Text>
          </Text>
          <Text
            style={{
              fontSize: isMobile ? 16 : 18,
              lineHeight: isMobile ? 24 : 28,
              color: '#64748B',
              marginTop: 20,
              maxWidth: 640,
            }}
          >
            Field notes from creators using SnapViral, deep-dives on the AI pipeline, and what
            actually works on YouTube Shorts in 2026.
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ paddingHorizontal: PADDING_X, paddingBottom: 120 }}>
        <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
          {isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
              <ActivityIndicator color="#E53935" />
            </View>
          ) : posts.length === 0 ? (
            <View
              style={{
                paddingVertical: 80,
                alignItems: 'center',
                backgroundColor: '#FAFAFA',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.06)',
                borderStyle: 'dashed',
              }}
            >
              <SnapViralLogo size={48} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16 }}>
                Nothing published yet.
              </Text>
              <Text style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>
                Check back soon — we ship regularly.
              </Text>
            </View>
          ) : (
            <>
              {/* Featured (first post) */}
              {posts[0] ? (
                <FeaturedCard post={posts[0]} isMobile={isMobile} onPress={() => router.push(`/blog/${posts[0].slug}` as any)} />
              ) : null}

              {/* Grid (rest) */}
              {posts.length > 1 ? (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: isMobile ? 56 : 96,
                      marginBottom: 28,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#94A3B8',
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      All posts
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(15,23,42,0.08)' }} />
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                    {posts.slice(1).map((p) => (
                      <PostCard
                        key={p.id}
                        post={p}
                        isMobile={isMobile}
                        onPress={() => router.push(`/blog/${p.slug}` as any)}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>
      </View>

      <BlogFooter padX={PADDING_X} isMobile={isMobile} router={router} />
    </ScrollView>
  );
}

function BlogNav({ padX, isMobile, router }: { padX: number; isMobile: boolean; router: any }) {
  return (
    <View
      style={{
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)' as any,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(15,23,42,0.06)',
      }}
    >
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.push('/' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <SnapViralLogo size={28} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 }}>Snap</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#E53935', letterSpacing: -0.4, fontStyle: 'italic' }}>Viral</Text>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
          <Pressable onPress={() => router.push('/' as any)} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>Home</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/login' as any)} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/signup' as any)}
            style={{
              backgroundColor: '#0F172A',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>
              {isMobile ? 'Start free' : 'Start free trial'}
            </Text>
            <ArrowRight size={11} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FeaturedCard({
  post,
  isMobile,
  onPress,
}: {
  post: { slug: string; title: string; excerpt: string | null; cover_image_url: string | null; tags: string[]; read_minutes: number | null; published_at: string | null };
  isMobile: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.06)',
        overflow: 'hidden',
        flexDirection: isMobile ? 'column' : 'row',
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <View
        style={{
          flex: isMobile ? undefined : 1.2,
          aspectRatio: isMobile ? 16 / 9 : undefined,
          minHeight: isMobile ? undefined : 360,
          backgroundColor: '#F1F5F9',
          ...(post.cover_image_url
            ? {
                backgroundImage: `url(${post.cover_image_url})` as any,
                backgroundSize: 'cover' as any,
                backgroundPosition: 'center' as any,
              }
            : {}),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!post.cover_image_url ? <SnapViralLogo size={56} /> : null}
      </View>
      <View style={{ flex: 1, padding: isMobile ? 28 : 48, justifyContent: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#FEE2E2',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#E53935', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Featured
            </Text>
          </View>
          {post.tags?.[0] ? (
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {post.tags[0]}
            </Text>
          ) : null}
        </View>

        <Text
          style={{
            fontSize: isMobile ? 26 : 36,
            lineHeight: isMobile ? 32 : 44,
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: -1,
            marginBottom: 14,
          }}
        >
          {post.title}
        </Text>
        {post.excerpt ? (
          <Text style={{ fontSize: 15, color: '#64748B', lineHeight: 24, marginBottom: 24 }} numberOfLines={3}>
            {post.excerpt}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <PostMeta date={post.published_at} minutes={post.read_minutes} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginLeft: 'auto' as any,
            }}
          >
            <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700' }}>Read</Text>
            <ArrowRight size={13} color="#0F172A" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function PostCard({
  post,
  isMobile,
  onPress,
}: {
  post: { id: string; slug: string; title: string; excerpt: string | null; cover_image_url: string | null; tags: string[]; read_minutes: number | null; published_at: string | null };
  isMobile: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexBasis: isMobile ? '100%' : '32%',
        flexGrow: 1,
        minWidth: 280,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.06)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          aspectRatio: 16 / 9,
          backgroundColor: '#F1F5F9',
          ...(post.cover_image_url
            ? {
                backgroundImage: `url(${post.cover_image_url})` as any,
                backgroundSize: 'cover' as any,
                backgroundPosition: 'center' as any,
              }
            : {}),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!post.cover_image_url ? <SnapViralLogo size={36} /> : null}
      </View>
      <View style={{ padding: 22 }}>
        {post.tags?.[0] ? (
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#E53935', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
            {post.tags[0]}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#0F172A',
            letterSpacing: -0.4,
            marginBottom: 10,
            lineHeight: 24,
          }}
          numberOfLines={2}
        >
          {post.title}
        </Text>
        {post.excerpt ? (
          <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 14 }} numberOfLines={2}>
            {post.excerpt}
          </Text>
        ) : null}
        <PostMeta date={post.published_at} minutes={post.read_minutes} />
      </View>
    </Pressable>
  );
}

function PostMeta({ date, minutes }: { date: string | null; minutes: number | null }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {date ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Calendar size={11} color="#94A3B8" />
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Clock size={11} color="#94A3B8" />
        <Text style={{ fontSize: 11, color: '#94A3B8' }}>{minutes ?? 3} min read</Text>
      </View>
    </View>
  );
}

function BlogFooter({ padX, isMobile, router }: { padX: number; isMobile: boolean; router: any }) {
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingVertical: 48,
        borderTopWidth: 1,
        borderTopColor: 'rgba(15,23,42,0.06)',
        backgroundColor: '#FAFAFA',
      }}
    >
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 24,
          }}
        >
          <Pressable
            onPress={() => router.push('/' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <SnapViralLogo size={28} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 }}>Snap</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#E53935', letterSpacing: -0.4, fontStyle: 'italic' }}>Viral</Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 16 : 24 }}>
            <Pressable onPress={() => router.push('/' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Home</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/login' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/privacy' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/terms' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Terms</Text>
            </Pressable>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 32 }}>
          © {new Date().getFullYear()} SnapViral · Built for creators in India
        </Text>
      </View>
    </View>
  );
}
