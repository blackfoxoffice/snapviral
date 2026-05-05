import { useMemo, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  Youtube,
  FileText,
  Lightbulb,
  Shield,
  AlertTriangle,
  Globe,
} from 'lucide-react-native';
import { createProjectSchema, type ImageStyle, type InputMode, type ProjectLanguage } from '@newsflow/shared';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Tabs } from '../../../components/ui/Tabs';
import { toast } from '../../../components/ui/Toast';
import { Stepper } from '../../../components/project/Stepper';
import { UrlInputList } from '../../../components/project/UrlInputList';
import { DurationPicker } from '../../../components/project/DurationPicker';
import { VoicePicker } from '../../../components/project/VoicePicker';
import { StylePicker } from '../../../components/project/StylePicker';
import { TopicSuggestions } from '../../../components/project/TopicSuggestions';
import { useCreateProject, useGenerateProject, useVoices } from '../../../lib/queries';

const STEPS = [{ label: 'Source' }, { label: 'Settings' }, { label: 'Review' }];

export default function NewProject() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [inputMode, setInputMode] = useState<InputMode>('urls');
  const [urls, setUrls] = useState<string[]>(['', '']);
  const [userScript, setUserScript] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<ProjectLanguage>('ta');
  const [duration, setDuration] = useState(30);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<ImageStyle>('realistic');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createMutation = useCreateProject();
  const generateMutation = useGenerateProject();
  const { data: voices } = useVoices(language);

  const cleanUrls = useMemo(() => urls.map((u) => u.trim()).filter(Boolean), [urls]);

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (inputMode === 'urls') {
      if (cleanUrls.length < 1) e.source_urls = 'Add at least one YouTube URL';
    } else if (inputMode === 'script') {
      if (userScript.trim().length < 50)
        e.user_script = 'Paste at least a short paragraph (50+ characters)';
    } else if (inputMode === 'topic' || inputMode === 'research') {
      if (topic.trim().length < 3) e.topic = 'Topic is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (title.trim().length < 1) e.title = 'Title is required';
    if ((inputMode === 'topic' || inputMode === 'research') && topic.trim().length < 3)
      e.topic = 'Topic is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    const payload = createProjectSchema.safeParse({
      title: title.trim(),
      topic: topic.trim() || null,
      language,
      duration_seconds: duration,
      input_mode: inputMode,
      source_urls: inputMode === 'urls' ? cleanUrls : null,
      user_script:
        inputMode === 'script'
          ? userScript
          : inputMode === 'research' && userScript.trim()
            ? userScript
            : null,
      voice_id: voiceId,
      image_style: imageStyle,
    });
    if (!payload.success) {
      const flat: Record<string, string> = {};
      for (const issue of payload.error.issues)
        flat[issue.path.join('.') || 'form'] = issue.message;
      setErrors(flat);
      return;
    }
    try {
      const project = await createMutation.mutateAsync(payload.data);
      await generateMutation.mutateAsync(project.id);
      toast.success('Project created', 'Generation has started.');
      router.replace(`/projects/${project.id}`);
    } catch (e) {
      toast.error('Could not create project', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-3xl pb-24"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 20 : 32 }}
      >
        <View className="mb-5">
          <Text
            className={`font-bold text-ink ${isMobile ? 'text-[22px]' : 'text-[24px]'}`}
            style={{ letterSpacing: -0.5 }}
          >
            New project
          </Text>
          <Text className="text-[13px] text-ink-muted mt-1">
            Pick how you want to start. We handle the rest.
          </Text>
        </View>

        <Stepper current={current} steps={STEPS} />

        <View className="mt-5">
          {current === 0 ? (
            <Card>
              <Card.Body className="gap-4">
                <View>
                  <Text className="text-[12px] font-semibold text-ink-secondary mb-2 uppercase tracking-wide">Choose your source</Text>
                  <Tabs
                    variant="card"
                    value={inputMode}
                    onChange={(v) => {
                      setInputMode(v as InputMode);
                      setErrors({});
                    }}
                    items={[
                      {
                        value: 'urls',
                        label: 'YouTube URLs',
                        icon: <Youtube size={14} color={inputMode === 'urls' ? '#00E676' : '#78909C'} />,
                        helper: 'Paste 1-5 competitor videos',
                      },
                      {
                        value: 'research',
                        label: 'Web research',
                        icon: <Globe size={14} color={inputMode === 'research' ? '#00E676' : '#78909C'} />,
                        helper: 'Perplexity Sonar Pro',
                      },
                      {
                        value: 'script',
                        label: 'Your script',
                        icon: <FileText size={14} color={inputMode === 'script' ? '#00E676' : '#78909C'} />,
                        helper: 'Paste your article or draft',
                      },
                      {
                        value: 'topic',
                        label: 'Topic only',
                        icon: <Lightbulb size={14} color={inputMode === 'topic' ? '#00E676' : '#78909C'} />,
                        helper: 'AI writes from knowledge',
                      },
                    ]}
                  />
                </View>

                {inputMode === 'urls' ? (
                  <View className="gap-3">
                    <View>
                      <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">
                        Competitor video URLs
                      </Text>
                      <UrlInputList urls={urls} onChange={setUrls} error={errors.source_urls} />
                    </View>
                    <View className="flex-row items-start gap-2 rounded-lg bg-surface-raised p-3">
                      <Shield size={14} color="#78909C" />
                      <Text className="flex-1 text-[11px] text-ink-muted leading-relaxed">
                        We fetch transcripts only. Video, audio, and images are never used —
                        everything is rewritten from scratch.
                      </Text>
                    </View>
                  </View>
                ) : null}

                {inputMode === 'research' ? (
                  <View className="gap-3">
                    <TopicSuggestions language={language} selected={topic} onPick={setTopic} />
                    <Input
                      label="Topic or headline"
                      value={topic}
                      onChangeText={setTopic}
                      placeholder="e.g., Chennai floods relief update"
                      error={errors.topic}
                    />
                    <Textarea
                      label="Extra context (optional)"
                      rows={4}
                      value={userScript}
                      onChangeText={setUserScript}
                      placeholder="Any angles, constraints, or extra facts..."
                    />
                    <View className="flex-row items-start gap-2 rounded-lg bg-state-info-soft p-3 border border-state-info/20">
                      <Globe size={14} color="#42A5F5" />
                      <Text className="flex-1 text-[11px] text-state-info leading-relaxed">
                        Perplexity Sonar Pro searches the live web, produces a cited briefing,
                        then Gemini turns it into an original Tamil script.
                      </Text>
                    </View>
                  </View>
                ) : null}

                {inputMode === 'script' ? (
                  <Textarea
                    label="Your script or story"
                    helper="Paste your article, blog post, or draft."
                    rows={10}
                    value={userScript}
                    onChangeText={setUserScript}
                    placeholder="Paste your story here (at least 50 characters)..."
                    error={errors.user_script}
                  />
                ) : null}

                {inputMode === 'topic' ? (
                  <View className="gap-3">
                    <TopicSuggestions language={language} selected={topic} onPick={setTopic} />
                    <Input
                      label="Topic or headline"
                      value={topic}
                      onChangeText={setTopic}
                      placeholder="e.g., Chennai floods relief update"
                      error={errors.topic}
                    />
                    <Textarea
                      label="Extra context (optional)"
                      rows={4}
                      value={userScript}
                      onChangeText={setUserScript}
                      placeholder="Any facts, angles or details you want included..."
                    />
                    <View className="flex-row items-start gap-2 rounded-lg bg-state-warning-soft p-3 border border-state-warning/20">
                      <AlertTriangle size={14} color="#FFB300" />
                      <Text className="flex-1 text-[11px] text-state-warning leading-relaxed">
                        No source = AI-generated from general knowledge. Verify facts before publishing.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Card.Body>
              <Card.Footer>
                <View className="flex-row justify-end gap-2">
                  <Button
                    onPress={() => {
                      if (validateStep1()) setCurrent(1);
                    }}
                    rightIcon={<ArrowRight size={14} color="#fff" />}
                    block={isMobile}
                  >
                    Continue
                  </Button>
                </View>
              </Card.Footer>
            </Card>
          ) : null}

          {current === 1 ? (
            <Card>
              <Card.Body className="gap-4">
                <Input
                  label="Project title"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="A short internal name for this video"
                  error={errors.title}
                />
                <Input
                  label={
                    inputMode === 'topic' || inputMode === 'research' ? 'Topic' : 'Topic (optional)'
                  }
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="One-line summary of the news"
                  error={errors.topic}
                />
                <Select<ProjectLanguage>
                  label="Language"
                  value={language}
                  onChange={(v) => { setLanguage(v); setVoiceId(null); }}
                  options={[
                    { value: 'ta', label: 'Tamil' },
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'Hindi' },
                  ]}
                />
                <StylePicker value={imageStyle} onChange={setImageStyle} />
                <DurationPicker value={duration} onChange={setDuration} />
                <VoicePicker language={language} value={voiceId} onChange={setVoiceId} />
              </Card.Body>
              <Card.Footer>
                <View className={`flex-row ${isMobile ? 'gap-2' : 'justify-between'}`}>
                  <Button
                    variant="secondary"
                    onPress={() => setCurrent(0)}
                    leftIcon={<ArrowLeft size={14} color="#B0BEC5" />}
                    block={isMobile}
                  >
                    Back
                  </Button>
                  <Button
                    onPress={() => {
                      if (validateStep2()) setCurrent(2);
                    }}
                    rightIcon={<ArrowRight size={14} color="#fff" />}
                    block={isMobile}
                  >
                    Review
                  </Button>
                </View>
              </Card.Footer>
            </Card>
          ) : null}

          {current === 2 ? (
            <Card>
              <Card.Header>
                <Text className="text-[14px] font-semibold text-ink">Review and generate</Text>
              </Card.Header>
              <Card.Body className="gap-3">
                <ReviewRow
                  label="Source"
                  value={
                    inputMode === 'urls'
                      ? `${cleanUrls.length} YouTube URL${cleanUrls.length === 1 ? '' : 's'}`
                      : inputMode === 'script'
                        ? 'Your own script'
                        : inputMode === 'research'
                          ? 'Live web research'
                          : 'Topic only'
                  }
                />
                <ReviewRow label="Title" value={title} />
                {topic ? <ReviewRow label="Topic" value={topic} /> : null}
                <ReviewRow label="Language" value={language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'} />
                <ReviewRow
                  label="Image style"
                  value={
                    imageStyle === 'cartoon' ? 'Cartoon' :
                    imageStyle === 'illustrated' ? 'Digital Art' :
                    imageStyle === 'ultra_realistic' ? 'Ultra HD' : 'Realistic'
                  }
                />
                <ReviewRow label="Duration" value={`${duration} seconds`} />
                <ReviewRow
                  label="Voice"
                  value={voiceId ? (voices?.find((v) => v.voice_id === voiceId)?.name ?? voiceId) : 'Default'}
                />
                <View className="mt-1 rounded-lg bg-surface-raised p-3.5 border border-surface-border">
                  <Text className="text-[10px] font-bold text-ink-muted mb-0.5 uppercase tracking-widest">
                    Estimated cost
                  </Text>
                  <Text className="text-[18px] font-bold text-ink">~$0.20</Text>
                </View>
              </Card.Body>
              <Card.Footer>
                <View className={`flex-row ${isMobile ? 'gap-2' : 'justify-between'}`}>
                  <Button
                    variant="secondary"
                    onPress={() => setCurrent(1)}
                    leftIcon={<ArrowLeft size={14} color="#B0BEC5" />}
                    block={isMobile}
                  >
                    Back
                  </Button>
                  <Button
                    onPress={handleCreate}
                    loading={createMutation.isPending || generateMutation.isPending}
                    leftIcon={<Wand2 size={14} color="#fff" />}
                    block={isMobile}
                  >
                    Generate video
                  </Button>
                </View>
              </Card.Footer>
            </Card>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-start border-b border-surface-border pb-2.5">
      <Text className="text-[11px] font-bold text-ink-muted uppercase tracking-wide">{label}</Text>
      <Text className="text-[13px] text-ink text-right flex-1 ml-4" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
