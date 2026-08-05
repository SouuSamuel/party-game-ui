import type { ViewStyle } from 'react-native';
import { AppButton } from './ui';

type Props = {
  title: string;
  onPress?: () => void;
  emoji?: string;
  variant?: 'primary' | 'secondary' | 'dark';
  style?: ViewStyle;
};

export function PartyButton({ title, onPress, emoji, variant = 'primary', style }: Props) {
  void emoji;
  return <AppButton label={title} onPress={onPress} variant={variant === 'primary' ? 'primary' : 'secondary'} style={style} />;
}
