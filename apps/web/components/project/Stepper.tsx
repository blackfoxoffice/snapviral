import { View, Text, useWindowDimensions } from 'react-native';
import { Check } from 'lucide-react-native';

interface StepperProps {
  current: number;
  steps: { label: string }[];
}

export function Stepper({ current, steps }: StepperProps) {
  const { width } = useWindowDimensions();
  const compact = width < 500;

  return (
    <View className="flex-row items-center w-full">
      {steps.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <View key={idx} className="flex-row items-center flex-1">
            <View className="flex-row items-center">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full border ${
                  done
                    ? 'bg-accent border-accent'
                    : active
                      ? 'bg-surface-card border-brand'
                      : 'bg-surface-raised border-surface-border'
                }`}
              >
                {done ? (
                  <Check size={13} color="#0A0A0A" strokeWidth={2.5} />
                ) : (
                  <Text
                    className={`text-[12px] font-bold ${active ? 'text-brand' : 'text-ink-subtle'}`}
                  >
                    {idx + 1}
                  </Text>
                )}
              </View>
              {!compact ? (
                <Text
                  className={`ml-2 text-[13px] font-semibold ${
                    active ? 'text-ink' : done ? 'text-accent' : 'text-ink-subtle'
                  }`}
                >
                  {step.label}
                </Text>
              ) : null}
            </View>
            {idx < steps.length - 1 ? (
              <View
                className={`h-px mx-2.5 flex-1 ${done ? 'bg-accent' : 'bg-surface-border'}`}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
