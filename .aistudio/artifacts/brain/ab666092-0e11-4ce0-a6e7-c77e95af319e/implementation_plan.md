# Entre la precisión y el riesgo — Sistema de Control para Prótesis Mioeléctrica

Plataforma multimedia interactiva y reproductor cinematográfico educativo que narra el rediseño del sistema de control para la prótesis mioeléctrica transradial de Martín (34 años, diseñador gráfico). Integra el diálogo entre Martín, la bioingeniera Sofía (25 años) y el kinesiólogo Gastón (42 años) con locución automatizada sincronizada vía Web Speech API, efectos dinámicos de zoom y subtitulado estilo karaoke, junto a un laboratorio interactivo de Sistemas de Control (Lugar Geométrico de las Raíces, sintonización PID, filtrado EMG y respuesta transitoria de la prótesis).

---

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> Confirmadas las 3 preferencias clave con el usuario:
> 1. **Voz y Audio**: Locución automática multivoz sincronizada mediante la Web Speech API del navegador, asignando timbres y tonos diferenciados para Martín (voz masculina joven/dinámica), Sofía (voz femenina clara/técnica) y Gastón (voz masculina madura/calma), con controles de volumen, velocidad y mute.
> 2. **Laboratorio de Control Integrado**: Módulo interactivo en vivo de Sistemas de Control donde se simula la planta real de la prótesis $G(s) = \frac{1}{(s+4)(s+6)(s+10)}$, el cálculo en tiempo real de los polos de lazo cerrado, trazado dinámico del LGR con límite crítico de estabilidad ($K_{crit} = 2240$), respuesta al escalón y prueba de perturbación con ruido EMG y derivada filtrada con anti-windup.
> 3. **Modo de Reproducción**: Reproductor cinematográfico con línea de tiempo interactiva, efecto Ken Burns / zoom focalizado sobre los gráficos de cada escena (la pantalla de la laptop y la pizarra), indicadores de interlocutor activo y subtítulos sincronizados en tiempo real.

---

## 1. Visión General y Concepto Central

- **Propósito**: Comunicar con rigor bioingenieril y calidez clínica la resolución del reclamo de Martín: una prótesis que presentaba lentitud de respuesta al intentar agarrar una taza o un mouse, y movimientos involuntarios bruscos por ruido muscular al viajar en colectivo (usar la tarjeta SUBE). 
- **Rol Bioingenieril**: El bioingeniero explica a Martín (paciente) y a Gastón (kinesiología) por qué subir la ganancia $K$ generó oscilaciones peligrosas al desplazar los polos hacia el semiplano derecho y amplificar el ruido EMG, cómo se fijaron los criterios clínicos de control ($t_s \le 2\text{ s}$, $MP \le 25\%$, $e_{ss} = 0$), y por qué se optó por un controlador PID con derivada filtrada y anti-windup antes de avanzar a la rehabilitación funcional.
- **Público Objetivo**: Docentes, estudiantes de Bioingeniería / Control de Sistemas, profesionales de la rehabilitación y público general interesado en prótesis mioeléctricas avanzadas.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujo de Navegación y Vistas
1. **Modo Reproductor de Video Cinematográfico**:
   - Escenario central con las 10 imágenes de alta resolución provistas por el usuario (`/public/assets/aistudio/*.png`).
   - Cámara dinámica: suave paneo y zoom (efecto Ken Burns) enfocado en los diagramas de la laptop de Sofía y la pizarra técnica durante las explicaciones de control.
   - Pista de diálogo en tiempo real: globo de diálogo destacado, subtítulos con tracking de lectura sincronizado con la voz del interlocutor activo.
   - Tarjetas de personajes con rol, edad y avatar de estado de habla (Martín, Sofía, Gastón).
   - Barra de transporte multimedia: Play/Pausa, anterior/siguiente escena, barra de progreso scrubbing, velocidad (0.75x, 1x, 1.25x, 1.5x), control de volumen y selector de voces.
2. **Laboratorio Interactivo de Control (Simulador LGR & PID)**:
   - **Planta de la prótesis**: $G(s) = \frac{1}{(s+4)(s+6)(s+10)} = \frac{1}{s^3 + 20s^2 + 124s + 240}$.
   - **Visualizador LGR interactivo**: Plano complejo $s$ interactivo con polos en lazo abierto en $-4, -6, -10$, asíntotas, punto de ruptura y ramas que cruzan el eje imaginario en $\pm j\sqrt{124}$ para $K = 2240$.
   - **Panel de sintonización**: Sliders interactivos para $K_p$, $T_i$, $T_d$, filtro derivativo $N$ y switch de protección anti-windup.
   - **Simulador de apertura/cierre de la mano y gráfico temporal**: Curva de posición angular / fuerza vs tiempo ante escalón de orden mioeléctrica $x(t)$, con inyección opcional de ruido EMG de alta frecuencia.
   - **Métricas de control en vivo**: Tiempo de subida ($t_r$), tiempo de establecimiento al 2% ($t_s$), sobreimpulso porcentual ($MP\%$) y error en régimen permanente ($e_{ss}$).
