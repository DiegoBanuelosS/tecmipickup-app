# Sistema de Diseño — TecmiPickup

Documentación oficial de estándares de interfaz, experiencia de usuario, identidad visual y directrices de implementación para la plataforma **TecmiPickup**.

---

## 1. Filosofía de Diseño

La filosofía de diseño de TecmiPickup se fundamenta en cuatro pilares clave orientados a optimizar la experiencia en campus universitarios:

### 1.1. Campus First & Cero Fricción (Speed & Efficiency)
- **Contexto dinámico**: Los estudiantes y profesores operan en ventanas de tiempo críticas (cambios de clase de 10 a 15 minutos). La interfaz debe eliminar pasos innecesarios.
- **Flujo de pedidos ágil**: Máximo 3 toques para completar una orden habitual.
- **Visibilidad inmediata del estado**: El usuario debe saber en todo momento el tiempo de espera estimado y cuándo su orden está lista para recoger con su código QR visible sin recargar la pantalla.

### 1.2. Claridad Visual y Baja Carga Cognitiva
- **Jerarquía tipográfica estricta**: Los nombres de platillos, precios y estados del pedido destacan de forma inmediata.
- **Espacios limpios y contenido escaneable**: Separación intencional de componentes mediante espacio en blanco y contraste de superficies en lugar de bordes pesados.
- **Sin elementos decorativos vacíos**: Cada animación, gradiente y sombra tiene un propósito comunicativo (profundidad, retroalimentación táctil o jerarquía).

### 1.3. Ergonomía Móvil (Thumb-Friendly Zone)
- **Navegación inferior flotante (Glass Dock)**: Controles principales colocados en la zona natural de alcance del pulgar, con soporte nativo para safe areas móviles (`env(safe-area-inset-bottom)`).
- **Acciones críticas accesibles**: Botones de confirmación ("Ordenar", "Pagar", "Ver Ticket QR") anclados a la base de la pantalla para interacción natural con una sola mano.

### 1.4. Estética Premium "Apple-Grade" & Campus Tech
- **Superficies traslúcidas (Glassmorphism)**: Efectos de vidrio esmerilado con desenfoque de fondo dinámico (`backdrop-filter`) que transmiten modernidad y tecnología ligera.
- **Fluidez y microinteracciones**: Animaciones de aceleración natural (`cubic-bezier(0.2, 0.9, 0.3, 1)`), retroalimentación al presionar (`transform: scale(0.97)`) y transiciones de estado suaves sin saltos bruscos de diseño.

---

## 2. Sistemas de Diseño y Stack de Diseño

TecmiPickup utiliza un stack moderno enfocado en máxima velocidad de renderizado, peso ligero y control visual total sin abstracciones innecesarias:

### 2.1. Core Framework & Arquitectura
- **Next.js 15 + React 19**: Arquitectura rápida basada en componentes modulares, renderizado optimizado y TypeScript estricto.
- **Vanilla CSS Modules (`*.module.css`)**: Encapsulación de estilos a nivel componente, evitando colisiones globales y manteniendo cero sobrecarga en tiempo de ejecución.
- **Tokens Globales en CSS**: Variables nativas en `index.css` y hojas globales (`kanban.css`) para fuentes, colores temáticos y variables de viewport.

### 2.2. Tipografía Oficial
| Rol | Tipografía | Fallback | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Display / Titulares** | **Bricolage Grotesque** | `"Segoe UI", sans-serif` | Encabezados (`h1`, `h2`), nombres de producto, modales y números de orden. Personalidad geométrica y moderna. |
| **Body / Interfaz** | **Manrope** | `system-ui, sans-serif` | Texto de lectura, etiquetas, formularios, botones, metadatos y tablas del KDS. Alta legibilidad en pantallas compactas. |

### 2.3. Iconografía
- **Lucide React (`lucide-react`)**: Set de iconos unificado, estilizado con grosores de trazo de `1.75px` a `2px`, tamaño estándar de 20px a 24px, asegurando coherencia visual en toda la aplicación.

### 2.4. Motor de Animaciones y Gráficos
- **GSAP (`gsap`, `@gsap/react`)**: Animaciones orquestadas de alto impacto (stagger en catálogos, aperturas de modales y movimientos coordinados).
- **Motion (`motion`)**: Transiciones declarativas de componentes, docked bars, layouts dinámicos y feedback táctil interactivo.
- **Lottie (`@lottiefiles/dotlottie-react`)**: Ilustraciones vectoriales animadas para estados vacíos, pedidos en cocina y confirmaciones de pago exitosas.
- **QR Engine (`qrcode`, `jsqr`)**: Renderizado dinámico de códigos QR para recolección y lector con cámara integrado para la terminal de entrega.

---

## 3. Reglas de Diseño

### 3.1. Grid, Escala y Espaciado
- **Sistema de múltiplos de 4px / 8px**: Todo padding, margin y gap debe respetar la escala:
  - `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`.
