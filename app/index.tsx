import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function InicioScreen() {
  const [playerCount, setPlayerCount] = useState<number>(5);
  const [customCount, setCustomCount] = useState<string>("");
  const [aldeanos_cant, setaldeanos_cant] = useState<number>(3);
  const [forasteros_cant, setforasteros_cant] = useState<number>(0);
  const [esbirros_cant, setesbirros_cant] = useState<number>(1);
  const [diablillo_cant, setdiablillos_cant] = useState<number>(1);

  const commonCounts = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const getRolesForCount = (count: number) => {
    const tabla: Record<number, [number, number, number, number]> = {
      5:  [3, 0, 1, 1],
      6:  [3, 1, 1, 1],
      7:  [5, 0, 1, 1],
      8:  [5, 1, 1, 1],
      9:  [5, 2, 1, 1],
      10: [7, 0, 2, 1],
      11: [7, 1, 2, 1],
      12: [7, 2, 2, 1],
      13: [9, 0, 3, 1],
      14: [9, 1, 3, 1],
      15: [9, 2, 3, 1],
    };
    return tabla[count] ?? [Math.floor(count * 0.6), 0, Math.floor(count * 0.2), 1];
  };

  const applyRoles = (count: number) => {
    const [al, fo, es, di] = getRolesForCount(count);
    setaldeanos_cant(al);
    setforasteros_cant(fo);
    setesbirros_cant(es);
    setdiablillos_cant(di);
  };

  const handlePlayerCountSelect = (count: number) => {
    setPlayerCount(count);
    applyRoles(count);
    setCustomCount("");
  };

  const handleCustomCount = () => {
    const num = parseInt(customCount);
    if (num > 4 && num <= 20) {
      setPlayerCount(num);
      applyRoles(num);
      Alert.alert("✅ CONFIRMADO", `Se configuraron ${num} jugadores`, [{ text: "CONTINUAR" }]);
    } else {
      Alert.alert("❌ VALOR INVÁLIDO", "Ingresa un número entre 5 y 20", [{ text: "ENTENDIDO" }]);
      setCustomCount("");
    }
  };

  const handleStartGame = () => {
    if (playerCount >= 5) {
      router.push({
        pathname: "/eleccion",
        params: {
          playerCount,
          aldeanos: aldeanos_cant,
          forasteros: forasteros_cant,
          esbirros: esbirros_cant,
          diablillos: diablillo_cant,
        }
      });
    } else {
      Alert.alert("❌ JUGADORES INSUFICIENTES", "Se requieren al menos 5 jugadores", [{ text: "ENTENDIDO" }]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ BLOOD ON THE CLOCKTOWER</Text>
        <Text style={styles.subtitle}>Prepara tu partida</Text>
        <View style={styles.headerDivider} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mainSection}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>👥 CONFIGURACIÓN DE JUGADORES</Text>
            <View style={styles.sectionDivider} />

            <View style={styles.currentCountContainer}>
              <Text style={styles.currentCountLabel}>JUGADORES ACTUALES</Text>
              <View style={styles.currentCountDisplay}>
                <Text style={styles.currentCountNumber}>{playerCount}</Text>
                <Text style={styles.currentCountText}>JUGADORES</Text>
              </View>
            </View>

            <Text style={styles.optionsTitle}>OPCIONES RÁPIDAS</Text>
            <View style={styles.quickOptionsGrid}>
              {commonCounts.map((count) => (
                <Pressable
                  key={count}
                  onPress={() => handlePlayerCountSelect(count)}
                  style={[styles.quickOption, playerCount === count && styles.quickOptionSelected]}
                >
                  <Text style={[styles.quickOptionText, playerCount === count && styles.quickOptionTextSelected]}>
                    {count}
                  </Text>
                  {playerCount === count && <View style={styles.selectedIndicator} />}
                </Pressable>
              ))}
            </View>

            <Text style={styles.customTitle}>PERSONALIZADO (5-20)</Text>
            <View style={styles.customContainer}>
              <TextInput
                style={styles.customInput}
                value={customCount}
                onChangeText={setCustomCount}
                placeholder="Número"
                placeholderTextColor="#9E9E9E"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Pressable
                style={[
                  styles.customButton,
                  (!customCount || parseInt(customCount) < 5 || parseInt(customCount) > 20) && styles.customButtonDisabled
                ]}
                onPress={handleCustomCount}
                disabled={!customCount || parseInt(customCount) < 5 || parseInt(customCount) > 20}
              >
                <Text style={styles.customButtonText}>CONFIRMAR</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📊 DISTRIBUCIÓN DE ROLES</Text>
            <View style={styles.rolesDistribution}>
              {[
                { label: 'Aldeanos', count: aldeanos_cant, color: '#2E7D32' },
                { label: 'Forasteros', count: forasteros_cant, color: '#1565C0' },
                { label: 'Esbirros', count: esbirros_cant, color: '#C62828' },
                { label: 'Diablillos', count: diablillo_cant, color: '#6A1B9A' },
              ].map(({ label, count, color }) => (
                <View key={label} style={styles.roleType}>
                  <View style={[styles.roleColor, { backgroundColor: color }]} />
                  <Text style={styles.roleText}>{label}: {count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Pressable
            style={[styles.startButton, playerCount < 5 && styles.startButtonDisabled]}
            onPress={handleStartGame}
            disabled={playerCount < 5}
          >
            <Text style={styles.startButtonIcon}>🎮</Text>
            <Text style={styles.startButtonText}>
              {playerCount < 5 ? 'MÍNIMO 5 JUGADORES' : `ELEGIR ROLES (${playerCount} jugadores)`}
            </Text>
          </Pressable>
        </View>
        <View style={styles.footerBar}>
          <View style={[styles.footerBarSegment, { backgroundColor: '#2E7D32' }]} />
          <View style={[styles.footerBarSegment, { backgroundColor: '#1565C0' }]} />
          <View style={[styles.footerBarSegment, { backgroundColor: '#C62828' }]} />
          <View style={[styles.footerBarSegment, { backgroundColor: '#6A1B9A' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    backgroundColor: '#1A1A1A',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E0E0E0',
    fontFamily: 'serif',
    letterSpacing: 2,
    textShadowColor: '#B71C1C',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    fontFamily: 'serif',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerDivider: { height: 3, backgroundColor: '#B71C1C', marginTop: 12 },
  scrollView: { flex: 1 },
  mainSection: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'serif',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionDivider: { height: 2, backgroundColor: '#B71C1C', marginBottom: 20 },
  currentCountContainer: { alignItems: 'center', marginBottom: 24 },
  currentCountLabel: { fontSize: 12, color: '#9E9E9E', fontFamily: 'serif', letterSpacing: 1, marginBottom: 8 },
  currentCountDisplay: { alignItems: 'center' },
  currentCountNumber: {
    fontSize: 72,
    color: '#FFD700',
    fontWeight: '900',
    fontFamily: 'serif',
    textShadowColor: 'rgba(255,215,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    lineHeight: 80,
  },
  currentCountText: { fontSize: 14, color: '#B0B0B0', fontFamily: 'serif', letterSpacing: 2 },
  optionsTitle: { fontSize: 14, fontWeight: '600', color: '#E0E0E0', fontFamily: 'serif', marginBottom: 12, textAlign: 'center' },
  quickOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 24 },
  quickOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#37474F',
    position: 'relative',
  },
  quickOptionSelected: { backgroundColor: '#2E7D32', borderColor: '#4CAF50', transform: [{ scale: 1.1 }] },
  quickOptionText: { fontSize: 20, fontWeight: '700', color: '#B0B0B0', fontFamily: 'serif' },
  quickOptionTextSelected: { color: '#FFFFFF' },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  customTitle: { fontSize: 14, fontWeight: '600', color: '#E0E0E0', fontFamily: 'serif', marginBottom: 10, textAlign: 'center' },
  customContainer: { flexDirection: 'row', gap: 12 },
  customInput: {
    flex: 1,
    backgroundColor: '#252525',
    borderWidth: 2,
    borderColor: '#37474F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  customButton: { backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, justifyContent: 'center', minWidth: 100 },
  customButtonDisabled: { backgroundColor: '#424242', opacity: 0.6 },
  customButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: 'serif', letterSpacing: 1, textAlign: 'center' },
  infoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'serif', letterSpacing: 1, textAlign: 'center', marginBottom: 16 },
  rolesDistribution: { gap: 10 },
  roleType: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  roleColor: { width: 14, height: 14, borderRadius: 7 },
  roleText: { fontSize: 15, color: '#E0E0E0', fontFamily: 'serif', fontWeight: '600', flex: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1A1A1A', borderTopWidth: 2, borderTopColor: '#333' },
  footerContent: { paddingHorizontal: 20, paddingVertical: 16 },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B71C1C',
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  startButtonDisabled: { backgroundColor: '#424242', borderColor: '#555', shadowOpacity: 0.3 },
  startButtonIcon: { fontSize: 20, marginRight: 10 },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'serif',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  footerBar: { flexDirection: 'row', height: 6 },
  footerBarSegment: { flex: 1 },
});