3. **Modo Guion & Glosario Técnico**:
   - Visor del guion completo de las 10 escenas con citas textuales y notas pedagógicas de control.
   - Ficha técnica clínica con la historia de Martín (accidente de tránsito, amputación transradial, diseñador gráfico).

### Estética y Dirección Visual (Frontend Design Constitution)
- **Gama Cromática**: Estilo clínico-tecnológico biomédico de alta gama.
  - Fondo primario: Pizarra clínica profunda `#0B1120` y `#0F172A` con acentos en azul cian bioingeniería `#0284C7` / `#38BDF8`, verde esmeralda de seguridad clínica `#10B981`, y ámbar de advertencia de oscilación `#F59E0B`.
- **Tipografía**: Títulos con tipografía moderna geométrica (`Plus Jakarta Sans`), cuerpo de lectura claro (`DM Sans`), y parámetros numéricos matemáticos con fuentes monoespaciadas tabulares (`font-mono tabular-nums`).
- **Disciplina Anti-Slop**:
  - Cero etiquetas píldora decorativas estáticas en el encabezado.
  - Visualización sin falsos porcentajes inventados; cálculo matemático real de polos y respuesta temporal mediante Runge-Kutta 4 (RK4) en el simulador.
  - Diseño con proporciones precisas para pantallas de escritorio y tablets.

---

## 3. Decisiones de Producto y Arquitectura Técnica

