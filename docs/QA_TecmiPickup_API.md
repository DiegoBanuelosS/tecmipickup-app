# Plan de Aseguramiento de Calidad (QA) y Reporte de Pruebas de la API
## TecmiPickup - Plataforma de Pedidos Anticipados para Cafetería

---

| **Documento** | Plan y Reporte de QA - API REST |
| :--- | :--- |
| **Proyecto** | TecmiPickup (tecmipickup-app) |
| **Versión** | 1.0.0 |
| **Fecha de Ejecución** | 11 de Septiembre de 2026 |
| **Estado del Dictamen** | **APROBADO (100% Casos Exitosos)** |
| **Ambiente de Pruebas** | Suite Automatizada MockMvc / Spring Boot 3.3.2 (OpenJDK 21 LTS) |

---

## 1. Resumen Ejecutivo

El presente documento establece el plan de pruebas de aseguramiento de calidad (QA) y consolida el reporte de ejecución de pruebas para la API REST de **TecmiPickup**. La plataforma gestiona pedidos de alimentos y bebidas para la cafetería universitaria con una regla central de negocio: **los pedidos deben programarse con un mínimo de 2 horas de anticipación**.

Se diseñaron e implementaron **10 casos de prueba integrales (TC-01 a TC-10)** cubriendo el ciclo de vida completo de la aplicación: autenticación y seguridad JWT, catálogo de productos y categorías con políticas de caché HTTP, consulta de horarios operativos, reglas de negocio de pedidos, gestión de inventario y stock, y la lógica de despacho y cola de cocina (FIFO y prioridad).

### Resumen de Métricas de Ejecución
- **Total de Casos Diseñados:** 10
- **Casos Ejecutados:** 10
- **Casos Exitosos (PASS):** 10 (100%)
- **Casos Fallidos (FAIL):** 0 (0%)
- **Casos Bloqueados / Omitidos:** 0 (0%)
- **Tiempo Total de Ejecución de la Suite:** 3.803 segundos

---

## 2. Alcance y Arquitectura Bajo Prueba

### 2.1 Componentes Evaluados
- **Autenticación y Seguridad:** `AuthController` (`/api/auth/**`), generación y verificación de tokens JWT con algoritmos HMAC-SHA, roles `CLIENT` y `ADMIN`.
- **Catálogo y Caché:** `CatalogoController` (`/api/home`, `/api/productos/**`, `/api/categorias`), implementación de `Cache-Control` (`max-age=30`) y caché en memoria Caffeine.
- **Horarios de Cafetería:** `HorarioController` (`/api/horarios`), validación de rangos de operación y caché HTTP (`max-age=300`).
- **Gestión de Pedidos:** `PedidoController` (`/api/pedidos/**`), cálculo de subtotales, control transaccional de stock, transición de estados (`PENDIENTE`, `EN_PREPARACION`, `LISTO`, `ENTREGADO`, `CANCELADO`).
- **Regla de Negocio Crítica:** Validación obligatoria de anticipación mínima de 2 horas respecto a `LocalDateTime.now()`.
- **Módulo de Cocina:** `CocinaController` (`/api/cocina/**`), cola FIFO, ordenamiento por tiempo de entrega, bitácora de auditoría y función de reversión (*undo*).

### 2.2 Stack Tecnológico de Pruebas
- **Framework:** Spring Boot 3.3.2 Test Framework
- **Ejecutor de Pruebas:** JUnit 5 Platform Runner + Surefire 3.2.5
- **Mocking & Assertion:** MockMvc Standalone Setup, Mockito 5.x, Hamcrest, Jackson JavaTime
- **Runtime:** OpenJDK 21 LTS (Microsoft HotSpot)

---

## 3. Matriz de los 10 Casos de Prueba (Test Cases)

