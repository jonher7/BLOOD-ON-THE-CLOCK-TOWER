import { grimorioImages } from "@/constants/grimorio_imagenes";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

type GrimorioItem = {
  name: string;
  source: any;
  tipo: 'aldeano' | 'forastero' | 'esbirro' | 'diablillo';
};

type TipoColor = {
  [key: string]: { bg: string; border: string; text: string; header: string };
};

const TIPO_COLORS: TipoColor = {
  aldeano:   { bg: '#1A2E1A', border: '#2E7D32', text: '#81C784', header: '#2E7D32' },
  forastero: { bg: '#1A1E2E', border: '#1565C0', text: '#64B5F6', header: '#1565C0' },
  esbirro:   { bg: '#2E1A1A', border: '#C62828', text: '#EF9A9A', header: '#C62828' },
  diablillo: { bg: '#2A1A2E', border: '#6A1B9A', text: '#CE93D8', header: '#6A1B9A' },
};

const TIPO_ICONS: Record<string, string> = {
  aldeano: '👼',
  forastero: '🧳',
  esbirro: '🗡️',
  diablillo: '😈',
};

const NOMBRE_BARON    = 'Baron';
const NOMBRE_BORRACHO = 'Borracho';

export default function EleccionScreen() {
  const params = useLocalSearchParams();
  const playerCount = Number(params.playerCount) || 5;

  const necesariosBase = {
    aldeano:   Number(params.aldeanos)   || 3,
    forastero: Number(params.forasteros) || 0,
    esbirro:   Number(params.esbirros)   || 1,
    diablillo: Number(params.diablillos) || 1,
  };

  const [selected, setSelected] = useState<string[]>([]);
  // rolFalsoBorracho es un aldeano EXTRA del grimorio, no asignado a ningún jugador
  const [rolFalsoBorracho, setRolFalsoBorracho] = useState<string | null>(null);
  const [modalBorrachoVisible, setModalBorrachoVisible] = useState(false);

  const baronSeleccionado   = selected.includes(NOMBRE_BARON);
  const borrachoSeleccionado = selected.includes(NOMBRE_BORRACHO);

  // ── Cuotas ajustadas por Barón y Borracho ──
  // El Borracho suma +1 aldeano porque hay que elegir un aldeano EXTRA para su carta
  const necesarios = useMemo(() => ({
    ...necesariosBase,
    aldeano:(baronSeleccionado ? necesariosBase.aldeano - 2 : necesariosBase.aldeano)+ (borrachoSeleccionado ? 0 : 0),
    forastero: baronSeleccionado ? necesariosBase.forastero + 2 : necesariosBase.forastero,
  }), [baronSeleccionado, borrachoSeleccionado]);

  const groupedData = useMemo(() => {
    const grupos: Record<string, GrimorioItem[]> = {
      aldeano: [], forastero: [], esbirro: [], diablillo: [],
    };
    grimorioImages.forEach(item => {
      if (grupos[item.tipo]) grupos[item.tipo].push(item);
    });
    return Object.entries(grupos)
      .filter(([_, items]) => items.length > 0)
      .map(([tipo, items]) => ({ tipo, items }));
  }, []);

  // Conteo de lo que hay en el mazo (selected)
  const conteoActual = useMemo(() => {
    const c: Record<string, number> = { aldeano: 0, forastero: 0, esbirro: 0, diablillo: 0 };
    selected.forEach(name => {
      const item = grimorioImages.find(i => i.name === name);
      if (item) c[item.tipo]++;
    });
    return c;
  }, [selected]);

  // Aldeanos del grimorio que NO están en el mazo (ni como rol falso del Borracho)
  // → estos son los candidatos para la carta falsa del Borracho
  const aldeanosDisponiblesParaBorracho = useMemo(() =>
    grimorioImages.filter(
      i => i.tipo === 'aldeano'
        && !selected.includes(i.name)
        && i.name !== NOMBRE_BORRACHO
    ),
    [selected]
  );

  // Al quitar el Barón, elimina los forasteros que sobren
  const handleDeseleccionarBaron = (prev: string[]) => {
    const sinBaron = prev.filter(n => n !== NOMBRE_BARON);
    const maxForasteros = necesariosBase.forastero;
    const forasterosSel = sinBaron.filter(n =>
      grimorioImages.find(i => i.name === n)?.tipo === 'forastero'
    );
    if (forasterosSel.length > maxForasteros) {
      const aQuitar = new Set(forasterosSel.slice(maxForasteros));
      return sinBaron.filter(n => !aQuitar.has(n));
    }
    return sinBaron;
  };

  // Al quitar el Borracho, si había aldeanos de más (el extra), quita el último aldeano seleccionado
  const handleDeseleccionarBorracho = (prev: string[]) => {
    const sinBorracho = prev.filter(n => n !== NOMBRE_BORRACHO);
    // ¿Hay un aldeano de más respecto a lo que se necesitaría sin Borracho?
    const maxAldeanosSinBorracho = baronSeleccionado
      ? necesariosBase.aldeano - 2
      : necesariosBase.aldeano;
    const aldeanosSel = sinBorracho.filter(n =>
      grimorioImages.find(i => i.name === n)?.tipo === 'aldeano'
    );
    if (aldeanosSel.length > maxAldeanosSinBorracho) {
      // Quitar el último aldeano seleccionado
      const aQuitar = aldeanosSel[aldeanosSel.length - 1];
      return sinBorracho.filter(n => n !== aQuitar);
    }
    return sinBorracho;
  };

  const toggleSelect = (item: GrimorioItem) => {
    const isSelected = selected.includes(item.name);

    // ── DESELECCIONAR ──
    if (isSelected) {
      if (item.name === NOMBRE_BARON) {
        Alert.alert(
          '⚠️ Quitar el Barón',
          'Se restaura la distribución original. Los forasteros extra serán deseleccionados.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Quitar', style: 'destructive', onPress: () => setSelected(prev => handleDeseleccionarBaron(prev)) },
          ]
        );
        return;
      }
      if (item.name === NOMBRE_BORRACHO) {
        Alert.alert(
          '⚠️ Quitar el Borracho',
          'Se eliminará su rol falso y el aldeano extra del mazo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Quitar', style: 'destructive',
              onPress: () => {
                setRolFalsoBorracho(null);
                setSelected(prev => handleDeseleccionarBorracho(prev));
              },
            },
          ]
        );
        return;
      }
      setSelected(prev => prev.filter(n => n !== item.name));
      return;
    }

    // ── SELECCIONAR: comprobar límite ──
    const actualTipo = conteoActual[item.tipo];
    const maxTipo    = necesarios[item.tipo as keyof typeof necesarios];

    if (actualTipo >= maxTipo) {
      if (item.tipo === 'forastero' && maxTipo === 0 && !baronSeleccionado) {
        Alert.alert(
          'Sin plazas de forastero',
          'Con esta configuración no hay forasteros. Selecciona al Barón primero para añadir 2 plazas.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Límite alcanzado',
          `Ya tienes ${maxTipo} ${item.tipo}${maxTipo !== 1 ? 's' : ''}. No puedes añadir más.`,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    // Aviso al seleccionar el Barón
    if (item.name === NOMBRE_BARON) {
      Alert.alert(
        '🗡️ Barón seleccionado',
        'El Barón cambia el alineamiento: se eliminan 2 plazas de aldeano y se añaden 2 de forastero.',
        [{ text: 'Entendido' }]
      );
      setSelected(prev => [...prev, item.name]);
      return;
    }

    // Al seleccionar el Borracho → añadir y abrir modal para elegir el aldeano extra
    if (item.name === NOMBRE_BORRACHO) {
      setSelected(prev => [...prev, item.name]);
      setTimeout(() => setModalBorrachoVisible(true), 80);
      return;
    }

    setSelected(prev => [...prev, item.name]);
  };

  const validarSeleccion = () => {
    const errores: string[] = [];
    Object.entries(necesarios).forEach(([tipo, cant]) => {
      if (cant > 0 && conteoActual[tipo] !== cant) {
        errores.push(`${TIPO_ICONS[tipo]} ${tipo}: necesitas ${cant}, tienes ${conteoActual[tipo]}`);
      }
    });
    if (borrachoSeleccionado && !rolFalsoBorracho) {
      errores.push('🍺 El Borracho necesita un rol falso de aldeano asignado');
    }
    return errores;
  };

  // El total del mazo es playerCount siempre (el aldeano extra del Borracho va EN selected)
  const isCompleto = validarSeleccion().length === 0 && selected.length === playerCount + (borrachoSeleccionado ? 1 : 0);

  const handleContinuar = () => {
    const errores = validarSeleccion();
    if (errores.length > 0) {
      Alert.alert('Selección incompleta', errores.join('\n'), [{ text: 'Entendido' }]);
      return;
    }
    // Pasamos selected SIN el rolFalsoBorracho (que no va al mazo de jugadores)
    const rolesParaJugadores = selected.filter(n => n !== rolFalsoBorracho);
    router.push({
      pathname: "/randomizdor",
      params: {
        playerCount,
        rolesSeleccionados: JSON.stringify(rolesParaJugadores),
        rolFalsoBorracho: rolFalsoBorracho ?? '',
      }
    });
  };

  // Texto del botón: si hay Borracho, el mazo tiene playerCount+1 cartas pero solo playerCount jugadores
  const totalEnMazo   = selected.length;
  const totalEsperado = playerCount + (borrachoSeleccionado ? 0 : 0);
  const faltanEnMazo  = totalEsperado - totalEnMazo;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Grimorio</Text>
        <Text style={styles.subtitle}>Selecciona los roles para la partida</Text>
      </View>

      {/* Banner de mecánicas activas */}
      {(baronSeleccionado || borrachoSeleccionado) && (
        <View style={styles.mecanicasBanner}>
          {baronSeleccionado && (
            <View style={styles.mecanicaChip}>
              <Text style={styles.mecanicaTexto}>🗡️ Barón: -2👼 +2🧳</Text>
            </View>
          )}
          {borrachoSeleccionado && (
            <Pressable
              style={[styles.mecanicaChip, { borderColor: '#1565C0' }]}
              onPress={() => setModalBorrachoVisible(true)}
            >
              <Text style={styles.mecanicaTexto}>
                🍺 Carta falsa: {rolFalsoBorracho ? `"${rolFalsoBorracho}"` : '⚠️ toca para asignar'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Barra de progreso por tipo */}
      <View style={styles.progresoBarra}>
        {Object.entries(necesarios).map(([tipo, cant]) => {
          if (cant === 0) return null;
          const actual = conteoActual[tipo];
          const ok = actual === cant;
          const col = TIPO_COLORS[tipo];
          return (
            <View key={tipo} style={[styles.progresoItem, { borderColor: ok ? col.border : '#555' }]}>
              <Text style={styles.progresoIcon}>{TIPO_ICONS[tipo]}</Text>
              <Text style={[styles.progresoTexto, { color: ok ? col.text : '#999' }]}>
                {actual}/{cant}
                {tipo === 'aldeano' && borrachoSeleccionado && (
                  <Text style={{ color: '#64B5F6' }}> (+1🍺)</Text>
                )}
              </Text>
            </View>
          );
        })}
        <View style={styles.progresoTotal}>
          <Text style={[styles.progresoTotalTexto, { color: isCompleto ? '#FFD700' : '#999' }]}>
            {totalEnMazo}/{totalEsperado}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {groupedData.map((section) => {
          const col = TIPO_COLORS[section.tipo];
          const max = necesarios[section.tipo as keyof typeof necesarios];
          const actual = conteoActual[section.tipo];
          return (
            <View key={section.tipo} style={[styles.section, { borderColor: col.border }]}>
              <View style={[styles.sectionHeader, { backgroundColor: col.header }]}>
                <Text style={styles.sectionTitle}>
                  {TIPO_ICONS[section.tipo]} {section.tipo.charAt(0).toUpperCase() + section.tipo.slice(1)}
                </Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {actual}/{max} necesarios
                    {section.tipo === 'aldeano' && borrachoSeleccionado ? ' (incl. carta 🍺)' : ''}
                  </Text>
                </View>
              </View>

              <View style={[styles.gridContainer, { backgroundColor: col.bg }]}>
                {section.items.map((item) => {
                  const isSelected = selected.includes(item.name);
                  const esRolFalso = item.name === rolFalsoBorracho;

                  return (
                    <Pressable
                      key={item.name}
                      onPress={() => toggleSelect(item)}
                      style={[
                        styles.card,
                        { borderColor: isSelected ? col.border : '#333' },
                        isSelected && { backgroundColor: col.bg, shadowColor: col.border },
                        isSelected && styles.cardSelected,
                        esRolFalso && styles.cardRolFalso,
                      ]}
                    >
                      <View style={styles.imageContainer}>
                        <Image source={item.source} style={styles.image} />
                        {isSelected && !esRolFalso && (
                          <View style={[styles.checkOverlay, { backgroundColor: col.border }]}>
                            <Text style={styles.checkText}>✓</Text>
                          </View>
                        )}
                        {esRolFalso && (
                          <View style={styles.rolFalsoBadge}>
                            <Text style={styles.rolFalsoBadgeText}>🍺</Text>
                          </View>
                        )}
                        {item.name === NOMBRE_BARON && isSelected && (
                          <View style={styles.specialBadge}>
                            <Text style={styles.specialBadgeText}>-2👼 +2🧳</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.label, { color: isSelected ? col.text : '#CCC' }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {esRolFalso && (
                        <Text style={styles.borrachoSubLabel}>carta falsa del Borracho</Text>
                      )}
                      {item.name === NOMBRE_BORRACHO && isSelected && !rolFalsoBorracho && (
                        <Text style={styles.borrachoWarning}>⚠️ sin carta asignada</Text>
                      )}
                      {item.name === NOMBRE_BORRACHO && isSelected && rolFalsoBorracho && (
                        <Text style={styles.borrachoSubLabel}>{`"${rolFalsoBorracho}"`}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.continueButton, !isCompleto && styles.continueButtonDisabled]}
          onPress={handleContinuar}
        >
          <Text style={styles.continueText}>
            {isCompleto
              ? '🎲 CONTINUAR → REPARTIR ROLES'
              : faltanEnMazo > 0
                ? `Selecciona ${faltanEnMazo} más`
                : 'Completa la selección'}
          </Text>
        </Pressable>
      </View>

      {/* ── Modal: aldeano extra (carta falsa del Borracho) ── */}
      <Modal
        visible={modalBorrachoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalBorrachoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>🍺 Carta falsa del Borracho</Text>
            <Text style={styles.modalSubtitulo}>
              Elige un rol de aldeano que NO esté en el mazo. El Borracho creerá que es ese aldeano — nadie más tendrá ese rol.
            </Text>

            {aldeanosDisponiblesParaBorracho.length === 0 ? (
              <View style={styles.modalVacio}>
                <Text style={styles.modalVacioTexto}>
                  No hay aldeanos disponibles. Ya están todos en el mazo. Quita algún aldeano para dejar uno libre para el Borracho.
                </Text>
                <Pressable
                  style={styles.modalBotonCerrar}
                  onPress={() => {
                    if (!rolFalsoBorracho) setSelected(prev => prev.filter(n => n !== NOMBRE_BORRACHO));
                    setModalBorrachoVisible(false);
                  }}
                >
                  <Text style={styles.modalBotonTexto}>Cerrar</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.modalElige}>
                  Aldeanos disponibles (no están en el mazo):
                </Text>
                <ScrollView style={styles.modalLista} showsVerticalScrollIndicator={false}>
                  {aldeanosDisponiblesParaBorracho.map((item) => (
                    <Pressable
                      key={item.name}
                      style={[styles.modalItem, rolFalsoBorracho === item.name && styles.modalItemSeleccionado]}
                      onPress={() => setRolFalsoBorracho(item.name)}
                    >
                      <Image source={item.source} style={styles.modalItemImagen} />
                      <View style={styles.modalItemTextos}>
                        <Text style={[styles.modalItemNombre, rolFalsoBorracho === item.name && { color: '#81C784' }]}>
                          {item.name}
                        </Text>
                        <Text style={styles.modalItemSub}>No está en el mazo</Text>
                      </View>
                      {rolFalsoBorracho === item.name && <Text style={styles.modalItemCheck}>✓</Text>}
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.modalBotones}>
                  <Pressable
                    style={styles.modalBotonCancelar}
                    onPress={() => {
                      if (!rolFalsoBorracho) setSelected(prev => prev.filter(n => n !== NOMBRE_BORRACHO));
                      setModalBorrachoVisible(false);
                    }}
                  >
                    <Text style={styles.modalBotonCancelarTexto}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBotonConfirmar, !rolFalsoBorracho && styles.modalBotonDisabled]}
                    disabled={!rolFalsoBorracho}
                    onPress={() => setModalBorrachoVisible(false)}
                  >
                    <Text style={styles.modalBotonTexto}>
                      {rolFalsoBorracho ? '✓ Confirmar' : 'Elige un rol'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    backgroundColor: '#1A1A1A',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20,
    borderBottomWidth: 2, borderBottomColor: '#333',
  },
  title: { fontSize: 28, fontWeight: '900', color: '#E0E0E0', fontFamily: 'serif', letterSpacing: 2 },
  subtitle: { fontSize: 13, color: '#9E9E9E', fontFamily: 'serif', letterSpacing: 1, marginTop: 2 },

  mecanicasBanner: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#0F0F0F', borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
  },
  mecanicaChip: {
    borderWidth: 1, borderColor: '#C62828', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#1A0A0A',
  },
  mecanicaTexto: { color: '#EF9A9A', fontSize: 13, fontWeight: '700', fontFamily: 'serif' },

  progresoBarra: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#333',
  },
  progresoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  progresoIcon: { fontSize: 14 },
  progresoTexto: { fontSize: 13, fontWeight: '700', fontFamily: 'serif' },
  progresoTotal: { marginLeft: 'auto' },
  progresoTotalTexto: { fontSize: 18, fontWeight: '900', fontFamily: 'serif' },

  scrollView: { flex: 1 },
  section: { margin: 12, borderRadius: 12, borderWidth: 2, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', fontFamily: 'serif' },
  sectionBadge: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sectionBadgeText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8 },
  card: {
    width: '30%', backgroundColor: '#1E1E1E', borderRadius: 10, borderWidth: 2,
    borderColor: '#333', overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  cardSelected: { shadowOpacity: 0.8, shadowRadius: 10, elevation: 10, transform: [{ scale: 1.04 }] },
  // El aldeano que hace de carta falsa del Borracho: borde azul punteado
  cardRolFalso: {
    borderColor: '#1565C0',
    shadowColor: '#1565C0', shadowOpacity: 0.7, shadowRadius: 10, elevation: 10,
  },
  imageContainer: { width: '100%', height: 90, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  image: { width: '90%', height: '90%', resizeMode: 'contain' },
  checkOverlay: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
  },
  checkText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  rolFalsoBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center',
  },
  rolFalsoBadgeText: { fontSize: 12 },
  specialBadge: {
    position: 'absolute', bottom: 2, left: 2,
    backgroundColor: 'rgba(198,40,40,0.9)', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2,
  },
  specialBadgeText: { fontSize: 9, color: '#FFF', fontWeight: '700' },
  label: {
    fontSize: 11, textAlign: 'center', fontWeight: '600', fontFamily: 'serif',
    paddingHorizontal: 4, paddingTop: 6, paddingBottom: 2, minHeight: 28,
  },
  borrachoSubLabel: { fontSize: 9, textAlign: 'center', color: '#64B5F6', fontFamily: 'serif', paddingHorizontal: 4, paddingBottom: 4 },
  borrachoWarning: { fontSize: 9, textAlign: 'center', color: '#EF5350', fontFamily: 'serif', paddingBottom: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1A1A1A', padding: 16, borderTopWidth: 2, borderTopColor: '#333',
  },
  continueButton: {
    backgroundColor: '#B71C1C', paddingVertical: 18, borderRadius: 12, alignItems: 'center',
    shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 8,
    borderWidth: 1, borderColor: '#FF6B6B',
  },
  continueButtonDisabled: { backgroundColor: '#333', borderColor: '#555', shadowOpacity: 0.1 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700', fontFamily: 'serif', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 2, borderColor: '#1565C0', padding: 24, maxHeight: '80%',
  },
  modalTitulo: { fontSize: 24, fontWeight: '900', color: '#64B5F6', fontFamily: 'serif', textAlign: 'center', marginBottom: 8 },
  modalSubtitulo: {
    fontSize: 13, color: '#888', fontFamily: 'serif', textAlign: 'center',
    lineHeight: 20, marginBottom: 20, fontStyle: 'italic',
  },
  modalElige: { fontSize: 14, color: '#9E9E9E', fontFamily: 'serif', fontWeight: '600', marginBottom: 10 },
  modalLista: { maxHeight: 300 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 6,
    backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333',
  },
  modalItemSeleccionado: { borderColor: '#2E7D32', backgroundColor: '#0D1F0D' },
  modalItemImagen: { width: 44, height: 44, resizeMode: 'contain' },
  modalItemTextos: { flex: 1 },
  modalItemNombre: { fontSize: 15, color: '#CCC', fontFamily: 'serif', fontWeight: '600' },
  modalItemSub: { fontSize: 11, color: '#555', fontFamily: 'serif', marginTop: 2 },
  modalItemCheck: { fontSize: 18, color: '#81C784', fontWeight: '900' },
  modalVacio: { alignItems: 'center', gap: 16, paddingVertical: 20 },
  modalVacioTexto: { fontSize: 14, color: '#888', fontFamily: 'serif', textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  modalBotones: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBotonCancelar: { flex: 1, backgroundColor: '#333', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalBotonCancelarTexto: { color: '#CCC', fontSize: 15, fontWeight: '700', fontFamily: 'serif' },
  modalBotonConfirmar: {
    flex: 1, backgroundColor: '#1565C0', paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.6, shadowRadius: 6, elevation: 6,
  },
  modalBotonDisabled: { backgroundColor: '#333' },
  modalBotonCerrar: { backgroundColor: '#1565C0', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, alignItems: 'center' },
  modalBotonTexto: { color: '#FFF', fontSize: 15, fontWeight: '700', fontFamily: 'serif' },
});