- **Márgenes de pantalla**:
  - Móvil: `--page-pad: 20px`.
  - Tablet / Desktop: `24px` a `32px`.
- **Áreas Seguras (Safe Areas)**: Obligatorio en cabeceras y barras inferiores fijas:
  ```css
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  ```

### 3.2. Radios de Borde (Border Radius)
- **Chips y Badges**: `9999px` (Full rounded / Pill shape).
- **Botones e Inputs**: `12px` a `14px`.
- **Tarjetas de Producto y Contenedores**: `16px` a `20px`.
- **Docks Flotantes y Modales**: `16px` a `24px`.

### 3.3. Elevación y Glassmorphism
- **Estilo Frosted Glass Oficial**:
  ```css
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 18px 50px rgba(23, 23, 23, 0.16);
  ```
- **Tarjetas Planas**:
  ```css
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  ```

### 3.4. Reglas de Interacción
- **Tamaño táctil mínimo (Touch Target)**: Mínimo `44px × 44px` para todo botón, icono clickeable o control interactivo en móviles.
- **Active State (Feedback háptico visual)**:
  ```css
  button:active, .clickable:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
  }
  ```
- **Accesibilidad y Foco**:
  ```css
  :focus-visible {
    outline: 2px solid #1b7a4a;
    outline-offset: 2px;
  }
  ```

### 3.5. Dualidad de Interfaces (Cliente vs. Cocina / KDS)
- **Vista Cliente (B2C)**: Móvil primero, estética fresca, paleta clara con fondos tintados según tipo de alimento, dock translúcido y códigos QR prominentes.
- **Vista Restaurante / Cocina (B2B - KDS)**:
  - Optimizado para tablets de cocina y pantallas de despacho.
  - Tablero Kanban con columnas de estado de alta legibilidad a distancia.
  - Indicadores cronometrados por color para alertar tiempos de espera excesivos.

---

## 4. Paleta de Colores

### 4.1. Color Primario e Institucional (Tecmi Green)
| Token / Nombre | Hex Code | Uso |
| :--- | :--- | :--- |
| **Tecmi Green Primary** | `#1b7a4a` | Botones de acción principal (CTA), acentos destacados, marcas de selección. |
| **Tecmi Green Dark** | `#145f39` | Hover y estado presionado de botones primarios. |
| **Tecmi Green Light (Sage)** | `#eef7f2` | Fondos de tarjetas de categorías saludables, badges de éxito y acentos suaves. |
| **Emerald Accent (KDS)** | `#10b981` | Notificaciones de estado "Listo para recoger" y confirmaciones. |

### 4.2. Colores Neutros y Estructura
| Token / Nombre | Hex Code | Uso |
| :--- | :--- | :--- |
| **Carbon Black** | `#171717` | Tipografía principal, títulos de alto contraste, tooltip backgrounds. |
| **Neutral Dark** | `#1f2937` | Texto semi-oscuro y encabezados secundarios. |
| **Neutral Muted** | `#5f5f5f` | Subtítulos, descripciones secundarias, timestamps. |
| **Neutral Subtle** | `#8c9ba5` | Etiquetas de navegación (labels de sidebar), texto inactivo. |
| **Border Neutral** | `#e5e7eb` | Separadores, bordes de inputs y divisores de lista. |
| **Surface Alt / Mist** | `#f4f4f4` | Contenedores de imagen, fondos de inputs deshabilitados. |
| **Canvas Background** | `#ffffff` | Fondo base de la aplicación de usuario. |

### 4.3. Fondos de Categorías (Visual Badges)
Utilizados en el catálogo para dotar de personalidad e identificación visual instantánea a cada item:
- **Visual Mist (`#f4f4f4`)**: Comida rápida, artículos generales, combos y cafetería estándar.
- **Visual Sage (`#eef7f2`)**: Bebidas naturales, ensaladas, opciones fitness y saludables.
- **Visual Cream (`#faf5ec`)**: Panadería, café de especialidad, repostería y desayunos.
- **Visual Cloud (`#f2f4f7`)**: Snacks, empaques, bebidas embotelladas y complementos.

### 4.4. Estados y Semáforo Operativo (Kitchen & Alerts)
| Estado | Color Fondo | Color Texto / Borde | Significado |
| :--- | :--- | :--- | :--- |
| **Pendiente / Nuevo** | `#eff6ff` (Azul) | `#1d4ed8` / `#bfdbfe` | Pedido recién ingresado al sistema. |
| **En Preparación** | `#fffbeb` (Ámbar) | `#b45309` / `#fde68a` | Orden en proceso en la cocina. |
| **Listo para Entrega** | `#ecfdf5` (Esmeralda) | `#047857` / `#a7f3d0` | Notificación activa para retiro en ventanilla. |
| **Cancelado / Alerta** | `#fef2f2` (Rojo) | `#b91c1c` / `#fecaca` | Cancelación o pedido demorado fuera de SLA. |