| ID | Módulo | Método | Endpoint | Objetivo / Descripción | Resultado |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **TC-01** | Auth | `POST` | `/api/auth/register` | Registro exitoso de usuario nuevo y emisión de JWT inicial | **PASS** |
| **TC-02** | Auth | `POST` | `/api/auth/login` | Autenticación con credenciales válidas y obtención de token de sesión | **PASS** |
| **TC-03** | Catálogo | `GET` | `/api/home` | Consulta consolidada de categorías y productos con cabecera `Cache-Control` | **PASS** |
| **TC-04** | Catálogo | `GET` | `/api/productos/categoria/{id}` | Filtrado de productos activos por identificador de categoría | **PASS** |
| **TC-05** | Horarios | `GET` | `/api/horarios` | Consulta de horarios operativos con política de caché de 5 minutos | **PASS** |
| **TC-06** | Pedidos | `POST` | `/api/pedidos/{usuarioId}` | Creación de pedido válido cumpliendo regla de anticipación $\ge$ 2 horas | **PASS** |
| **TC-07** | Pedidos | `POST` | `/api/pedidos/{usuarioId}` | Rechazo de pedido con anticipación insuficiente (< 2 horas) -> HTTP 400 | **PASS** |
| **TC-08** | Pedidos | `PATCH`| `/api/pedidos/{id}/cancelar` | Cancelación de pedido pendiente y restauración automática del inventario | **PASS** |
| **TC-09** | Cocina | `GET` | `/api/cocina/siguiente` | Despacho de la orden más antigua en cola de preparación (FIFO) | **PASS** |
| **TC-10** | Cocina | `GET` / `POST` | `/api/cocina/estado` & `/deshacer` | Consulta de métricas de cocina y reversión del último cambio de estado | **PASS** |

---

## 4. Especificación Detallada de los Casos de Prueba

### TC-01: Registro de nuevo usuario en la plataforma
- **Endpoint:** `POST /api/auth/register`
- **Precondición:** El correo electrónico no debe existir previamente en la base de datos.
- **Datos de Entrada (Request Body):**
```json
{
  "nombre": "Carlos Mendoza",
  "email": "carlos.mendoza@tec.mx",
  "password": "PasswordSeguro123!",
  "matricula": "A01234567"
}
```
- **Respuesta Esperada:**
  - Código de estado: `201 Created`
  - Body: Objeto con `id`, `token` JWT válido, `email`, `nombre` y `role: "CLIENT"`.
- **Criterio de Éxito:** Generación del usuario con contraseña encriptada (BCrypt) y token no nulo.
- **Estado de Ejecución:** **PASS**

---

### TC-02: Autenticación e inicio de sesión de usuario
- **Endpoint:** `POST /api/auth/login`
- **Precondición:** Usuario registrado en el sistema.
- **Datos de Entrada (Request Body):**
```json
{
  "email": "carlos.mendoza@tec.mx",
  "password": "PasswordSeguro123!"
}
```
- **Respuesta Esperada:**
  - Código de estado: `200 OK`
  - Body: Objeto con token JWT y datos de sesión del usuario.
- **Criterio de Éxito:** Autenticación satisfactoria y entrega del Bearer token.
- **Estado de Ejecución:** **PASS**

---

### TC-03: Consulta consolidada de catálogo inicial (Home)
- **Endpoint:** `GET /api/home`
- **Precondición:** Existen categorías y productos dados de alta en catálogo.
- **Respuesta Esperada:**
  - Código de estado: `200 OK`
  - Headers: `Cache-Control: max-age=30, must-revalidate, public`
  - Body: JSON con arreglos `categorias` y `productos`.
- **Criterio de Éxito:** Estructura completa y cabecera de caché activa para optimizar tráfico cliente.
- **Estado de Ejecución:** **PASS**

---

### TC-04: Filtrado de productos por categoría
- **Endpoint:** `GET /api/productos/categoria/cat_comida`
- **Precondición:** La categoría `cat_comida` existe y tiene productos asociados activos.
- **Respuesta Esperada:**
  - Código de estado: `200 OK`
  - Body: Lista de productos pertenecientes a dicha categoría (`Sandwich Gourmet`, precio: `65.00`).
- **Criterio de Éxito:** Todos los elementos retornados corresponden a la categoría solicitada.
- **Estado de Ejecución:** **PASS**

---

### TC-05: Consulta de horarios de operación de la cafetería
- **Endpoint:** `GET /api/horarios`
- **Precondición:** Horarios de apertura y cierre configurados por día.
- **Respuesta Esperada:**
  - Código de estado: `200 OK`
  - Headers: `Cache-Control: max-age=300, public`
  - Body: Lista de días con horas de apertura y cierre (ej. Lunes 08:00 - 20:00).
