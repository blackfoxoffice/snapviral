import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Play, Pause, Check, User } from 'lucide-react-native';
import type { VoiceOption } from '../../lib/api';
import { useVoices } from '../../lib/queries';

interface VoicePickerProps {
  language: string;
  value: string | null;
  onChange: (voiceId: string | null) => void;
}

export function VoicePicker({ language, value, onChange }: VoicePickerProps) {
  const { data: voices, isLoading, error } = useVoices(language);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playVoice = useCallback(
    (voice: VoiceOption) => {
      stopAudio();

      if (typeof window === 'undefined') return;

      const audio = new Audio(voice.preview_url);
      audioRef.current = audio;
      setPlayingId(voice.voice_id);

      audio.addEventListener('ended', () => {
        setPlayingId(null);
        audioRef.current = null;
      });

      audio.play().catch(() => {
        setPlayingId(null);
        audioRef.current = null;
      });
    },
    [stopAudio],
  );

  const togglePlay = useCallback(
    (voice: VoiceOption) => {
      if (playingId === voice.voice_id) {
        stopAudio();
      } else {
        playVoice(voice);
      }
    },
    [playingId, stopAudio, playVoice],
  );

  if (isLoading) {
    return (
      <View className="items-center justify-center py-8">
        <ActivityIndicator size="small" color="#E53935" />
        <Text className="text-[12px] text-ink-muted mt-2">Loading voices...</Text>
      </View>
    );
  }

  if (error || !voices?.length) {
    return (
      <View className="rounded-lg bg-surface-raised p-3">
        <Text className="text-[12px] text-ink-muted">
          {error ? 'Could not load voices. The default voice will be used.' : 'No voices available for this language.'}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wide">
          Choose a voice
        </Text>
        {value ? (
          <Pressable onPress={() => onChange(null)}>
            <Text className="text-[11px] text-ink-muted">Use default</Text>
          </Pressable>
        ) : null}
      </View>
      {voices.map((voice) => {
        const selected = value === voice.voice_id;
        const playing = playingId === voice.voice_id;
        return (
          <Pressable
            key={voice.voice_id}
            onPress={() => onChange(voice.voice_id)}
            className={`flex-row items-center rounded-lg border p-3 ${
              selected ? 'border-accent-border bg-accent-soft' : 'border-surface-border bg-surface-raised'
            }`}
          >
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                togglePlay(voice);
              }}
              className={`h-9 w-9 items-center justify-center rounded-full ${
                playing ? 'bg-brand' : 'bg-surface-card'
              }`}
            >
              {playing ? (
                <Pause size={12} color="#fff" fill="#fff" />
              ) : (
                <Play size={12} color="#B0BEC5" fill="#B0BEC5" />
              )}
            </Pressable>

            <View className="flex-1 ml-3 min-w-0">
              <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
                {voice.name}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Text className="text-[11px] text-ink-muted">{voice.gender}</Text>
                {voice.age ? (
                  <>
                    <Text className="text-[11px] text-ink-subtle">·</Text>
                    <Text className="text-[11px] text-ink-muted">{voice.age}</Text>
                  </>
                ) : null}
                {voice.accent ? (
                  <>
                    <Text className="text-[11px] text-ink-subtle">·</Text>
                    <Text className="text-[11px] text-ink-muted">{voice.accent}</Text>
                  </>
                ) : null}
              </View>
            </View>

            {selected ? (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-accent ml-2">
                <Check size={10} color="#0A0A0A" strokeWidth={3} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
