# ⚔️ Grimorio — Blood on the Clocktower Companion App

Aplicación móvil (Expo / React Native) que hace de **grimorio digital** para el narrador de partidas de *Blood on the Clocktower*. Configura la partida, reparte los roles, oculta la información de forma segura entre jugadores y controla el estado del pueblo durante la noche y el día, todo desde un único dispositivo.

Incluye actualmente los roles del **guion Trouble Brewing** (la primera expansión / guion base del juego).

> Proyecto personal, no oficial ni afiliado a The Pandemonium Institute, creadores de *Blood on the Clocktower*.

## ✨ Funcionalidades

- **Configuración de partida**: elige el número de jugadores (5–20) y la app calcula automáticamente la distribución de roles (aldeanos, forasteros, esbirros y diablillo) según las reglas oficiales.
- **Selección de roles**: elige manualmente qué personajes del guion entran en la partida, con ajuste automático de cuotas cuando se incluyen roles especiales como el **Barón** (añade forasteros) o el **Borracho** (requiere un rol falso de aldeano).
- **Reparto aleatorio y seguro**: cada jugador ve su rol de forma individual y oculta (pantalla de "pasar el dispositivo"), evitando que el resto de la mesa lo vea. El Borracho ve un rol de aldeano falso en vez del real.
- **Tablero de partida**: círculo de jugadores con sus tokens de rol, control de vivos/muertos, marcado de eliminaciones nocturnas, envenenamiento y anotación de la información recibida por roles de investigación (Bibliotecario, Investigador, Lavandera, Pitonisa, Monje...).

## 🃏 Roles incluidos (Trouble Brewing)

| Tipo | Roles |
|---|---|
| 👼 Aldeanos | Guardián, Exterminador, Soldado, Enterrador, Virgen, Lavandera, Chef, Empático, Pitonisa, Bibliotecario, Investigador, Alcalde, Monje |
| 🧳 Forasteros | Mayordomo, Borracho, Recluso, Santo |
| 🗡️ Esbirros | Envenenador, Mujer Escarlata, Espía, Barón |
| 😈 Diablillo | Diablillo |

## 🛠️ Stack técnico

- [Expo](https://expo.dev) 54 + [Expo Router](https://docs.expo.dev/router/introduction/) (navegación basada en ficheros)
- React 19 / React Native 0.81
- TypeScript
- React Native Reanimated / Gesture Handler

## 📂 Estructura del proyecto

```
app/
  index.tsx         # Pantalla inicial: número de jugadores y distribución de roles
  eleccion.tsx       # Selección de los roles que entran en el guion de la partida
  randomizdor.tsx     # Reparto aleatorio y revelado individual de roles
  partida.tsx         # Tablero de partida: estado de jugadores, muertes, info, veneno
constants/
  grimorio_imagenes.ts  # Catálogo de roles (nombre, tipo e imagen)
assets/images/grimorio/ # Ilustraciones de cada rol y de los estados (veneno, protección...)
```

## 🚀 Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Arranca el proyecto:

   ```bash
   npx expo start
   ```

3. Desde la salida del CLI, abre la app en:
   - un [build de desarrollo](https://docs.expo.dev/develop/development-builds/introduction/)
   - un emulador de [Android](https://docs.expo.dev/workflow/android-studio-emulator/)
   - un simulador de [iOS](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)
   - la versión web (`npx expo start --web`)

## 🗺️ Roadmap

- [ ] Añadir el resto de guiones oficiales (Bad Moon Rising, Sects & Violets)
- [ ] Soporte para viajeros y personajes de viaje
- [ ] Historial / log de la partida

## 📜 Licencia

*Blood on the Clocktower* es una obra de Steven Medway / The Pandemonium Institute. Este proyecto es una herramienta de fan hecha para uso personal y no reproduce las reglas ni los textos oficiales del juego.