- **Criterio de Éxito:** Cabecera de caché de 5 minutos y formato de hora ISO.
- **Estado de Ejecución:** **PASS**

---

### TC-06: Creación exitosa de pedido con anticipación válida ($\ge$ 2 horas)
- **Endpoint:** `POST /api/pedidos/usr_001`
- **Precondición:** Usuario existente, productos activos con stock suficiente y hora dentro del horario operativo.
- **Datos de Entrada (Request Body):**
```json
{
  "fechaEntregaSolicitada": "2026-09-11T21:05:00",
  "detalles": [
    {
      "productoId": "p1",
      "cantidad": 2
    }
  ]
}
```
- **Respuesta Esperada:**
  - Código de estado: `201 Created`
  - Body: Pedido en estado `PENDIENTE`, cálculo de total (`70.00`) y encolamiento en cocina.
- **Criterio de Éxito:** Registro en base de datos, decremento del inventario y confirmación del pedido.
- **Estado de Ejecución:** **PASS**

---

### TC-07: Validación de regla de negocio: Rechazo con anticipación < 2 horas
- **Endpoint:** `POST /api/pedidos/usr_001`
- **Precondición:** El usuario intenta solicitar un pedido para una hora menor al umbral de 2 horas (ej. +30 min).
- **Datos de Entrada (Request Body):**
```json
{
  "fechaEntregaSolicitada": "2026-09-11T18:35:00",
  "detalles": [
    {
      "productoId": "p1",
      "cantidad": 1
    }
  ]
}
```
- **Respuesta Esperada:**
  - Código de estado: `400 Bad Request`
  - Body:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "El pedido debe agendarse con al menos 2 horas de anticipación."
}
```
- **Criterio de Éxito:** Bloqueo inmediato de la transacción sin descontar stock ni alterar base de datos.
- **Estado de Ejecución:** **PASS**

---

### TC-08: Cancelación de pedido y reintegración de inventario
- **Endpoint:** `PATCH /api/pedidos/ped_100/cancelar`
- **Precondición:** El pedido existe y se encuentra en estado cancelable (`PENDIENTE`).
- **Respuesta Esperada:**
  - Código de estado: `200 OK`
  - Body: Objeto pedido con `estado: "CANCELADO"`.
- **Criterio de Éxito:** Transición de estado permitida e incremento automático del stock de los productos involucrados.
- **Estado de Ejecución:** **PASS**

---

### TC-09: Despacho de órdenes en cocina mediante cola FIFO
- **Endpoint:** `GET /api/cocina/siguiente`
- **Precondición:** Existen pedidos pendientes en la cola de cocina.
- **Respuesta Esperada:**
  - Código de estado: `200 OK`
  - Body: Pedido más antiguo registrado según el algoritmo FIFO (*First In, First Out*).
- **Criterio de Éxito:** Se atiende de manera secuencial y ordenada según llegada.
- **Estado de Ejecución:** **PASS**

---

### TC-10: Monitoreo de colas de cocina y reversión de transiciones (*Undo*)
- **Endpoints:**
  1. `GET /api/cocina/estado`
  2. `POST /api/cocina/deshacer`
- **Precondición:** Operaciones previas realizadas en la cocina registradas en la pila de cambios.
- **Respuesta Esperada:**
  - `GET /api/cocina/estado`: Retorna contadores de colas (`fifo`, `prioridad`, `historial`).
  - `POST /api/cocina/deshacer`: Retorna el pedido con su estado previo restaurado (`EN_PREPARACION`).
- **Criterio de Éxito:** Consistencia en los contadores y capacidad de deshacer errores humanos en cocina.
- **Estado de Ejecución:** **PASS**

---

## 5. Evidencia de Ejecución de Pruebas de la API

Las pruebas fueron codificadas y ejecutadas dentro del módulo de testing automatizado de la aplicación:
- **Archivo de Prueba:** [`backend/test/cafeteria/ApiQATest.java`](file:///c:/Users/Diego/Documents/GitHub/tecmipickup-app/backend/test/cafeteria/ApiQATest.java)
- **Comando de Ejecución:**
```bash
./mvnw.cmd test -Dtest=ApiQATest
```

### 5.1 Salida del Ejecutor de Pruebas (Surefire / JUnit 5)

```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running cafeteria.ApiQATest
18:05:06.220 [main] INFO org.springframework.mock.web.MockServletContext -- Initializing Spring TestDispatcherServlet ''
18:05:06.220 [main] INFO org.springframework.test.web.servlet.TestDispatcherServlet -- Completed initialization in 0 ms
...
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.803 s -- in cafeteria.ApiQATest
[INFO] Running cafeteria.PedidoServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.372 s -- in cafeteria.PedidoServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  6.400 s
[INFO] Finished at: 2026-09-11T18:05:06-06:00
[INFO] ------------------------------------------------------------------------
```

---

## 6. Guía de Ejecución de Pruebas Manuales (cURL)

Para verificar los endpoints en un entorno en vivo (`http://localhost:8080` o `https://tecmipickup.fly.dev`), se proveen los siguientes comandos:

