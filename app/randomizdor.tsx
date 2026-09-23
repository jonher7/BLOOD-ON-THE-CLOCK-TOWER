import { grimorioImages } from "@/constants/grimorio_imagenes";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

type GrimorioItem = {
  name: string;
  source: any;
  tipo: 'aldeano' | 'forastero' | 'esbirro' | 'diablillo';
};

const TIPO_COLORS: Record<string, string> = {
  aldeano: '#2E7D32',
  forastero: '#1565C0',
  esbirro: '#C62828',
  diablillo: '#6A1B9A',
};

const TIPO_ICONS: Record<string, string> = {
  aldeano: '👼',
  forastero: '🧳',
  esbirro: '🗡️',
  diablillo: '😈',
};

const NOMBRE_BORRACHO = 'Borracho';

type Fase = 'espera' | 'revelando' | 'ocultando';

export default function RandomizdorScreen() {
  const params = useLocalSearchParams();
  const playerCount = Number(params.playerCount) || 5;
  // Rol de aldeano que el Borracho verá en su carta (string vacío si no hay Borracho)
  const rolFalsoBorracho = (params.rolFalsoBorracho as string) || '';

  const rolesSeleccionados: string[] = useMemo(() => {
    try { return JSON.parse(params.rolesSeleccionados as string) || []; }
    catch { return []; }
  }, []);

  // Mezcla aleatoria de roles (una sola vez)
  const rolesOrden = useMemo(() => {
    const copia = [...rolesSeleccionados];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }, []);

  const [jugadorActual, setJugadorActual] = useState<number>(0);
  const [fase, setFase] = useState<Fase>('espera');
  // asignaciones guarda el rol REAL (lo que el master verá en partida.tsx)
  const [asignaciones, setAsignaciones] = useState<Record<number, string>>({});

  // El rol real que toca a este jugador
  const rolRealNombre = rolesOrden[jugadorActual];
  const esBorracho = rolRealNombre === NOMBRE_BORRACHO;

  // El rol que el jugador verá:
  // si es el Borracho → ve el rol falso de aldeano
  // si no → ve su rol real
  const rolQueVe: GrimorioItem | undefined = useMemo(() => {
    const nombreAMostrar = esBorracho && rolFalsoBorracho ? rolFalsoBorracho : rolRealNombre;
    return grimorioImages.find(i => i.name === nombreAMostrar);
  }, [jugadorActual, rolesOrden, esBorracho, rolFalsoBorracho]);

  // Colores basados en el rol que VE (para el Borracho, colores de aldeano)
  const colorTipo = rolQueVe ? TIPO_COLORS[rolQueVe.tipo] : '#555';
  const iconTipo  = rolQueVe ? TIPO_ICONS[rolQueVe.tipo]  : '❓';

  const handleVerRol = () => {
    setAsignaciones(prev => ({ ...prev, [jugadorActual]: rolRealNombre }));
    setFase('revelando');
  };

  const handleOcultar = () => setFase('ocultando');

  const handleSiguiente = () => {
    if (jugadorActual + 1 >= playerCount) {
      router.push({
        pathname: "/partida",
        params: {
          playerCount,
          asignaciones: JSON.stringify({ ...asignaciones, [jugadorActual]: rolRealNombre }),
          rolFalsoBorracho,
        }
      });
    } else {
      setJugadorActual(prev => prev + 1);
      setFase('espera');
    }
  };

  const esFinal = jugadorActual + 1 >= playerCount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎲 REPARTO DE ROLES</Text>
        <Text style={styles.headerSubtitle}>
          Jugador {jugadorActual + 1} de {playerCount}
        </Text>
        <View style={styles.progreso}>
          {Array.from({ length: playerCount }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progresoPoint,
                i < jugadorActual && styles.progresoPointDone,
                i === jugadorActual && styles.progresoPointActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.contenido}>

        {/* ESPERA */}
        {fase === 'espera' && (
          <View style={styles.pantallaCentrada}>
            <Text style={styles.privacidadIcono}>🔒</Text>
            <Text style={styles.privacidadTitulo}>
              Pasa el dispositivo al{'\n'}Jugador {jugadorActual + 1}
            </Text>
            <Text style={styles.privacidadSubtitulo}>
              Asegúrate de que nadie más mire la pantalla
            </Text>
            <Pressable style={styles.botonVer} onPress={handleVerRol}>
              <Text style={styles.botonVerTexto}>👁️ VER MI ROL</Text>
            </Pressable>
          </View>
        )}

        {/* REVELANDO */}
        {fase === 'revelando' && rolQueVe && (
          <View style={styles.pantallaCentrada}>
            <View style={[styles.rolCard, { borderColor: colorTipo, shadowColor: colorTipo }]}>
              <View style={[styles.rolHeader, { backgroundColor: colorTipo }]}>
                <Text style={styles.rolTipoTexto}>
                  {iconTipo} {rolQueVe.tipo.toUpperCase()}
                </Text>
              </View>
              <View style={styles.rolImagen}>
                <Image source={rolQueVe.source} style={styles.imagen} />
              </View>
              <Text style={styles.rolNombre}>{rolQueVe.name}</Text>
            </View>

            <Text style={styles.recuerda}>
              📌 Recuerda bien tu rol y no lo muestres a nadie
            </Text>

            <Pressable style={styles.botonOcultar} onPress={handleOcultar}>
              <Text style={styles.botonOcultarTexto}>🙈 YA LO VI, OCULTAR</Text>
            </Pressable>
          </View>
        )}

        {/* OCULTANDO */}
        {fase === 'ocultando' && (
          <View style={styles.pantallaCentrada}>
            <Text style={styles.privacidadIcono}>✅</Text>
            <Text style={styles.privacidadTitulo}>
              {esFinal ? '¡Todos tienen su rol!' : `Jugador ${jugadorActual + 1} listo`}
            </Text>
            <Text style={styles.privacidadSubtitulo}>
              {esFinal
                ? 'La partida puede comenzar'
                : `Pasa el dispositivo al Jugador ${jugadorActual + 2}`}
            </Text>
            <Pressable
              style={[styles.botonSiguiente, { backgroundColor: esFinal ? '#B71C1C' : '#1A3A1A' }]}
              onPress={handleSiguiente}
            >
              <Text style={styles.botonSiguienteTexto}>
                {esFinal ? '🎮 INICIAR PARTIDA' : `➡️ SIGUIENTE JUGADOR (${jugadorActual + 2})`}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  header: {
    backgroundColor: '#111',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#222',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#E0E0E0', fontFamily: 'serif', letterSpacing: 2, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#FFD700', fontFamily: 'serif', fontWeight: '600', marginBottom: 12 },
  progreso: { flexDirection: 'row', gap: 6 },
  progresoPoint: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333', borderWidth: 1, borderColor: '#555' },
  progresoPointDone: { backgroundColor: '#2E7D32', borderColor: '#4CAF50' },
  progresoPointActive: { backgroundColor: '#FFD700', borderColor: '#FFF700', transform: [{ scale: 1.3 }] },
  contenido: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pantallaCentrada: { width: '100%', alignItems: 'center', gap: 20 },
  privacidadIcono: { fontSize: 72, marginBottom: 8 },
  privacidadTitulo: {
    fontSize: 26, fontWeight: '900', color: '#E0E0E0', fontFamily: 'serif',
    textAlign: 'center', letterSpacing: 1, lineHeight: 34,
  },
  privacidadSubtitulo: { fontSize: 15, color: '#777', fontFamily: 'serif', textAlign: 'center', fontStyle: 'italic' },
  botonVer: {
    marginTop: 16, backgroundColor: '#1565C0',
    paddingVertical: 18, paddingHorizontal: 48, borderRadius: 16,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 12,
    borderWidth: 1, borderColor: '#42A5F5',
  },
  botonVerTexto: { color: '#FFF', fontSize: 18, fontWeight: '900', fontFamily: 'serif', letterSpacing: 1.5 },
  rolCard: {
    width: '90%', backgroundColor: '#111', borderRadius: 20, borderWidth: 3, overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 20,
  },
  rolHeader: { paddingVertical: 12, alignItems: 'center' },
  rolTipoTexto: { fontSize: 16, fontWeight: '900', color: '#FFF', fontFamily: 'serif', letterSpacing: 2 },
  rolImagen: { backgroundColor: '#0A0A0A', padding: 24, alignItems: 'center' },
  imagen: { width: 200, height: 200, resizeMode: 'contain' },
  rolNombre: {
    fontSize: 24, fontWeight: '900', color: '#E0E0E0', fontFamily: 'serif',
    textAlign: 'center', letterSpacing: 1, paddingVertical: 16, paddingHorizontal: 12,
  },
  recuerda: { fontSize: 14, color: '#888', fontFamily: 'serif', textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
  botonOcultar: {
    backgroundColor: '#37474F', paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 16, borderWidth: 1, borderColor: '#546E7A',
  },
  botonOcultarTexto: { color: '#FFF', fontSize: 16, fontWeight: '700', fontFamily: 'serif', letterSpacing: 1 },
  botonSiguiente: {
    marginTop: 16, paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  botonSiguienteTexto: { color: '#FFF', fontSize: 17, fontWeight: '900', fontFamily: 'serif', letterSpacing: 1 },
});