```
┌────────────────────────────────────────────────────────────────────────┐
│                   App.tsx - Interfaz Principal                         │
├────────────────────────────────┬───────────────────────────────────────┤
│    Barra Superior Clínica      │ Selector de Modos: Video / Laboratorio│
├────────────────────────────────┴───────────────────────────────────────┤
│                                                                        │
│  [ MODO VIDEO CINEMATOGRÁFICO ]        [ MODO LABORATORIO DE CONTROL ] │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────┐ │
│  │ Canvas / Stage de Escena        │   │ Gráfico LGR (Plano s)       │ │
│  │ - Imagen del storyboard         │   │ - Polos Lazo Abierto/Cerrado│ │
│  │ - Zoom Dinámico en Gráfico      │   │ - Trayectorias y estabilidad│ │
│  │ - Indicador de Interlocutor     │   ├─────────────────────────────┤ │
│  │ - Subtítulos karaoke sincroniz. │   │ Respuesta Temporal y EMG    │ │
│  ├─────────────────────────────────┤   │ - Orden de cierre vs Posición│ │
│  │ Controles de Reproducción:      │   │ - Ruido EMG + Anti-windup   │ │
│  │ Play/Pause | Seek | Speed | Vol │   ├─────────────────────────────┤ │
│  │ Lista de 10 Escenas con Thumb   │   │ Controles PID & Planta:     │ │
│  └─────────────────────────────────┘   │ Kp, Ti, Td, N, Amortiguam. │ │
│                                        └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Motor de Audio y Locución (Web Speech API)
- Detección automática de voces disponibles en español (`es-AR`, `es-ES`, `es-419`, `es-US`).
- Síntesis diferenciada:
  - **Martín** (paciente, 34 años): Pitch ligeramente más bajo, velocidad normal/expresiva (tono preocupado al inicio, aliviado al final).
  - **Sofía** (bioingeniera, 25 años): Pitch medio/femenino, cadencia pedagógica y precisa.
  - **Gastón** (kinesiólogo, 42 años): Pitch maduro, ritmo pausado y contenedor.
- En caso de que el navegador no tenga sintetizador activado o el usuario silencie, el reproductor avanza suavemente con temporizador de lectura sincronizado por palabras clave.

### Motor Matemático de Control (Simulador Fidedigno)
- **Función de transferencia de la mano robótica**:
  $$G(s) = \frac{1}{(s+4)(s+6)(s+10)} = \frac{1}{s^3 + 20s^2 + 124s + 240}$$
- **Polinomio característico en lazo cerrado con control Proporcional ($K$)**:
  $$1 + K \cdot G(s) = 0 \implies s^3 + 20s^2 + 124s + (240 + K) = 0$$
- **Criterio de Routh-Hurwitz**:
  - Fila $s^2$: $20$, $240 + K$
  - Fila $s^1$: $\frac{20 \cdot 124 - (240 + K)}{20} = \frac{2480 - 240 - K}{20} = \frac{2240 - K}{20}$
  - Por ende, el límite crítico de estabilidad es exactamente **$K_{crit} = 2240$**, tal como expone Sofía en el guion.
- **Controlador PID con Derivada Filtrada**:
  $$G_c(s) = K_p \left( 1 + \frac{1}{T_i s} + \frac{T_d s}{1 + \frac{T_d}{N} s} \right)$$
- Integración temporal con paso de simulación $\Delta t = 0.01\text{ s}$ usando RK4 o espacio de estados canónico para visualizar overshoot, settling time y oscilaciones por ruido mioeléctrico.

---

## 4. Estructura de Componentes a Desarrollar

- `src/types/narrative.ts`: Estructuras de datos para las 10 escenas, diálogos, intervenciones por personaje, tiempos sugeridos y metadatos técnicos.
- `src/types/control.ts`: Definición de parámetros de planta, controlador PID, variables de estado y métricas de desempeño ($t_s, MP\%, e_{ss}$).
- `src/data/storyboardData.ts`: Contenido íntegro de las 10 escenas del guion, tiempos de duración, intervenciones por personaje y referencias a las imágenes de `/public/assets/aistudio/`.
- `src/utils/speechSynthesis.ts`: Servicio para gestión de voces del navegador con cola de reproducción, control de pausas, asignación de perfiles de voz a Martín, Sofía y Gastón.
- `src/utils/controlMath.ts`: Motor numérico para calcular raíces de polinomios cúbicos/cuárticos, evaluación del LGR, y simulación de la respuesta al escalón del sistema en lazo cerrado con ruido EMG.
- `src/components/VideoPlayer/CinematicPlayer.tsx`: Reproductor de video interactivo con soporte de pantalla completa, visualización de la imagen actual con zoom y panning coordinado, avatar del interlocutor y subtítulos con resaltado de progreso.
- `src/components/VideoPlayer/TimelineControls.tsx`: Barra de control con scrubber, tiempos transcurridos, botones de escena, volumen y velocidad.
- `src/components/VideoPlayer/SceneSelector.tsx`: Galería de miniaturas de las 10 escenas con título, duración e indicación de progreso.
- `src/components/ControlLab/ControlLab.tsx`: Panel interactivo con gráfico SVG interactivo de Lugar Geométrico de las Raíces (LGR) y respuesta temporal ante orden mioeléctrica.
- `src/components/ControlLab/LocusPlot.tsx`: Gráfico interactivo del plano $s$ con ejes real/imaginario, polos de lazo abierto en $-4, -6, -10$, y cálculo dinámico de polos de lazo cerrado para la ganancia seleccionada.
- `src/components/ControlLab/TimeResponsePlot.tsx`: Gráfico interactivo de la apertura de la prótesis en el tiempo $y(t)$ vs orden $x(t)$, con indicador de $t_s = 2\text{ s}$ y sobreimpulso máximo del $25\%$.
- `src/components/NarrativeView/ScriptTranscript.tsx`: Vista detallada del guion técnico-clínico con desglose por escenas y notas de ingeniería biomédica.

---

## Plan de Verificación

1. **Prueba de Reproducción y Locución**:
   - Comprobar que las 10 escenas se reproduzcan de forma fluida.
   - Verificar la sincronización de la voz (Web Speech) con los subtítulos y el cambio de interlocutor entre Martín, Sofía y Gastón.
   - Probar los controles de pausa, avance de escena, retroceso, mute y cambio de velocidad.
2. **Validación del Modelo Matemático de Control**:
   - Verificar que al fijar $K = 2240$ en el simulador, el sistema oscile de forma sostenida (límite crítico en $\omega = \sqrt{124} \approx 11.13\text{ rad/s}$).
   - Verificar que para ganancias $K < 2240$ el sistema sea estable y que a mayor $K$ aumente el sobreimpulso.
   - Comprobar que el PID con derivada filtrada satisfaga $t_s \le 2\text{ s}$ y $MP \le 25\%$ con $e_{ss} = 0$.
3. **Comprobación de Imagen y Layout**:
   - Verificar que las 10 imágenes provistas en `/public/assets/aistudio/` se visualicen con nitidez, encuadre adecuado y sin distorsiones en cualquier tamaño de pantalla.
   - Comprobar la ausencia de errores en TypeScript mediante `compile_applet` y `lint_applet`.
