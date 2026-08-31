package cafeteria.service;

import cafeteria.dto.DetallePedidoRequest;
import cafeteria.dto.DetallePedidoResponse;
import cafeteria.dto.PedidoRequest;
import cafeteria.dto.PedidoResponse;
import cafeteria.entity.DetallePedido;
import cafeteria.entity.HorarioCafeteria;
import cafeteria.entity.Pedido;
import cafeteria.entity.PedidoEstado;
import cafeteria.entity.Producto;
import cafeteria.entity.Usuario;
import cafeteria.config.CacheConfig;
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
        BigDecimal total = BigDecimal.ZERO;

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
            total = total.add(subtotal);

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
        if (!usuarioRepository.existsById(usuarioId)) {
            throw ApiException.notFound("Usuario no encontrado.");
        }
        return pedidoRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId)
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
