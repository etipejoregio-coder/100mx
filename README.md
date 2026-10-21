# 🎤 100 Mexicanos Dijeron

Juego de concurso estilo *100 Mexicanos Dijeron* (Family Feud) para jugar en pantalla grande o proyector, con pulsadores por teclado, marquesina, comandos de voz y **todo editable**.

**Funciona en:** Windows 10 (32 y 64 bits) y Windows 11 (64 bits).
> Windows 7/8 no están soportados por las versiones actuales de Electron.

## ¿Cómo se juega?

1. Se encuestó a 100 personas. Las respuestas más mencionadas valen más puntos.
2. Juegan **dos equipos** (hasta 5 jugadores cada uno).
3. **Cara a cara:** un jugador de cada equipo presiona su pulsador. El primero en presionar da su respuesta. Si dice la respuesta #1, su equipo gana el control de inmediato; si no, el anfitrión decide quién tiene el control (`←` azul / `→` rojo) según quién dio la respuesta más alta.
4. El equipo con el control debe adivinar las respuestas restantes, una por jugador. Cada acierto se suma al **banco**.
5. Con **3 errores (X)** el equipo pierde el control.
6. **Robo:** el otro equipo tiene una sola oportunidad. Si acierta una respuesta del tablero, se lleva todo el banco; si falla, el banco es para el equipo que tenía el control.
7. Si un equipo descubre todas las respuestas, se lleva el banco.
8. Multiplicadores (configurables): rondas 1-3 valen ×1, la ronda 4 ×2 y de la 5 en adelante ×3.
9. Gana el primer equipo en llegar a **300 puntos** (configurable).

> La ronda final "Dinero rápido" no está incluida en esta versión.

## Teclas por defecto (todas configurables en Menú → 2)

| Acción | Tecla |
|---|---|
| Comenzar | `Enter` o clic |
| Menú | `Esc` |
| Pulsadores equipo azul | `A S D F G` |
| Pulsadores equipo rojo | `H J K L ;` |
| Revelar respuestas 1–5 | `1` … `5` (también teclado numérico) |
| Error (X) | `X` |
| Control al azul / rojo | `←` / `→` |
| Dar banco al azul / rojo | `Z` / `C` |
| Siguiente / anterior pregunta | `N` / `B` |
| Reiniciar pulsadores | `R` |
| Mostrar todas | `V` |
| Mostrar/ocultar pregunta | `Q` |
| Pantalla completa | `F11` |
| Voz on/off | `M` |

## Tu diseño

El skin por defecto usa tus imágenes originales en `src/skins/clasico/` (`titulo.jpg`, `marquesina.jpg` y `x.png`, la X naranja). Para cambiarlas, reemplaza esos archivos o crea un skin propio en Menú → 1. La marquesina tiene **5 renglones**, así que cada pregunta admite máximo 5 respuestas.

## Menú de configuración

1. **Skins visualización:** elige un skin o crea el tuyo (colores, imagen de fondo, logo y marquesina propios).
2. **Configurar teclado:** teclas de cada acción, jugadores y pulsadores, reglas, contadores, pantalla completa, voz.
3. **Sonidos:** cambia cualquier sonido por tu MP3.
4. **Editar las preguntas:** preguntas, respuestas, puntos, nombre del juego y todos los textos. Importa/exporta JSON.
5. **Cerrar menú**
6. **Apagar PC** (pide confirmación; apaga en 10 s. Cancelar: `shutdown /a` en CMD).

## Comandos de voz

Activa con `M` o desde el menú 2. Ejemplos (editables): "respuesta tres", "error", "siguiente pregunta", "control azul", "puntos al rojo", "reiniciar pulsadores", "mostrar todas", "pantalla completa".

⚠️ **Importante:** el reconocimiento de voz usa el servicio de voz de Chromium (necesita internet). Dentro de la app instalada (Electron) puede mostrar el error `network`. Si te pasa, usa la **versión web** en Chrome o Edge (la voz sí funciona ahí):

```bash
npx serve src
```
y abre `http://localhost:3000`. En la versión web los datos se guardan en el navegador.

## Ejecutar en modo desarrollo

Necesitas [Node.js 18+](https://nodejs.org).

```bash
npm install
npm start
```

## Crear el instalador de Windows

En Windows:

```bash
npm run dist
```

El instalador queda en `dist/` (un solo `.exe` que sirve para Windows 32 y 64 bits). También puedes compilar solo una arquitectura: `npm run dist:x64` o `npm run dist:ia32`.

Para ponerle tu propio ícono, crea `build/icon.ico` (256×256).

### Compilar automáticamente en GitHub

El archivo `.github/workflows/build.yml` compila el instalador en la nube:

- **A mano:** pestaña *Actions* → *Compilar instaladores de Windows* → *Run workflow*. Descarga el `.exe` en *Artifacts*.
- **Con versión:** crea una etiqueta y se publica en *Releases*:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

## Datos

Tu configuración, preguntas y archivos se guardan en `%APPDATA%\100 Mexicanos Dijeron` y se conservan al actualizar la app.

## Licencia

MIT
