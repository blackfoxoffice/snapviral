import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react-native';
import { useBlogPost } from '../../lib/queries';
import { SnapViralLogo } from '../../components/icons/SnapViralLogo';
import { Markdown } from '../../components/ui/Markdown';

export default function BlogPostDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isWide = width >= 1100;
  const PADDING_X = isMobile ? 20 : isWide ? 64 : 40;

  const { data: post, isLoading, error } = useBlogPost(slug);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} showsVerticalScrollIndicator={false}>
      {/* Top nav */}
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
            paddingHorizontal: PADDING_X,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={() => router.push('/blog' as any)}>
              <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>All posts</Text>
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
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>Try SnapViral</Text>
              <ArrowRight size={11} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 120, alignItems: 'center' }}>
          <ActivityIndicator color="#E53935" />
        </View>
      ) : error || !post ? (
        <View style={{ paddingVertical: 120, paddingHorizontal: PADDING_X, alignItems: 'center' }}>
          <SnapViralLogo size={48} />
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 16 }}>
            Post not found.
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>
            The post you're looking for doesn't exist or has been unpublished.
          </Text>
          <Pressable
            onPress={() => router.push('/blog' as any)}
            style={{
              marginTop: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: '#0F172A',
            }}
          >
            <ArrowLeft size={13} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Back to blog</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: PADDING_X,
              paddingTop: isMobile ? 40 : 72,
              paddingBottom: isMobile ? 32 : 48,
              backgroundImage:
                'radial-gradient(800px 400px at 20% -100px, rgba(229,57,53,0.06), transparent 60%)' as any,
            }}
          >
            <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
              <Pressable
                onPress={() => router.push('/blog' as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 24,
                }}
              >
                <ArrowLeft size={12} color="#64748B" />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Back to blog</Text>
              </Pressable>

              {post.tags?.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {post.tags.map((t) => (
                    <View
                      key={t}
                      style={{
                        backgroundColor: '#FEE2E2',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#E53935', letterSpacing: 1, textTransform: 'uppercase' }}>
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Text
                style={{
                  fontSize: isMobile ? 32 : 52,
                  lineHeight: isMobile ? 38 : 60,
                  fontWeight: '800',
                  color: '#0F172A',
                  letterSpacing: -1.6,
                  marginBottom: 20,
                }}
              >
                {post.title}
              </Text>

              {post.excerpt ? (
                <Text
                  style={{
                    fontSize: isMobile ? 17 : 20,
                    lineHeight: isMobile ? 26 : 32,
                    color: '#475569',
                    marginBottom: 24,
                  }}
                >
                  {post.excerpt}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {post.published_at ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Calendar size={12} color="#94A3B8" />
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} color="#94A3B8" />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>
                    {post.read_minutes ?? 3} min read
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cover image */}
          {post.cover_image_url ? (
            <View style={{ paddingHorizontal: PADDING_X, marginBottom: isMobile ? 32 : 56 }}>
              <View
                style={{
                  maxWidth: 920,
                  width: '100%',
                  alignSelf: 'center',
                  aspectRatio: 16 / 9,
                  borderRadius: 20,
                  backgroundColor: '#F1F5F9',
                  backgroundImage: `url(${post.cover_image_url})` as any,
                  backgroundSize: 'cover' as any,
                  backgroundPosition: 'center' as any,
                  overflow: 'hidden',
                }}
              />
            </View>
          ) : null}

          {/* Body */}
          <View style={{ paddingHorizontal: PADDING_X, paddingBottom: isMobile ? 56 : 96 }}>
            <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              <Markdown source={post.content_md ?? ''} />
            </View>
          </View>

          {/* CTA */}
          <View style={{ paddingHorizontal: PADDING_X, paddingBottom: isMobile ? 64 : 120 }}>
            <View
              style={{
                maxWidth: 720,
                width: '100%',
                alignSelf: 'center',
                backgroundColor: '#0F172A',
                borderRadius: 24,
                padding: isMobile ? 28 : 48,
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -80,
                  right: -80,
                  width: 280,
                  height: 280,
                  borderRadius: 140,
                  backgroundColor: '#E53935',
                  opacity: 0.25,
                  filter: 'blur(60px)' as any,
                }}
              />
              <Text
                style={{
                  fontSize: isMobile ? 22 : 30,
                  lineHeight: isMobile ? 28 : 38,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  letterSpacing: -0.8,
                  textAlign: 'center',
                  marginBottom: 12,
                  zIndex: 1,
                }}
              >
                Ready to ship your first viral Short?
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.65)',
                  textAlign: 'center',
                  marginBottom: 24,
                  zIndex: 1,
                }}
              >
                Free to start. No credit card. Bring your YouTube channel.
              </Text>
              <Pressable
                onPress={() => router.push('/signup' as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#E53935',
                  paddingHorizontal: 22,
                  paddingVertical: 13,
                  borderRadius: 10,
                  zIndex: 1,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Start free</Text>
                <ArrowRight size={13} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: PADDING_X,
          paddingVertical: 48,
          borderTopWidth: 1,
          borderTopColor: 'rgba(15,23,42,0.06)',
          backgroundColor: '#FAFAFA',
        }}
      >
        <View
          style={{
            maxWidth: 1080,
            width: '100%',
            alignSelf: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>
            © {new Date().getFullYear()} SnapViral · Built for creators in India
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Pressable onPress={() => router.push('/blog' as any)}>
              <Text style={{ fontSize: 12, color: '#64748B' }}>All posts</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/' as any)}>
              <Text style={{ fontSize: 12, color: '#64748B' }}>Home</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
