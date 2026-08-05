import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { radii, shadows, spacing, typography, useAppTheme } from '../styles/theme';
import { playSoundEffect } from '../utils/audio';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ScreenProps = {
  children: ReactNode;
  variant?: 'default' | 'soft';
  style?: ViewStyle;
};

export function AppScreen({ children, variant = 'default', style }: ScreenProps) {
  const theme = useAppTheme();
  const colors = variant === 'default' ? theme.gradients.screen : theme.gradients.screenAlt;

  return (
    <LinearGradient colors={colors} style={style ? [styles.screen, style] : styles.screen}>
      {children}
    </LinearGradient>
  );
}

type HeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  onBack?: () => void;
  icon?: IconName;
};

export function AppHeader({ eyebrow, title, description, onBack, icon }: HeaderProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      ) : null}
      {icon ? (
        <View style={[styles.headerIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name={icon} size={24} color={colors.accent} />
        </View>
      ) : null}
      <View style={styles.headerText}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {description ? <Text style={[styles.description, { color: colors.mutedStrong }]}>{description}</Text> : null}
      </View>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({ label, onPress, icon, variant = 'primary', disabled, style }: ButtonProps) {
  const theme = useAppTheme();
  const { colors } = theme;
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const backgroundColor = isPrimary ? colors.accent : isDanger ? colors.dangerSoft : colors.surface;
  const textColor = isPrimary ? colors.onAccent : isDanger ? colors.danger : colors.text;
  const borderColor = isPrimary ? colors.accent : isDanger ? colors.dangerSoft : colors.border;

  function handlePress() {
    if (disabled) return;
    void playSoundEffect('click');
    onPress?.();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={textColor} /> : null}
      <Text style={[styles.buttonText, { color: textColor }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useAppTheme();
  return <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.card, style]}>{children}</View>;
}

export function Chip({ label, selected, icon, onPress }: { label: string; selected?: boolean; icon?: IconName; onPress?: () => void }) {
  const theme = useAppTheme();
  const { colors } = theme;
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={15} color={selected ? colors.onAccent : colors.mutedStrong} /> : null}
      <Text style={[styles.chipText, { color: selected ? colors.onAccent : colors.mutedStrong }]}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.chip,
          { backgroundColor: selected ? colors.accent : colors.surfaceStrong, borderColor: selected ? colors.accent : colors.border },
          pressed && styles.pressed
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.chip, { backgroundColor: selected ? colors.accent : colors.surfaceStrong, borderColor: selected ? colors.accent : colors.border }]}>{content}</View>;
}

export function EmptyState({ title, description, icon = 'information-circle-outline' }: { title: string; description: string; icon?: IconName }) {
  const theme = useAppTheme();
  return (
    <Card style={styles.emptyState}>
      <Ionicons name={icon} size={28} color={theme.colors.accent} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.mutedStrong }]}>{description}</Text>
    </Card>
  );
}

export function ScorePill({ label, value }: { label: string; value: string | number }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.scorePill, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
      <Text style={[styles.scoreLabel, { color: theme.colors.muted }]}>{label}</Text>
      <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

export function TimerBadge({ seconds, urgent }: { seconds: number; urgent?: boolean }) {
  const theme = useAppTheme();
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const value = `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
  return (
    <View style={[styles.timer, { backgroundColor: urgent ? theme.colors.dangerSoft : theme.colors.accentSoft, borderColor: urgent ? theme.colors.danger : theme.colors.accent }]}>
      <Ionicons name="timer-outline" size={22} color={urgent ? theme.colors.danger : theme.colors.accent} />
      <Text style={[styles.timerText, { color: urgent ? theme.colors.danger : theme.colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    flex: 1
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 4
  },
  title: {
    ...typography.h1
  },
  description: {
    ...typography.body,
    marginTop: spacing.xs
  },
  button: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md
  },
  buttonText: {
    ...typography.button,
    textAlign: 'center',
    flexShrink: 1
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md
  },
  chip: {
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  chipText: {
    ...typography.caption,
    fontWeight: '800'
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center'
  },
  emptyDescription: {
    ...typography.body,
    textAlign: 'center'
  },
  scorePill: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 92
  },
  scoreLabel: {
    ...typography.caption
  },
  scoreValue: {
    ...typography.h2,
    marginTop: 2
  },
  timer: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  timerText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0
  }
});
