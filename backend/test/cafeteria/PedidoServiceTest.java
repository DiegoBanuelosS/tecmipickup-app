package cafeteria;

import cafeteria.dto.DetallePedidoRequest;
import cafeteria.dto.PedidoRequest;
import cafeteria.dto.PedidoResponse;
import cafeteria.entity.Pedido;
import cafeteria.entity.PedidoEstado;
import cafeteria.entity.Producto;
import cafeteria.entity.Role;
import cafeteria.entity.Usuario;
import cafeteria.exception.ApiException;
import cafeteria.kitchen.CocinaCola;
import cafeteria.repository.PedidoRepository;
import cafeteria.repository.ProductoRepository;
import cafeteria.repository.UsuarioRepository;
import cafeteria.service.HorarioService;
import cafeteria.service.PedidoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private ProductoRepository productoRepository;
    @Mock
    private HorarioService horarioService;
    @Mock
    private CocinaCola cocinaCola;

    @InjectMocks
    private PedidoService pedidoService;

    private Usuario usuario;
    private Producto cafe;

    @BeforeEach
    void setup() {
        usuario = Usuario.builder()
                .id("u1")
                .nombre("Ana")
                .email("ana@tec.mx")
                .password("hash")
                .role(Role.CLIENT)
                .build();
        cafe = Producto.builder()
                .id("p1")
                .nombre("Cafe")
                .descripcion("Americano")
                .precio(new BigDecimal("35.00"))
                .stock(10)
                .activo(true)
                .categoriaId("c1")
                .categoriaNombre("Bebidas")
                .build();
    }

    @Test
    void shouldCreatePedidoWithTwoHoursAdvance() {
        when(usuarioRepository.findById("u1")).thenReturn(Optional.of(usuario));
        when(productoRepository.findById("p1")).thenReturn(Optional.of(cafe));
        when(horarioService.porDia(any())).thenReturn(Optional.empty());
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> {
            Pedido pedido = invocation.getArgument(0);
            pedido.setId("ped1");
            return pedido;
        });

        LocalDateTime validPickup = LocalDateTime.now().plusDays(1).withHour(12).withMinute(0).withSecond(0).withNano(0);
        PedidoRequest request = pedidoRequest(validPickup, "p1", 2);

        PedidoResponse pedido = pedidoService.crearPedido("u1", request);

        assertEquals(PedidoEstado.PENDIENTE, pedido.getEstado());
        assertEquals(1, pedido.getDetalles().size());
        assertEquals(new BigDecimal("70.00"), pedido.getTotal());
        verify(cocinaCola).registrar(any(Pedido.class));

        ArgumentCaptor<Producto> productoCaptor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(productoCaptor.capture());
        assertEquals(8, productoCaptor.getValue().getStock());
    }

    @Test
    void shouldRejectPedidoWithoutTwoHoursAdvance() {
        when(usuarioRepository.findById("u1")).thenReturn(Optional.of(usuario));

        PedidoRequest request = pedidoRequest(LocalDateTime.now().plusMinutes(30), "p1", 1);

        ApiException exception = assertThrows(ApiException.class, () -> pedidoService.crearPedido("u1", request));
        assertTrue(exception.getMessage().contains("2 horas"));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void shouldRestoreStockOnCancel() {
        Pedido pedido = Pedido.builder()
                .id("ped1")
                .usuarioId("u1")
                .estado(PedidoEstado.PENDIENTE)
                .total(new BigDecimal("35.00"))
                .detalles(List.of(cafeteria.entity.DetallePedido.builder()
                        .productoId("p1")
                        .productoNombre("Cafe")
                        .cantidad(2)
                        .precioUnitario(new BigDecimal("35.00"))
                        .subtotal(new BigDecimal("70.00"))
                        .build()))
                .build();
        when(pedidoRepository.findById("ped1")).thenReturn(Optional.of(pedido));
        when(productoRepository.findById("p1")).thenReturn(Optional.of(cafe));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PedidoResponse cancelled = pedidoService.cancelarPedido("ped1");

        assertEquals(PedidoEstado.CANCELADO, cancelled.getEstado());
        assertEquals(12, cafe.getStock());
    }

    private PedidoRequest pedidoRequest(LocalDateTime entrega, String productoId, int cantidad) {
        PedidoRequest request = new PedidoRequest();
        request.setFechaEntregaSolicitada(entrega);
        DetallePedidoRequest detalle = new DetallePedidoRequest();
        detalle.setProductoId(productoId);
        detalle.setCantidad(cantidad);
        request.setDetalles(List.of(detalle));
        return request;
    }
}
