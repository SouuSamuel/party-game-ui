import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../styles/theme';

const ITEMS = [
  { top: 80, left: 24, backgroundColor: 'rgba(103,232,249,0.16)' },
  { top: 148, right: 34, backgroundColor: 'rgba(167,139,250,0.16)' },
  { bottom: 156, left: 30, backgroundColor: 'rgba(190,242,100,0.12)' },
  { bottom: 86, right: 42, backgroundColor: 'rgba(251,113,133,0.13)' },
];

export function FloatingDecorations() {
  const theme = useAppTheme();
  const { colors } = theme;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const translateY = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const rotate = pulse.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ITEMS.map((item, index) => (
        <Animated.View key={index} style={[styles.item, item, { borderColor: colors.border, transform: [{ translateY }, { rotate }] }]}>
          <View style={[styles.innerDot, { backgroundColor: colors.text }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.48,
  },
});
