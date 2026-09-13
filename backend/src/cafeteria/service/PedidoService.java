package cafeteria.service;

import cafeteria.config.CacheConfig;
import cafeteria.dto.DetallePedidoRequest;
import cafeteria.dto.DetallePedidoResponse;
import cafeteria.dto.PedidoRequest;
import cafeteria.dto.PedidoResponse;
import cafeteria.dto.ResumenPedidoRecursivo;
import cafeteria.entity.DetallePedido;
import cafeteria.entity.HorarioCafeteria;
import cafeteria.entity.Pedido;
import cafeteria.entity.PedidoEstado;
import cafeteria.entity.Producto;
import cafeteria.entity.Usuario;
import cafeteria.exception.ApiException;
import cafeteria.kitchen.CocinaCola;
import cafeteria.repository.PedidoRepository;
import cafeteria.repository.ProductoRepository;
import cafeteria.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final HorarioService horarioService;
    private final CocinaCola cocinaCola;

    private static final long HORAS_ANTICIPACION_MINIMAS = 2L;

    @Caching(evict = {
            @CacheEvict(cacheNames = CacheConfig.PRODUCTOS, allEntries = true),
            @CacheEvict(cacheNames = CacheConfig.PRODUCTOS_CATEGORIA, allEntries = true)
    })
    public PedidoResponse crearPedido(String usuarioId, PedidoRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .or(() -> usuarioRepository.findByEmail(usuarioId))
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado."));

        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime fechaEntrega = request.getFechaEntregaSolicitada();

        if (fechaEntrega.isBefore(ahora.plusHours(HORAS_ANTICIPACION_MINIMAS))) {
            throw new ApiException("El pedido debe agendarse con al menos 2 horas de anticipación.");
        }

        validarHorarioCafeteria(fechaEntrega);

        Map<String, Integer> cantidades = new HashMap<>();
        for (DetallePedidoRequest linea : request.getDetalles()) {
            cantidades.merge(linea.getProductoId(), linea.getCantidad(), Integer::sum);
        }

        Map<String, Producto> catalogo = new HashMap<>();
        List<DetallePedido> lineas = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : cantidades.entrySet()) {
            Producto producto = catalogo.computeIfAbsent(entry.getKey(), id ->
                    productoRepository.findById(id)
                            .orElseThrow(() -> ApiException.notFound("Producto no encontrado: " + id)));

            if (!Boolean.TRUE.equals(producto.getActivo())) {
                throw new ApiException("El producto ya no está disponible: " + producto.getNombre());
            }
            if (producto.getStock() < entry.getValue()) {
                throw ApiException.conflict("No hay suficiente stock para: " + producto.getNombre());
            }

            BigDecimal subtotal = producto.getPrecio().multiply(BigDecimal.valueOf(entry.getValue()));

            lineas.add(DetallePedido.builder()
                    .productoId(producto.getId())
                    .productoNombre(producto.getNombre())
                    .cantidad(entry.getValue())
                    .precioUnitario(producto.getPrecio())
                    .subtotal(subtotal)
                    .build());

            producto.setStock(producto.getStock() - entry.getValue());
            productoRepository.save(producto);
        }

        // ========================================================
        // USO DE RECURSIVIDAD: Cálculo recursivo del total del pedido
        // ========================================================
        BigDecimal total = calcularTotalRecursivo(lineas, 0);

        Pedido pedido = Pedido.builder()
                .usuarioId(usuario.getId())
                .usuarioNombre(usuario.getNombre())
                .usuarioEmail(usuario.getEmail())
                .fechaCreacion(ahora)
                .fechaEntregaSolicitada(fechaEntrega)
                .estado(PedidoEstado.PENDIENTE)
                .total(total)
                .detalles(lineas)
                .build();

        Pedido guardado = pedidoRepository.save(pedido);
        cocinaCola.registrar(guardado);
        return toResponse(guardado);
    }

    public PedidoResponse consultarPedido(String id) {
        return toResponse(obtener(id));
    }

    public List<PedidoResponse> consultarPedidosUsuario(String usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .or(() -> usuarioRepository.findByEmail(usuarioId))
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado."));
        return pedidoRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuario.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PedidoResponse> listarTodos() {
        return pedidoRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getFechaCreacion().compareTo(a.getFechaCreacion()))
                .map(this::toResponse)
                .toList();
    }

    public List<PedidoResponse> consultarPorEstado(PedidoEstado estado) {
        return pedidoRepository.findByEstadoOrderByFechaCreacionDesc(estado)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PedidoResponse cambiarEstado(String pedidoId, PedidoEstado nuevoEstado) {
        Pedido pedido = obtener(pedidoId);

        if (pedido.getEstado() == PedidoEstado.CANCELADO && nuevoEstado != PedidoEstado.CANCELADO) {
            throw ApiException.conflict("No se puede cambiar el estado de un pedido cancelado.");
        }

        PedidoEstado anterior = pedido.getEstado();
        pedido.setEstado(nuevoEstado);
        Pedido guardado = pedidoRepository.save(pedido);
        cocinaCola.registrarCambio(pedidoId, anterior, nuevoEstado);
        cocinaCola.actualizar(guardado);
        return toResponse(guardado);
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = CacheConfig.PRODUCTOS, allEntries = true),
            @CacheEvict(cacheNames = CacheConfig.PRODUCTOS_CATEGORIA, allEntries = true)
    })
    public PedidoResponse cancelarPedido(String pedidoId) {
        Pedido pedido = obtener(pedidoId);

        if (pedido.getEstado() == PedidoEstado.LISTO || pedido.getEstado() == PedidoEstado.ENTREGADO) {
            throw ApiException.conflict("No se puede cancelar un pedido ya listo o entregado.");
        }
        if (pedido.getEstado() == PedidoEstado.CANCELADO) {
            throw ApiException.conflict("El pedido ya está cancelado.");
        }

        restaurarStock(pedido);
        PedidoEstado anterior = pedido.getEstado();
        pedido.setEstado(PedidoEstado.CANCELADO);
        Pedido guardado = pedidoRepository.save(pedido);
        cocinaCola.registrarCambio(pedidoId, anterior, PedidoEstado.CANCELADO);
        cocinaCola.actualizar(guardado);
        return toResponse(guardado);
    }

    public PedidoResponse deshacerUltimoCambio() {
        CocinaCola.CambioEstado cambio = cocinaCola.deshacer();
        Pedido pedido = obtener(cambio.pedidoId());
        pedido.setEstado(cambio.anterior());
        Pedido guardado = pedidoRepository.save(pedido);
        cocinaCola.actualizar(guardado);
        return toResponse(guardado);
    }

    public PedidoResponse siguienteFifo() {
        Pedido siguiente = cocinaCola.siguienteFifo();
        if (siguiente == null) {
            throw ApiException.notFound("No hay pedidos pendientes en la cola.");
        }
        return toResponse(obtener(siguiente.getId()));
    }

    public PedidoResponse siguientePorEntrega() {
        Pedido siguiente = cocinaCola.siguientePorEntrega();
        if (siguiente == null) {
            throw ApiException.notFound("No hay pedidos en la cola de prioridad.");
        }
        return toResponse(obtener(siguiente.getId()));
    }

    public Map<String, Integer> estadoCocina() {
        return cocinaCola.tamanos();
    }

    public List<String> bitacoraCocina() {
        return cocinaCola.bitacora();
    }

    // ========================================================
    // SECCIÓN DE RECURSIVIDAD Y PILAS EN PEDIDOS
    // ========================================================

    /**
     * Algoritmo RECURSIVO para calcular el costo total acumulado del pedido.
     *
     * @param detalles Lista de líneas del pedido.
     * @param indice Posición actual evaluada en la recursión.
     * @return Suma recursiva del total.
     */
    public BigDecimal calcularTotalRecursivo(List<DetallePedido> detalles, int indice) {
        // CASO BASE: lista vacía o fin de los detalles alcanzado
        if (detalles == null || indice >= detalles.size()) {
            return BigDecimal.ZERO;
        }

        DetallePedido actual = detalles.get(indice);
        BigDecimal subtotal = actual.getSubtotal() != null
                ? actual.getSubtotal()
                : actual.getPrecioUnitario().multiply(BigDecimal.valueOf(actual.getCantidad()));

        // PASO RECURSIVO: subtotal actual + suma recursiva del resto de elementos
        return subtotal.add(calcularTotalRecursivo(detalles, indice + 1));
    }

    /**
     * Algoritmo RECURSIVO para sumar la cantidad total de artículos de un pedido.
     *
     * @param detalles Lista de detalles.
     * @param indice Posición actual.
     * @return Suma recursiva de cantidades.
     */
    public int calcularCantidadTotalRecursivo(List<DetallePedido> detalles, int indice) {
        // CASO BASE
        if (detalles == null || indice >= detalles.size()) {
            return 0;
        }
        // PASO RECURSIVO
        return detalles.get(indice).getCantidad() + calcularCantidadTotalRecursivo(detalles, indice + 1);
    }

    /**
     * Consulta el resumen analítico de un pedido calculado recursivamente.
     */
    public ResumenPedidoRecursivo obtenerResumenRecursivo(String pedidoId) {
        Pedido pedido = obtener(pedidoId);
        int cantidadTotal = calcularCantidadTotalRecursivo(pedido.getDetalles(), 0);
        BigDecimal totalRecursivo = calcularTotalRecursivo(pedido.getDetalles(), 0);
        int tiempoEstimadoMinutos = 3 + (cantidadTotal * 2);

        return ResumenPedidoRecursivo.builder()
                .pedidoId(pedido.getId())
                .cliente(pedido.getUsuarioNombre())
                .estado(pedido.getEstado())
                .fechaEntrega(pedido.getFechaEntregaSolicitada())
                .cantidadTotalArticulosRecursivo(cantidadTotal)
                .totalCalculadoRecursivo(totalRecursivo)
                .tiempoEstimadoPreparacionMinutos(tiempoEstimadoMinutos)
                .metodoCalculo("Recursión lineal sobre lista enlazada de detalles")
                .build();
    }

    /**
     * Retorna el tiempo total estimado acumulado en la cola de cocina usando cálculo recursivo.
     */
    public Map<String, Object> tiempoEstimadoCocinaRecursivo() {
        List<Pedido> pendientes = cocinaCola.obtenerPedidosPendientesCola();
        int minutos = cocinaCola.calcularTiempoEsperaColaRecursivo(pendientes, 0);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("pedidosEnCola", pendientes.size());
        resultado.put("tiempoTotalMinutos", minutos);
        resultado.put("metodo", "Cálculo Recursivo en CocinaCola");
        return resultado;
    }

    /**
     * Acceso a la PILA de historial de cambios en cocina.
     */
    public List<CocinaCola.CambioEstado> obtenerHistorialPila() {
        return cocinaCola.listarHistorialPila();
    }

    /**
     * Acceso a la cima de la PILA de historial sin desapilar.
     */
    public CocinaCola.CambioEstado obtenerCimaHistorialPila() {
        return cocinaCola.verCimaHistorial();
    }

    /**
     * Acceso a la PILA de órdenes recientes de cocina.
     */
    public List<Pedido> obtenerOrdenesRecientesPila() {
        return cocinaCola.listarOrdenesRecientesPila();
    }

    private Pedido obtener(String id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Pedido no encontrado."));
    }

    private void restaurarStock(Pedido pedido) {
        for (DetallePedido detalle : pedido.getDetalles()) {
            productoRepository.findById(detalle.getProductoId()).ifPresent(producto -> {
                producto.setStock(producto.getStock() + detalle.getCantidad());
                productoRepository.save(producto);
            });
        }
    }

    private void validarHorarioCafeteria(LocalDateTime fechaEntrega) {
        DayOfWeek dia = fechaEntrega.toLocalDate().getDayOfWeek();
        LocalTime hora = fechaEntrega.toLocalTime();

        HorarioCafeteria horario = horarioService.porDia(dia.name())
                .orElse(null);

        LocalTime apertura = horario != null ? horario.getHoraApertura() : horarioPorDefectoApertura(dia);
        LocalTime cierre = horario != null ? horario.getHoraCierre() : horarioPorDefectoCierre(dia);

        if (hora.isBefore(apertura) || hora.isAfter(cierre)) {
            throw new ApiException("La cafeteria está cerrada en la hora solicitada.");
        }
    }

    private LocalTime horarioPorDefectoApertura(DayOfWeek dia) {
        return (dia == DayOfWeek.SATURDAY || dia == DayOfWeek.SUNDAY)
                ? LocalTime.of(9, 0)
                : LocalTime.of(8, 0);
    }

    private LocalTime horarioPorDefectoCierre(DayOfWeek dia) {
        return (dia == DayOfWeek.SATURDAY || dia == DayOfWeek.SUNDAY)
                ? LocalTime.of(18, 0)
                : LocalTime.of(20, 0);
    }

    private PedidoResponse toResponse(Pedido pedido) {
        List<DetallePedidoResponse> detalles = pedido.getDetalles() == null
                ? List.of()
                : pedido.getDetalles().stream()
                .map(d -> DetallePedidoResponse.builder()
                        .productoId(d.getProductoId())
                        .productoNombre(d.getProductoNombre())
                        .cantidad(d.getCantidad())
                        .precioUnitario(d.getPrecioUnitario())
                        .subtotal(d.getSubtotal())
                        .build())
                .toList();

        return PedidoResponse.builder()
                .id(pedido.getId())
                .usuarioId(pedido.getUsuarioId())
                .usuarioNombre(pedido.getUsuarioNombre())
                .usuarioEmail(pedido.getUsuarioEmail())
                .fechaCreacion(pedido.getFechaCreacion())
                .fechaEntregaSolicitada(pedido.getFechaEntregaSolicitada())
                .estado(pedido.getEstado())
                .total(pedido.getTotal())
                .detalles(detalles)
                .build();
    }
}
