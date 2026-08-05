import * as Haptics from 'expo-haptics';

export async function playCorrectFeedback() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptic feedback should never interrupt the round.
  }
}
