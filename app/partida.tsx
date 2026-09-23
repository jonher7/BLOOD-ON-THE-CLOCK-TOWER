import { grimorioImages } from "@/constants/grimorio_imagenes";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type GrimorioItem = {
  name: string;
  source: any;
  tipo: 'aldeano' | 'forastero' | 'esbirro' | 'diablillo';
};

const TIPO_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  aldeano:   { border: '#2E7D32', text: '#81C784', bg: '#0D1F0D' },
  forastero: { border: '#1565C0', text: '#64B5F6', bg: '#0D1326' },
  esbirro:   { border: '#C62828', text: '#EF9A9A', bg: '#1F0D0D' },
  diablillo: { border: '#6A1B9A', text: '#CE93D8', bg: '#1A0D26' },
};

const TIPO_ICONS: Record<string, string> = {
  aldeano: '👼', forastero: '🧳', esbirro: '🗡️', diablillo: '😈',
};

const NOMBRE_BORRACHO      = 'Borracho';
const NOMBRE_ENVENENADOR   = 'Envenenador';
const NOMBRE_BIBLIOTECARIO = 'Bibliotecario';
const NOMBRE_PITONISA      = 'Pitonisa';
const NOMBRE_INVESTIGADOR  = 'Investigador';
const NOMBRE_LAVANDERA     = 'Lavandera';
const NOMBRE_MONJE         = 'Monje';

const IMG_ENVENENADO    = require('@/assets/images/grimorio/envenenando.png');
const IMG_BIBLIOTECARIO = require('@/assets/images/grimorio/bibliotecario_info.png');
const IMG_PITONISA      = require('@/assets/images/grimorio/pitonisa_info.png');
const IMG_INVESTIGADOR  = require('@/assets/images/grimorio/investigador_info.png');
const IMG_LAVANDERA     = require('@/assets/images/grimorio/lavandera_info.png');
const IMG_PROTECCION    = require('@/assets/images/grimorio/proteccion.png');

// Cada rol de info tiene: null | 'correcto' | 'incorrecto'
// La pitonisa tiene: null | 'marcado'
type MarcaInfo = null | 'correcto' | 'incorrecto' | 'marcado';

type EstadoJugador = {
  rolReal: string;
  rolMostrado: string;
  nombre: string;
  vivo: boolean;
  marcado: boolean;          // marcado para morir esta noche
  envenenado: boolean;
  infoBibliotecario: MarcaInfo;
  infoPitonisa: MarcaInfo;
  infoInvestigador: MarcaInfo;
  infoLavandera: MarcaInfo;
  infoMonje: MarcaInfo;
};

const { width: SW, height: SH } = Dimensions.get('window');

const CIRCLE_R    = Math.min(SW, SH) * 0.34;
const TOKEN_W     = 68;
const TOKEN_H     = TOKEN_W + 16;
const BADGE_MARGIN = 12;
const WRAPPER_SIZE = (CIRCLE_R + TOKEN_W / 2 + BADGE_MARGIN) * 2;

// ── Helpers de marca de info ──
// Para Biblio/Investigador/Lavandera: ciclo null → 'correcto' → 'incorrecto' → null
// Para Pitonisa: ciclo null → 'marcado' → null
function siguienteMarcaBiblioEstilo(actual: MarcaInfo): MarcaInfo {
  if (actual === null)        return 'correcto';
  if (actual === 'correcto')  return 'incorrecto';
  return null;
}
function siguienteMarcaPitonisa(actual: MarcaInfo): MarcaInfo {
  return actual === null ? 'marcado' : null;
}

