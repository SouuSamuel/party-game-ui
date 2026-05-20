import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, useAppTheme } from '../styles/theme';
import { playSoundEffect } from '../utils/audio';

type Props = {
  title: string;
  onPress?: () => void;
  emoji?: string;
  variant?: 'primary' | 'secondary' | 'dark';
  style?: ViewStyle;
};

export function PartyButton({ title, onPress, emoji, variant = 'primary', style }: Props) {
  const theme = useAppTheme();
  const { colors, gradients } = theme;
  const gradient =
    variant === 'primary'
      ? gradients.primary
      : variant === 'dark'
        ? gradients.dark
        : gradients.secondary;

  function handlePress() {
    void playSoundEffect('click');
    onPress?.();
  }

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, variant !== 'primary' && styles.outline, { borderColor: colors.border }]}
      >
        <Text style={[styles.text, { color: colors.textDark }, variant !== 'primary' && { color: colors.text }]}>
          {emoji ? `${emoji} ` : ''}{title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
  button: {
    minHeight: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  outline: {
    borderWidth: 1,
  },
  text: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