```bash
# 1. Registro
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos Mendoza","email":"carlos@tec.mx","password":"Password123!","matricula":"A01234567"}'

# 2. Login
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@tec.mx","password":"Password123!"}'

# 3. Consulta de Catálogo (Home con Caché)
curl -i -X GET "http://localhost:8080/api/home"

# 4. Consulta de Horarios (Caché de 5 min)
curl -i -X GET "http://localhost:8080/api/horarios"

# 5. Creación de Pedido (Prueba de Regla >= 2 Horas)
curl -X POST "http://localhost:8080/api/pedidos/USUARIO_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "fechaEntregaSolicitada": "2026-09-12T14:00:00",
    "detalles": [{"productoId": "PRODUCTO_ID", "cantidad": 2}]
  }'

# 6. Prueba Negativa: Rechazo por anticipación insuficiente (< 2 horas)
curl -i -X POST "http://localhost:8080/api/pedidos/USUARIO_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "fechaEntregaSolicitada": "2026-09-11T18:30:00",
    "detalles": [{"productoId": "PRODUCTO_ID", "cantidad": 1}]
  }'

# 7. Cancelación de Pedido
curl -X PATCH "http://localhost:8080/api/pedidos/PEDIDO_ID/cancelar"

# 8. Estado y Cola de Cocina
curl -X GET "http://localhost:8080/api/cocina/siguiente"
curl -X GET "http://localhost:8080/api/cocina/estado"
curl -X POST "http://localhost:8080/api/cocina/deshacer"
```

---

## 7. Hallazgos y Recomendaciones de Calidad

1. **Gestión de Fechas y Zona Horaria:**
   - *Observación:* La API utiliza `LocalDateTime.now()`. Es recomendable asegurar que tanto el servidor backend como la base de datos sincronicen la zona horaria (ej. `America/Mexico_City` / UTC) para evitar discrepancias en la validación de las 2 horas cuando el cliente envía formato ISO con offset.
2. **Validación de Fechas Pasadas:**
   - *Recomendación:* Se verificó que el cálculo de `isBefore(ahora.plusHours(2))` rechaza fechas pasadas automáticamente, lo cual es correcto y robusto.
3. **Idempotencia y Manejo de Stock Concurrente:**
   - *Recomendación:* Para picos de alta demanda en cafetería, se sugiere implementar bloqueo optimista (`@Version` en Mongo) en el documento de `Producto` para mitigar cualquier posibilidad de *race condition* en compras simultáneas del último item disponible.

---

## 8. Dictamen Final de QA

> **DICTAMEN: APROBADO**  
> Todos los 10 casos de prueba fueron ejecutados y completados satisfactoriamente con una tasa de éxito del **100%**. La API REST de TecmiPickup cumple con los requerimientos funcionales, de seguridad, de rendimiento con caché HTTP y las reglas críticas de negocio establecidas.

---

## 9. Estructuras de Datos y Algoritmos: Pilas (Stacks) y Recursividad en la API

Se añadieron formalmente a la arquitectura de la API la estructura de datos **Pila (Stack)** y algoritmos fundamentados en **Recursividad**:

### 9.1 Estructura de Datos: Pila (Stack - LIFO)
- **Clase Genérica:** [`cafeteria.structure.Pila<T>`](file:///c:/Users/Diego/Documents/GitHub/tecmipickup-app/backend/src/cafeteria/structure/Pila.java)
- **Implementación:** Basada en nodos enlazados propios con puntero a la `cima`.
- **Operaciones:**
  - `apilar(T elemento)` (Push): Inserción en tiempo $O(1)$.
  - `desapilar()` (Pop): Extracción del último elemento en tiempo $O(1)$.
  - `verCima()` (Peek): Lectura del elemento superior sin modificar la pila en $O(1)$.
  - `estaVacia()` / `getTamanio()` / `limpiar()`.
  - `listarRecursivo()`: Recorrido recursivo de los nodos enlazados de la cima hacia el fondo.
- **Casos de Uso en la API:**
  1. **Pila de Deshacer (Undo) de Cocina:** Registra las transiciones de estado de los pedidos (`CambioEstado`). Al invocar `POST /api/cocina/deshacer`, desapila la última acción y restaura el estado previo.
  2. **Pila de Órdenes Recientes:** Apila las órdenes conforme son confirmadas para inspección rápida en orden inverso (LIFO).
- **Nuevos Endpoints REST de la Pila:**
  - `GET /api/cocina/pila/historial`: Consulta las transiciones apiladas en orden LIFO.
  - `GET /api/cocina/pila/cima`: Retorna el elemento actual en la cima de la pila (`PEEK`).
  - `GET /api/cocina/pila/recientes`: Consulta las órdenes recientes apiladas.

### 9.2 Algoritmos de Recursividad en la API
Se implementaron algoritmos recursivos con caso base y paso recursivo explícitos en distintas capas del negocio:

1. **Cálculo Recursivo de Totales de Pedidos (`PedidoService.calcularTotalRecursivo`):**
   - *Caso Base:* `indice >= detalles.size()` o lista nula $\rightarrow$ Retorna `BigDecimal.ZERO`.
   - *Paso Recursivo:* `subtotal_actual + calcularTotalRecursivo(detalles, indice + 1)`.
   - *Endpoint:* `GET /api/pedidos/{id}/desglose-recursivo`.

2. **Conteo Recursivo de Cantidad Total de Artículos (`PedidoService.calcularCantidadTotalRecursivo`):**
   - *Caso Base:* Fin de la lista de detalles $\rightarrow$ `0`.
   - *Paso Recursivo:* `cantidad_actual + calcularCantidadTotalRecursivo(detalles, indice + 1)`.

3. **Búsqueda Binaria Recursiva en Catálogo (`CatalogoService.buscarBinarioRecursivo`):**
   - *Caso Base 1:* `inicio > fin` $\rightarrow$ `Optional.empty()`.
   - *Caso Base 2:* Coincidencia exacta en la posición central $\rightarrow$ `Optional.of(producto)`.
   - *Paso Recursivo:* Descarte de mitades según comparación alfabética (Complejidad: $O(\log n)$).
   - *Endpoint:* `GET /api/productos/buscar-recursivo?nombre=...`.

4. **Estimación de Tiempo de Espera en Cola de Cocina (`CocinaCola.calcularTiempoEsperaColaRecursivo`):**
   - *Caso Base:* `indice >= pedidos.size()` $\rightarrow$ `0` minutos.
   - *Paso Recursivo:* `tiempo_pedido_actual + calcularTiempoEsperaColaRecursivo(pedidos, indice + 1)`.
   - *Endpoint:* `GET /api/cocina/tiempo-espera-recursivo`.

5. **Recorrido Recursivo de Nodos de la Pila (`Pila.recorrerNodosRecursivo`):**
   - *Caso Base:* Nodo actual nulo.
   - *Paso Recursivo:* Agrega dato del nodo actual y avanza hacia `nodoActual.siguiente`.

### 9.3 Resultados de Pruebas Unitarias y de Integración (Total: 21 Pruebas)
Se ejecutaron **21 pruebas automatizadas** en Maven (`PilaYRecursividadTest`, `ApiQATest`, `PedidoServiceTest`):
```text
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0 -- in cafeteria.ApiQATest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in cafeteria.PedidoServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0 -- in cafeteria.PilaYRecursividadTest
[INFO] Results: Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS (13.024 s)
```

