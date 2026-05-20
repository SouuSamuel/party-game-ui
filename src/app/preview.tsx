import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { PartyButton } from '../components/PartyButton';
import { colors, gradients, useAppTheme } from '../styles/theme';

export default function PreviewScreen() {
  const theme = useAppTheme();

  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.background}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>EM BREVE</Text>
          <Text style={styles.title}>Próxima etapa</Text>
          <Text style={styles.text}>Esta tela fica reservada para novas experiências do Hangout.</Text>
          <PartyButton title="Voltar para o início" emoji="⌂" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1, padding: 22 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  eyebrow: { color: colors.cyan, fontWeight: '900' },
  title: { color: colors.text, fontSize: 36, fontWeight: '900', textAlign: 'center' },
  text: { color: colors.mutedStrong, fontSize: 17, lineHeight: 24, textAlign: 'center', marginBottom: 14 },
});