export default function PartidaScreen() {
  const params = useLocalSearchParams();
  const playerCount      = Number(params.playerCount) || 5;
  const rolFalsoBorracho = (params.rolFalsoBorracho as string) || '';

  // Roles en juego (pasados desde eleccion/randomizdor)
  const rolesEnJuego: string[] = useMemo(() => {
    try { return JSON.parse(params.rolesEnJuego as string) || []; }
    catch { return []; }
  }, []);

  const asignacionesRaw: Record<number, string> = useMemo(() => {
    try { return JSON.parse(params.asignaciones as string) || {}; }
    catch { return {}; }
  }, []);

  const [jugadores, setJugadores] = useState<EstadoJugador[]>(() =>
    Array.from({ length: playerCount }).map((_, i) => {
      const rolReal    = asignacionesRaw[i] || '';
      const esBorracho = rolReal === NOMBRE_BORRACHO;
      return {
        rolReal,
        rolMostrado: esBorracho && rolFalsoBorracho ? rolFalsoBorracho : rolReal,
        nombre: `Jugador ${i + 1}`,
        vivo: true,
        marcado: false,
        envenenado: false,
        infoBibliotecario: null,
        infoPitonisa: null,
        infoInvestigador: null,
        infoLavandera: null,
        infoMonje: null,
      };
    })
  );

  const [turno, setTurno] = useState<'noche' | 'dia'>('dia');
  const [noche, setNoche] = useState<number>(1);

  // Modal de acciones
  const [jugadorSelIdx, setJugadorSelIdx]           = useState<number | null>(null);
  const [modalAccionesVisible, setModalAccionesVisible] = useState(false);

  // Modal edición de nombre
  const [modalNombreVisible, setModalNombreVisible] = useState(false);
  const [nombreTmp, setNombreTmp]                   = useState('');

  // Modal grimorio (mostrar roles)
  const [modalGrimorioVisible, setModalGrimorioVisible]     = useState(false);
  const [rolesSeleccionados, setRolesSeleccionados]         = useState<string[]>([]);
  const [mostrandoRoles, setMostrandoRoles]                 = useState<string[]>([]);
  const [pantallaRolesVisible, setPantallaRolesVisible]     = useState(false);

  const getRolInfo = (nombre: string): GrimorioItem | undefined =>
    grimorioImages.find(i => i.name === nombre);

  // ── Abrir modal de acciones ──
  const abrirAcciones = (idx: number) => {
    setJugadorSelIdx(idx);
    setModalAccionesVisible(true);
  };

  // ── Cambiar nombre ──
  const abrirNombre = () => {
    if (jugadorSelIdx === null) return;
    setNombreTmp(jugadores[jugadorSelIdx].nombre);
    setModalAccionesVisible(false);
    setTimeout(() => setModalNombreVisible(true), 200);
  };
  const guardarNombre = () => {
    if (jugadorSelIdx === null) return;
    const n = nombreTmp.trim();
    if (!n) return;
    setJugadores(prev => prev.map((j, i) => i === jugadorSelIdx ? { ...j, nombre: n } : j));
    setModalNombreVisible(false);
  };

  // ── Envenenar ──
  const toggleEnvenenado = () => {
    if (jugadorSelIdx === null) return;
    setJugadores(prev =>
      prev.map((j, i) => i === jugadorSelIdx ? { ...j, envenenado: !j.envenenado } : j)
    );
    setModalAccionesVisible(false);
  };

  // ── Info roles con límites ──
  // Biblio/Investigador/Lavandera: máx 1 correcto + 1 incorrecto por rol
  const toggleInfoConLimite = (
    campo: 'infoBibliotecario' | 'infoInvestigador' | 'infoLavandera'
  ) => {
    if (jugadorSelIdx === null) return;
    const jugador = jugadores[jugadorSelIdx];
    const actual  = jugador[campo];
    const siguiente = siguienteMarcaBiblioEstilo(actual);

    // Comprobamos límite antes de asignar
    if (siguiente !== null) {
      const yaHayDeTipo = jugadores.some(
        (j, i) => i !== jugadorSelIdx && j[campo] === siguiente
      );
      if (yaHayDeTipo) {
        Alert.alert(
          'Límite alcanzado',
          `Ya hay un jugador marcado como "${siguiente}" para este rol.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setJugadores(prev =>
      prev.map((j, i) => i === jugadorSelIdx ? { ...j, [campo]: siguiente } : j)
    );
    setModalAccionesVisible(false);
  };

  // Pitonisa: máx 1 marcado (puede moverse quitando el anterior)
  const togglePitonisa = () => {
    if (jugadorSelIdx === null) return;
    const jugador = jugadores[jugadorSelIdx];
    const siguiente = siguienteMarcaPitonisa(jugador.infoPitonisa);
    if (siguiente === 'marcado') {
      setJugadores(prev =>
        prev.map((j, i) => ({ ...j, infoPitonisa: i === jugadorSelIdx ? 'marcado' : null }))
      );
    } else {
      setJugadores(prev =>
        prev.map((j, i) => i === jugadorSelIdx ? { ...j, infoPitonisa: null } : j)
      );
    }
    setModalAccionesVisible(false);
  };

  // Monje: igual que Pitonisa, máx 1 protegido (puede moverse)
  const toggleMonje = () => {
    if (jugadorSelIdx === null) return;
    const jugador = jugadores[jugadorSelIdx];
    const siguiente = siguienteMarcaPitonisa(jugador.infoMonje);
    if (siguiente === 'marcado') {
      setJugadores(prev =>
        prev.map((j, i) => ({ ...j, infoMonje: i === jugadorSelIdx ? 'marcado' : null }))
      );
    } else {
      setJugadores(prev =>
        prev.map((j, i) => i === jugadorSelIdx ? { ...j, infoMonje: null } : j)
      );
    }
    setModalAccionesVisible(false);
  };

  // ── Marcar para morir (noche) ──
  const toggleMarcado = () => {
    if (jugadorSelIdx === null) return;
    setJugadores(prev =>
      prev.map((j, i) => i === jugadorSelIdx ? { ...j, marcado: !j.marcado } : j)
    );
    setModalAccionesVisible(false);
  };

  // ── Matar / revivir ──
  const toggleVivo = () => {
    if (jugadorSelIdx === null) return;
    setJugadores(prev =>
      prev.map((j, i) => i === jugadorSelIdx ? { ...j, vivo: !j.vivo, marcado: false } : j)
    );
    setModalAccionesVisible(false);
  };

  // ── Noche / amanecer ──
  const comenzarNoche = () => {
    setTurno('noche');
    setJugadores(prev => prev.map(j => ({ ...j, marcado: false })));
  };

  const ejecutarNoche = () => {
    const marcados   = jugadores.filter(j => j.marcado);
    if (marcados.length === 0) {
      Alert.alert('Sin muertes', 'Nadie fue marcado esta noche.', [{ text: 'OK' }]);
      setNoche(n => n + 1);
      setTurno('dia');
      return;
    }

    // Separar protegidos por el Monje de los que sí mueren
    const protegidos = marcados.filter(j => j.infoMonje === 'marcado');
    const mueren     = marcados.filter(j => j.infoMonje !== 'marcado');

    const msgMuertos    = mueren.length > 0
      ? `💀 Mueren: ${mueren.map(j => j.nombre).join(', ')}`
      : null;
    const msgProtegidos = protegidos.length > 0
      ? `🛡️ Protegidos por el Monje: ${protegidos.map(j => j.nombre).join(', ')}`
      : null;
    const mensaje = [msgMuertos, msgProtegidos].filter(Boolean).join('\n\n');

    Alert.alert('🌙 Amanecer', mensaje, [
      {
        text: mueren.length > 0 ? 'Confirmar muertes' : 'Continuar',
        style: mueren.length > 0 ? 'destructive' : 'default',
        onPress: () => {
          setJugadores(prev => prev.map(j => {
            if (!j.marcado) return j;
            if (j.infoMonje === 'marcado') return { ...j, marcado: false }; // protegido: solo quita la marca
            return { ...j, vivo: false, marcado: false };
          }));
          setNoche(n => n + 1);
          setTurno('dia');
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const terminarPartida = () => {
    const vivos = jugadores.filter(j => j.vivo);
    const hayDiablo = vivos.some(j => getRolInfo(j.rolReal)?.tipo === 'diablillo');
    Alert.alert(
      '🏆 FIN DE PARTIDA',
      hayDiablo ? '😈 ¡El Diablillo gana!' : '👼 ¡El pueblo gana!',
      [
        { text: 'Nueva partida', onPress: () => router.replace('/') },
        { text: 'Ver resultado' },
      ]
    );
  };

  // ── Modal Grimorio ──
  // Usa los roles del grimorio de la partida; si no vienen por params, usa todos
  const todosLosRoles: GrimorioItem[] = useMemo(() => {
    if (rolesEnJuego.length > 0) {
      return rolesEnJuego
        .map(name => grimorioImages.find(i => i.name === name))
        .filter(Boolean) as GrimorioItem[];
    }
    return grimorioImages;
  }, [rolesEnJuego]);

  const toggleSelGrimorio = (nombre: string) => {
    setRolesSeleccionados(prev =>
      prev.includes(nombre) ? prev.filter(n => n !== nombre) : [...prev, nombre]
    );
  };

  const mostrarRolesSeleccionados = () => {
    if (rolesSeleccionados.length === 0) return;
    setMostrandoRoles(rolesSeleccionados);
    setModalGrimorioVisible(false);
    setTimeout(() => setPantallaRolesVisible(true), 250);
  };

  // ── Posiciones en círculo ──
  const posiciones = useMemo(() => {
    const centro = WRAPPER_SIZE / 2;
    return Array.from({ length: playerCount }).map((_, i) => {
      const angle = (2 * Math.PI * i) / playerCount - Math.PI / 2;
      return {
        left: centro + CIRCLE_R * Math.cos(angle) - TOKEN_W / 2,
        top:  centro + CIRCLE_R * Math.sin(angle) - TOKEN_H / 2,
      };
    });
  }, [playerCount]);

  const vivos   = jugadores.filter(j => j.vivo).length;
  const muertos = jugadores.length - vivos;

  const hayEnvenenador   = jugadores.some(j => j.rolReal === NOMBRE_ENVENENADOR);
  const hayBibliotecario = jugadores.some(j => j.rolReal === NOMBRE_BIBLIOTECARIO);
  const hayPitonisa      = jugadores.some(j => j.rolReal === NOMBRE_PITONISA);
  const hayInvestigador  = jugadores.some(j => j.rolReal === NOMBRE_INVESTIGADOR);
  const hayLavandera     = jugadores.some(j => j.rolReal === NOMBRE_LAVANDERA);
  const hayMonje         = jugadores.some(j => j.rolReal === NOMBRE_MONJE);

  const jugadorSel = jugadorSelIdx !== null ? jugadores[jugadorSelIdx] : null;
  const rolInfoSel = jugadorSel ? getRolInfo(jugadorSel.rolReal) : null;
  const colSel     = rolInfoSel ? TIPO_COLORS[rolInfoSel.tipo] : { border: '#555', text: '#999', bg: '#111' };

  // Helper: renderiza el badge de una marca de info en el token
  const renderBadgeInfo = (
    marca: MarcaInfo,
    img: any,
    style: object
  ) => {
    if (!marca) return null;
    const color = marca === 'correcto' ? '#2E7D32' : marca === 'incorrecto' ? '#C62828' : '#1565C0';
    return (
      <View style={[styles.badgeInfoWrap, { borderColor: color }, style]}>
        <Image source={img} style={styles.badgeInfoImg} />
        {marca !== 'marcado' && (
          <View style={[styles.badgeInfoDot, { backgroundColor: color }]} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🕐 PARTIDA EN CURSO</Text>
            <Text style={styles.headerSub}>
              {turno === 'dia' ? `☀️ Día ${noche}` : `🌙 Noche ${noche}`}
            </Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.statVivo}>👥 {vivos} vivos</Text>
            <Text style={styles.statMuerto}>💀 {muertos} muertos</Text>
          </View>
        </View>

        <View style={styles.turnoRow}>
          {turno === 'dia' ? (
            <>
              <Pressable style={styles.botonNoche} onPress={comenzarNoche}>
                <Text style={styles.botonNocheTexto}>🌙 INICIAR NOCHE</Text>
              </Pressable>
              {/* Botón Grimorio */}
              <Pressable
                style={styles.botonGrimorio}
                onPress={() => { setRolesSeleccionados([]); setModalGrimorioVisible(true); }}
              >
                <Text style={styles.botonGrimorioTexto}>📖</Text>
              </Pressable>
              <Pressable style={styles.botonFin} onPress={terminarPartida}>
                <Text style={styles.botonFinTexto}>🏆</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.botonAmanecer} onPress={ejecutarNoche}>
                <Text style={styles.botonAmanecerTexto}>☀️ AMANECER — aplicar muertes</Text>
              </Pressable>
              <Pressable
                style={styles.botonGrimorio}
                onPress={() => { setRolesSeleccionados([]); setModalGrimorioVisible(true); }}
              >
                <Text style={styles.botonGrimorioTexto}>📖</Text>
              </Pressable>
            </>
          )}
        </View>
        {turno === 'noche' && (
          <Text style={styles.nocheHint}>Toca un jugador → márcalo para morir</Text>
        )}
      </View>

      {/* ── CÍRCULO DE JUGADORES ── */}
      <ScrollView contentContainerStyle={styles.circuloScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.circuloWrapper}>
          {/* Centro */}
          <View style={styles.circuloCentro}>
            <Text style={styles.circuloCentroTurno}>{turno === 'dia' ? '☀️' : '🌙'}</Text>
            <Text style={styles.circuloCentroDia}>{turno === 'dia' ? `Día ${noche}` : `Noche ${noche}`}</Text>
            <Text style={styles.circuloCentroVivos}>{vivos} vivos</Text>
          </View>

          {jugadores.map((jugador, idx) => {
            const pos        = posiciones[idx];
            const rolInfo    = getRolInfo(jugador.rolMostrado);
            const rolReal    = getRolInfo(jugador.rolReal);
            const col        = rolReal ? TIPO_COLORS[rolReal.tipo] : { border: '#555', text: '#999', bg: '#111' };
            const esBorracho = jugador.rolReal === NOMBRE_BORRACHO;

            const tieneInfo = jugador.infoBibliotecario || jugador.infoPitonisa ||
                              jugador.infoInvestigador  || jugador.infoLavandera ||
                              jugador.infoMonje;

            return (
              <Pressable
                key={idx}
                style={[
                  styles.token,
                  {
                    left: pos.left,
                    top:  pos.top,
                    borderColor: jugador.marcado ? '#AB47BC' : jugador.vivo ? col.border : '#333',
                  },
                  !jugador.vivo && styles.tokenMuerto,
                  jugador.marcado && styles.tokenMarcado,
                ]}
                onPress={() => abrirAcciones(idx)}
              >
                <Text style={styles.tokenNombre} numberOfLines={1}>{jugador.nombre}</Text>
                {rolInfo ? (
                  <Image source={rolInfo.source} style={[styles.tokenImagen, !jugador.vivo && { opacity: 0.25 }]} />
                ) : (
                  <Text style={{ fontSize: 22 }}>❓</Text>
                )}
                

                {/* Badge muerto */}
                {!jugador.vivo && (
                  <View style={styles.badgeMuerto}><Text style={styles.badgeTexto}>💀</Text></View>
                )}

                {/* Badge envenenado — esquina sup. derecha */}
                {jugador.envenenado && jugador.vivo && (
                  <View style={styles.badgeEnvenenado}>
                    <Image source={IMG_ENVENENADO} style={styles.badgeEnvImg} />
                  </View>
                )}

                {/* Badge marcado muerte */}
                {jugador.marcado && (
                  <View style={styles.badgeMarcado}><Text style={styles.badgeTexto}>🎯</Text></View>
                )}

                {/* Badge Borracho */}
                {esBorracho && jugador.vivo && (
                  <View style={styles.badgeBorracho}><Text style={{ fontSize: 8 }}>🍺</Text></View>
                )}

                {/* Badges de info — fila en la parte inferior del token */}
                {tieneInfo && jugador.vivo && (
                  <View style={styles.badgesInfoFila}>
                    {renderBadgeInfo(jugador.infoBibliotecario, IMG_BIBLIOTECARIO, {})}
                    {renderBadgeInfo(jugador.infoPitonisa,      IMG_PITONISA,      {})}
                    {renderBadgeInfo(jugador.infoInvestigador,  IMG_INVESTIGADOR,  {})}
                    {renderBadgeInfo(jugador.infoLavandera,     IMG_LAVANDERA,     {})}
                    {renderBadgeInfo(jugador.infoMonje,         IMG_PROTECCION,    {})}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── LISTA COMPACTA ── */}
        <View style={styles.listaContainer}>
          <Text style={styles.listaTitulo}>ORDEN DE ASIENTOS</Text>
          {jugadores.map((jugador, idx) => {
            const rolReal    = getRolInfo(jugador.rolReal);
            const esBorracho = jugador.rolReal === NOMBRE_BORRACHO;
            const col        = rolReal ? TIPO_COLORS[rolReal.tipo] : { border: '#555', text: '#999', bg: '#111' };
            return (
              <Pressable
                key={idx}
                style={[styles.listaItem, { borderLeftColor: jugador.vivo ? col.border : '#333' }, !jugador.vivo && { opacity: 0.45 }]}
                onPress={() => abrirAcciones(idx)}
              >
                <Text style={[styles.listaNum, { color: jugador.vivo ? col.border : '#444' }]}>{idx + 1}</Text>
                <View style={styles.listaInfo}>
                  <View style={styles.listaFila}>
                    <Text style={[styles.listaNombre, { color: jugador.vivo ? '#E0E0E0' : '#555' }]}>{jugador.nombre}</Text>
                    {jugador.envenenado && <Image source={IMG_ENVENENADO}   style={styles.listaIconoImg} />}
                    {jugador.infoBibliotecario && <Image source={IMG_BIBLIOTECARIO} style={[styles.listaIconoImg, jugador.infoBibliotecario === 'correcto' ? styles.listaIconoVerde : styles.listaIconoRojo]} />}
                    {jugador.infoPitonisa      && <Image source={IMG_PITONISA}      style={styles.listaIconoImg} />}
                    {jugador.infoInvestigador  && <Image source={IMG_INVESTIGADOR}  style={[styles.listaIconoImg, jugador.infoInvestigador === 'correcto' ? styles.listaIconoVerde : styles.listaIconoRojo]} />}
                    {jugador.infoLavandera     && <Image source={IMG_LAVANDERA}     style={[styles.listaIconoImg, jugador.infoLavandera === 'correcto' ? styles.listaIconoVerde : styles.listaIconoRojo]} />}
                    {jugador.infoMonje         && <Image source={IMG_PROTECCION}    style={styles.listaIconoImg} />}
                    {jugador.marcado   && <Text style={styles.listaIcono}>🎯</Text>}
                    {!jugador.vivo     && <Text style={styles.listaIcono}>💀</Text>}
                  </View>
                  {esBorracho ? (
                    <Text style={styles.listaRol}>🍺 Borracho · cree ser {jugador.rolMostrado}</Text>
                  ) : (
                    <Text style={[styles.listaRol, { color: jugador.vivo ? col.text : '#444' }]}>
                      {TIPO_ICONS[rolReal?.tipo ?? 'aldeano']} {jugador.rolReal || '—'}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════
          MODAL: Acciones sobre el jugador
      ══════════════════════════════════════════ */}
      <Modal visible={modalAccionesVisible} transparent animationType="slide" onRequestClose={() => setModalAccionesVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalAccionesVisible(false)}>
          <Pressable style={styles.modalContainer} onPress={e => e.stopPropagation()}>
            {jugadorSel && (
              <>
                <View style={[styles.modalHeader, { borderBottomColor: colSel.border }]}>
                  <View style={styles.modalHeaderLeft}>
                    {(() => {
                      const ri = getRolInfo(jugadorSel.rolMostrado);
                      return ri ? <Image source={ri.source} style={styles.modalImagen} /> : null;
                    })()}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalNombreJugador}>{jugadorSel.nombre}</Text>
                      <Text style={[styles.modalRol, { color: colSel.text }]}>
                        {jugadorSel.rolReal === NOMBRE_BORRACHO
                          ? `🍺 Borracho · cree ser "${jugadorSel.rolMostrado}"`
                          : `${TIPO_ICONS[rolInfoSel?.tipo ?? 'aldeano']} ${jugadorSel.rolReal}`}
                      </Text>
                      <View style={styles.modalBadges}>
                        {!jugadorSel.vivo && <Text style={styles.modalBadge}>💀 Muerto</Text>}
                        {jugadorSel.envenenado && (
                          <View style={styles.modalBadgeRow}>
                            <Image source={IMG_ENVENENADO} style={styles.modalBadgeImg} />
                            <Text style={[styles.modalBadge, { color: '#A5D6A7' }]}>Envenenado</Text>
                          </View>
                        )}
                        {jugadorSel.infoBibliotecario && (
                          <View style={styles.modalBadgeRow}>
                            <Image source={IMG_BIBLIOTECARIO} style={styles.modalBadgeImg} />
                            <Text style={[styles.modalBadge, { color: jugadorSel.infoBibliotecario === 'correcto' ? '#81C784' : '#EF9A9A' }]}>
                              Biblio. {jugadorSel.infoBibliotecario}
                            </Text>
                          </View>
                        )}
                        {jugadorSel.infoPitonisa && (
                          <View style={styles.modalBadgeRow}>
                            <Image source={IMG_PITONISA} style={styles.modalBadgeImg} />
                            <Text style={[styles.modalBadge, { color: '#CE93D8' }]}>Pitonisa</Text>
                          </View>
                        )}
                        {jugadorSel.infoInvestigador && (
                          <View style={styles.modalBadgeRow}>
                            <Image source={IMG_INVESTIGADOR} style={styles.modalBadgeImg} />
                            <Text style={[styles.modalBadge, { color: jugadorSel.infoInvestigador === 'correcto' ? '#81C784' : '#EF9A9A' }]}>
                              Invest. {jugadorSel.infoInvestigador}
                            </Text>
                          </View>
                        )}
                        {jugadorSel.infoLavandera && (
                          <View style={styles.modalBadgeRow}>
                            <Image source={IMG_LAVANDERA} style={styles.modalBadgeImg} />
                            <Text style={[styles.modalBadge, { color: jugadorSel.infoLavandera === 'correcto' ? '#81C784' : '#EF9A9A' }]}>
                              Lavand. {jugadorSel.infoLavandera}
                            </Text>
                          </View>
                        )}
                        {jugadorSel.infoMonje && (
                          <View style={styles.modalBadgeRow}>
                            <Image source={IMG_PROTECCION} style={styles.modalBadgeImg} />
                            <Text style={[styles.modalBadge, { color: '#FFD54F' }]}>Protegido</Text>
                          </View>
                        )}
                        {jugadorSel.marcado && <Text style={[styles.modalBadge, { color: '#CE93D8' }]}>🎯 Marcado</Text>}
                      </View>
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.accionesScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.accionesGrid}>

                    {/* Editar nombre */}
                    <Pressable style={styles.accionBtn} onPress={abrirNombre}>
                      <Text style={styles.accionIcono}>✏️</Text>
                      <Text style={styles.accionTexto}>Editar nombre</Text>
                    </Pressable>

                    {/* Envenenar */}
                    {hayEnvenenador && (
                      <Pressable
                        style={[styles.accionBtn, jugadorSel.envenenado && styles.accionActiva]}
                        onPress={toggleEnvenenado}
                        disabled={!jugadorSel.vivo}
                      >
                        <Image source={IMG_ENVENENADO} style={[styles.accionImg, !jugadorSel.vivo && { opacity: 0.3 }]} />
                        <Text style={[styles.accionTexto, jugadorSel.envenenado && { color: '#A5D6A7' }]}>
                          {jugadorSel.envenenado ? 'Quitar veneno' : 'Envenenar'}
                        </Text>
                      </Pressable>
                    )}

                    {/* Bibliotecario — ciclo null→correcto→incorrecto→null */}
                    {hayBibliotecario && jugadorSel.vivo && (
                      <Pressable
                        style={[
                          styles.accionBtn,
                          jugadorSel.infoBibliotecario === 'correcto'   && styles.accionCorrecto,
                          jugadorSel.infoBibliotecario === 'incorrecto' && styles.accionIncorrecto,
                        ]}
                        onPress={() => toggleInfoConLimite('infoBibliotecario')}
                      >
                        <Image source={IMG_BIBLIOTECARIO} style={styles.accionImg} />
                        <Text style={[
                          styles.accionTexto,
                          jugadorSel.infoBibliotecario === 'correcto'   && { color: '#81C784' },
                          jugadorSel.infoBibliotecario === 'incorrecto' && { color: '#EF9A9A' },
                        ]}>
                          Biblio.{jugadorSel.infoBibliotecario ? ` (${jugadorSel.infoBibliotecario})` : ''}
                        </Text>
                      </Pressable>
                    )}

                    {/* Pitonisa — solo 1 marcado, se puede mover */}
                    {hayPitonisa && jugadorSel.vivo && (
                      <Pressable
                        style={[styles.accionBtn, jugadorSel.infoPitonisa && styles.accionPitonisa]}
                        onPress={togglePitonisa}
                      >
                        <Image source={IMG_PITONISA} style={styles.accionImg} />
                        <Text style={[styles.accionTexto, jugadorSel.infoPitonisa && { color: '#CE93D8' }]}>
                          {jugadorSel.infoPitonisa ? 'Quitar Pitonisa' : 'Pitonisa'}
                        </Text>
                      </Pressable>
                    )}

                    {/* Investigador */}
                    {hayInvestigador && jugadorSel.vivo && (
                      <Pressable
                        style={[
                          styles.accionBtn,
                          jugadorSel.infoInvestigador === 'correcto'   && styles.accionCorrecto,
                          jugadorSel.infoInvestigador === 'incorrecto' && styles.accionIncorrecto,
                        ]}
                        onPress={() => toggleInfoConLimite('infoInvestigador')}
                      >
                        <Image source={IMG_INVESTIGADOR} style={styles.accionImg} />
                        <Text style={[
                          styles.accionTexto,
                          jugadorSel.infoInvestigador === 'correcto'   && { color: '#81C784' },
                          jugadorSel.infoInvestigador === 'incorrecto' && { color: '#EF9A9A' },
                        ]}>
                          Invest.{jugadorSel.infoInvestigador ? ` (${jugadorSel.infoInvestigador})` : ''}
                        </Text>
                      </Pressable>
                    )}

                    {/* Lavandera */}
                    {hayLavandera && jugadorSel.vivo && (
                      <Pressable
                        style={[
                          styles.accionBtn,
                          jugadorSel.infoLavandera === 'correcto'   && styles.accionCorrecto,
                          jugadorSel.infoLavandera === 'incorrecto' && styles.accionIncorrecto,
                        ]}
                        onPress={() => toggleInfoConLimite('infoLavandera')}
                      >
                        <Image source={IMG_LAVANDERA} style={styles.accionImg} />
                        <Text style={[
                          styles.accionTexto,
                          jugadorSel.infoLavandera === 'correcto'   && { color: '#81C784' },
                          jugadorSel.infoLavandera === 'incorrecto' && { color: '#EF9A9A' },
                        ]}>
                          Lavand.{jugadorSel.infoLavandera ? ` (${jugadorSel.infoLavandera})` : ''}
                        </Text>
                      </Pressable>
                    )}

                    {/* Monje — igual que Pitonisa, 1 protegido, puede moverse */}
                    {hayMonje && jugadorSel.vivo && (
                      <Pressable
                        style={[styles.accionBtn, jugadorSel.infoMonje && styles.accionMonje]}
                        onPress={toggleMonje}
                      >
                        <Image source={IMG_PROTECCION} style={styles.accionImg} />
                        <Text style={[styles.accionTexto, jugadorSel.infoMonje && { color: '#FFD54F' }]}>
                          {jugadorSel.infoMonje ? 'Quitar protección' : 'Proteger'}
                        </Text>
                      </Pressable>
                    )}

                    {/* Marcar muerte (solo noche) */}
                    {turno === 'noche' && jugadorSel.vivo && (
                      <Pressable
                        style={[styles.accionBtn, jugadorSel.marcado && styles.accionMarcadaActiva]}
                        onPress={toggleMarcado}
                      >
                        <Text style={styles.accionIcono}>{jugadorSel.marcado ? '✕' : '🎯'}</Text>
                        <Text style={[styles.accionTexto, jugadorSel.marcado && { color: '#CE93D8' }]}>
                          {jugadorSel.marcado ? 'Desmarcar' : 'Marcar muerte'}
                        </Text>
                      </Pressable>
                    )}

                    {/* Matar / Revivir */}
                    <Pressable
                      style={[styles.accionBtn, !jugadorSel.vivo && styles.accionRevivir]}
                      onPress={toggleVivo}
                    >
                      <Text style={styles.accionIcono}>{jugadorSel.vivo ? '💀' : '✨'}</Text>
                      <Text style={styles.accionTexto}>{jugadorSel.vivo ? 'Eliminar' : 'Revivir'}</Text>
                    </Pressable>

                  </View>
                </ScrollView>

                <Pressable style={styles.modalCerrar} onPress={() => setModalAccionesVisible(false)}>
                  <Text style={styles.modalCerrarTexto}>Cerrar</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: Editar nombre
      ══════════════════════════════════════════ */}
      <Modal visible={modalNombreVisible} transparent animationType="fade" onRequestClose={() => setModalNombreVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalNombreContainer}>
            <Text style={styles.modalNombreTitulo}>✏️ Editar nombre</Text>
            <TextInput
              style={styles.modalNombreInput}
              value={nombreTmp}
              onChangeText={setNombreTmp}
              placeholder="Nombre del jugador"
              placeholderTextColor="#555"
              autoFocus
              maxLength={20}
              onSubmitEditing={guardarNombre}
            />
            <View style={styles.modalBotonesRow}>
              <Pressable style={styles.modalBotonCancelar} onPress={() => setModalNombreVisible(false)}>
                <Text style={styles.modalBotonCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBotonConfirmar, !nombreTmp.trim() && { opacity: 0.4 }]}
                onPress={guardarNombre}
                disabled={!nombreTmp.trim()}
              >
                <Text style={styles.modalBotonConfirmarTexto}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: Grimorio — seleccionar roles
      ══════════════════════════════════════════ */}
      <Modal visible={modalGrimorioVisible} transparent animationType="slide" onRequestClose={() => setModalGrimorioVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalGrimorioVisible(false)}>
          <Pressable style={[styles.modalContainer, { maxHeight: '85%' }]} onPress={e => e.stopPropagation()}>
            <View style={styles.grimorioHeader}>
              <Text style={styles.grimorioTitulo}>📖 Grimorio</Text>
              <Text style={styles.grimorioSub}>Selecciona roles para mostrarlos en pantalla</Text>
            </View>

            <ScrollView style={styles.grimorioLista} showsVerticalScrollIndicator={false}>
              {(['aldeano', 'forastero', 'esbirro', 'diablillo'] as const).map(tipo => {
                const items = todosLosRoles.filter(r => r.tipo === tipo);
                if (items.length === 0) return null;
                const col = TIPO_COLORS[tipo];
                return (
                  <View key={tipo} style={styles.grimorioSeccion}>
                    <Text style={[styles.grimorioTipoHeader, { color: col.border }]}>
                      {TIPO_ICONS[tipo]} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}s
                    </Text>
                    <View style={styles.grimorioGrid}>
                      {items.map(item => {
                        const sel = rolesSeleccionados.includes(item.name);
                        return (
                          <Pressable
                            key={item.name}
                            style={[styles.grimorioCard, sel && { borderColor: col.border, backgroundColor: col.bg }]}
                            onPress={() => toggleSelGrimorio(item.name)}
                          >
                            <Image source={item.source} style={styles.grimorioCardImg} />
                            <Text style={[styles.grimorioCardNombre, sel && { color: col.text }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            {sel && <View style={[styles.grimorioCardCheck, { backgroundColor: col.border }]}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>✓</Text></View>}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalBotonesRow}>
              <Pressable style={styles.modalBotonCancelar} onPress={() => setModalGrimorioVisible(false)}>
                <Text style={styles.modalBotonCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBotonConfirmar, rolesSeleccionados.length === 0 && { opacity: 0.4 }]}
                disabled={rolesSeleccionados.length === 0}
                onPress={mostrarRolesSeleccionados}
              >
                <Text style={styles.modalBotonConfirmarTexto}>
                  Mostrar {rolesSeleccionados.length > 0 ? `(${rolesSeleccionados.length})` : ''}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════
          PANTALLA COMPLETA: Mostrar roles
      ══════════════════════════════════════════ */}
      <Modal visible={pantallaRolesVisible} transparent={false} animationType="fade" onRequestClose={() => setPantallaRolesVisible(false)}>
        <View style={styles.pantallaRoles}>
          <Text style={styles.pantallaRolesTitulo}>Roles</Text>
          <ScrollView contentContainerStyle={styles.pantallaRolesGrid} showsVerticalScrollIndicator={false}>
            {mostrandoRoles.map(nombre => {
              const info = getRolInfo(nombre);
              if (!info) return null;
              const col = TIPO_COLORS[info.tipo];
              return (
                <View key={nombre} style={[styles.pantallaRolCard, { borderColor: col.border }]}>
                  <Image source={info.source} style={styles.pantallaRolImg} />
                  <Text style={[styles.pantallaRolNombre, { color: col.text }]}>{info.name}</Text>
                  <Text style={styles.pantallaRolTipo}>{TIPO_ICONS[info.tipo]} {info.tipo}</Text>
                </View>
              );
            })}
          </ScrollView>
          <Pressable style={styles.pantallaRolesVolver} onPress={() => setPantallaRolesVisible(false)}>
            <Text style={styles.pantallaRolesVolverTexto}>← Volver a la partida</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },

  // ── Header ──
  header: {
    backgroundColor: '#111', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: '#222',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#E0E0E0', fontFamily: 'serif', letterSpacing: 1 },
  headerSub: { fontSize: 15, color: '#FFD700', fontFamily: 'serif', fontWeight: '700', marginTop: 2 },
  headerStats: { alignItems: 'flex-end', gap: 3 },
  statVivo:   { fontSize: 13, color: '#4CAF50', fontWeight: '700', fontFamily: 'serif' },
  statMuerto: { fontSize: 13, color: '#EF5350', fontWeight: '700', fontFamily: 'serif' },
  turnoRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  botonNoche: {
    flex: 1, backgroundColor: '#1A237E', paddingVertical: 11, borderRadius: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#3949AB',
  },
  botonNocheTexto: { color: '#FFF', fontSize: 13, fontWeight: '700', fontFamily: 'serif' },
  botonGrimorio: {
    backgroundColor: '#2A1A00', paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#7B5000',
  },
  botonGrimorioTexto: { fontSize: 18 },
  botonFin: {
    backgroundColor: '#4A1010', paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#B71C1C',
  },
  botonFinTexto: { fontSize: 18 },
  botonAmanecer: {
    flex: 1, backgroundColor: '#4A1B6A', paddingVertical: 11, borderRadius: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#7B1FA2',
  },
  botonAmanecerTexto: { color: '#FFF', fontSize: 13, fontWeight: '700', fontFamily: 'serif' },
  nocheHint: { fontSize: 11, color: '#AB47BC', fontFamily: 'serif', textAlign: 'center', fontStyle: 'italic', marginTop: 3 },

  // ── Círculo ──
  circuloScroll: { alignItems: 'center', paddingTop: 16 },
  circuloWrapper: {
    width: WRAPPER_SIZE, height: WRAPPER_SIZE,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  circuloCentro: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  circuloCentroTurno: { fontSize: 36 },
  circuloCentroDia: { fontSize: 13, color: '#FFD700', fontFamily: 'serif', fontWeight: '700', marginTop: 2 },
  circuloCentroVivos: { fontSize: 12, color: '#9E9E9E', fontFamily: 'serif', marginTop: 2 },

  // ── Token ──
  token: {
    position: 'absolute', width: TOKEN_W, height: TOKEN_H,
    borderRadius: 12, borderWidth: 2, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center', overflow: 'visible',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 6, elevation: 6,
  },
  tokenMuerto: { backgroundColor: '#0D0D0D', borderColor: '#333' },
  tokenMarcado: { shadowColor: '#AB47BC', shadowOpacity: 0.9, shadowRadius: 12, elevation: 12 },
  tokenImagen: { width: TOKEN_W - 10, height: TOKEN_W - 22, resizeMode: 'contain' },
  tokenNombre: {
    fontSize: 9, color: '#CCC', fontFamily: 'serif', fontWeight: '700',
    textAlign: 'center', width: TOKEN_W - 4, marginTop: 2,
  },

  // ── Badges ──
  badgeMuerto: {
    position: 'absolute', top: -8, right: -8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  badgeEnvenenado: {
    position: 'absolute', top: -8, left: -8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#0D2010', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#2E7D32',
  },
  badgeEnvImg: { width: 18, height: 18, resizeMode: 'contain' },
  badgeMarcado: {
    position: 'absolute', bottom: 18, right: -8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#2A0D3A', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#7B1FA2',
  },
  badgeBorracho: {
    position: 'absolute', bottom: 18, left: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#0D1326', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1565C0',
  },
  badgeTexto: { fontSize: 11 },

  // Badges de info (fila inferior del token)
  badgesInfoFila: {
    position: 'absolute', bottom: -12,
    flexDirection: 'row', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8, paddingHorizontal: 4, paddingVertical: 3,
  },
  badgeInfoWrap: {
    width: 25, height: 25, borderRadius: 14,
    backgroundColor: '#111', borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeInfoImg: { width: 30, height: 30, resizeMode: 'contain' },
  badgeInfoDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: '#111',
  },

  // ── Lista compacta ──
  listaContainer: { width: '100%', paddingHorizontal: 16, marginTop: 8 },
  listaTitulo: { fontSize: 11, color: '#555', fontFamily: 'serif', fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginBottom: 10 },
  listaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111', borderRadius: 10, padding: 10, marginBottom: 6, borderLeftWidth: 3,
  },
  listaNum: { fontSize: 16, fontWeight: '900', fontFamily: 'serif', width: 20, textAlign: 'center' },
  listaInfo: { flex: 1 },
  listaFila: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  listaNombre: { fontSize: 14, fontWeight: '700', fontFamily: 'serif' },
  listaIcono: { fontSize: 13 },
  listaIconoImg: { width: 18, height: 18, resizeMode: 'contain' },
  listaIconoVerde: { tintColor: '#4CAF50' },
  listaIconoRojo:  { tintColor: '#EF5350' },
  listaRol: { fontSize: 11, color: '#777', fontFamily: 'serif', marginTop: 2 },

  // ── Modal base ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 2, borderColor: '#333', paddingBottom: 32, overflow: 'hidden',
  },
  modalHeader: { padding: 20, borderBottomWidth: 1, marginBottom: 4 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  modalImagen: { width: 56, height: 56, resizeMode: 'contain' },
  modalNombreJugador: { fontSize: 20, fontWeight: '900', color: '#E0E0E0', fontFamily: 'serif' },
  modalRol: { fontSize: 13, fontFamily: 'serif', marginTop: 2 },
  modalBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  modalBadge: { fontSize: 11, color: '#EF5350', fontFamily: 'serif', fontWeight: '700' },
  modalBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalBadgeImg: { width: 16, height: 16, resizeMode: 'contain' },

  // Grid de acciones
  accionesScroll: { maxHeight: 300 },
  accionesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  accionBtn: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#1E1E1E', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2A2A2A',
  },
  accionActiva:       { backgroundColor: '#0D2010', borderColor: '#2E7D32' },
  accionCorrecto:     { backgroundColor: '#0D2010', borderColor: '#2E7D32' },
  accionIncorrecto:   { backgroundColor: '#1F0D0D', borderColor: '#C62828' },
  accionPitonisa:     { backgroundColor: '#2A0D3A', borderColor: '#6A1B9A' },
  accionMonje:        { backgroundColor: '#1A1500', borderColor: '#FFD54F' },
  accionMarcadaActiva:{ backgroundColor: '#2A0D3A', borderColor: '#7B1FA2' },
  accionRevivir:      { backgroundColor: '#103A10', borderColor: '#2E7D32' },
  accionIcono: { fontSize: 26 },
  accionImg: { width: 36, height: 36, resizeMode: 'contain' },
  accionTexto: { fontSize: 12, color: '#CCC', fontFamily: 'serif', fontWeight: '700', textAlign: 'center' },

  modalCerrar: { marginHorizontal: 16, marginTop: 14, backgroundColor: '#222', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalCerrarTexto: { color: '#888', fontSize: 14, fontWeight: '700', fontFamily: 'serif' },

  // ── Modal nombre ──
  modalNombreContainer: { backgroundColor: '#141414', margin: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalNombreTitulo: { fontSize: 20, fontWeight: '900', color: '#E0E0E0', fontFamily: 'serif', textAlign: 'center', marginBottom: 16 },
  modalNombreInput: {
    backgroundColor: '#1E1E1E', borderWidth: 2, borderColor: '#37474F',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14,
    color: '#FFF', fontSize: 18, fontFamily: 'serif', textAlign: 'center', marginBottom: 16,
  },
  modalBotonesRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  modalBotonCancelar: { flex: 1, backgroundColor: '#2A2A2A', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalBotonCancelarTexto: { color: '#888', fontSize: 14, fontWeight: '700', fontFamily: 'serif' },
  modalBotonConfirmar: { flex: 1, backgroundColor: '#1565C0', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalBotonConfirmarTexto: { color: '#FFF', fontSize: 14, fontWeight: '700', fontFamily: 'serif' },

  // ── Modal grimorio ──
  grimorioHeader: { padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  grimorioTitulo: { fontSize: 22, fontWeight: '900', color: '#FFD700', fontFamily: 'serif', textAlign: 'center' },
  grimorioSub: { fontSize: 12, color: '#888', fontFamily: 'serif', textAlign: 'center', marginTop: 4, fontStyle: 'italic' },
  grimorioLista: { paddingHorizontal: 16 },
  grimorioSeccion: { marginTop: 16 },
  grimorioTipoHeader: { fontSize: 13, fontWeight: '900', fontFamily: 'serif', letterSpacing: 1, marginBottom: 8 },
  grimorioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grimorioCard: {
    width: '28%', backgroundColor: '#1E1E1E', borderRadius: 10, borderWidth: 2, borderColor: '#2A2A2A',
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, position: 'relative',
  },
  grimorioCardImg: { width: 48, height: 48, resizeMode: 'contain' },
  grimorioCardNombre: { fontSize: 9, color: '#AAA', fontFamily: 'serif', fontWeight: '700', textAlign: 'center', marginTop: 4 },
  grimorioCardCheck: {
    position: 'absolute', top: -6, right: -6,
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },

  // ── Pantalla roles ──
  pantallaRoles: { flex: 1, backgroundColor: '#080808', paddingTop: 60 },
  pantallaRolesTitulo: { fontSize: 28, fontWeight: '900', color: '#FFD700', fontFamily: 'serif', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  pantallaRolesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 20 },
  pantallaRolCard: {
    width: 130, backgroundColor: '#111', borderRadius: 16, borderWidth: 2,
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  pantallaRolImg: { width: 90, height: 90, resizeMode: 'contain', marginBottom: 10 },
  pantallaRolNombre: { fontSize: 15, fontWeight: '900', fontFamily: 'serif', textAlign: 'center' },
  pantallaRolTipo: { fontSize: 11, color: '#777', fontFamily: 'serif', marginTop: 4 },
  pantallaRolesVolver: {
    margin: 16, backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#333',
  },
  pantallaRolesVolverTexto: { color: '#CCC', fontSize: 15, fontWeight: '700', fontFamily: 'serif' },
});
