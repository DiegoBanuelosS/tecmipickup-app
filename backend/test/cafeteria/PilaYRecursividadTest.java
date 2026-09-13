package cafeteria;

import cafeteria.dto.ProductoResponse;
import cafeteria.entity.DetallePedido;
import cafeteria.entity.Pedido;
import cafeteria.entity.PedidoEstado;
import cafeteria.kitchen.CocinaCola;
import cafeteria.service.CatalogoService;
import cafeteria.service.PedidoService;
import cafeteria.structure.Pila;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class PilaYRecursividadTest {

    @Mock
    private cafeteria.repository.PedidoRepository pedidoRepository;
    @Mock
    private cafeteria.repository.UsuarioRepository usuarioRepository;
    @Mock
    private cafeteria.repository.ProductoRepository productoRepository;
    @Mock
    private cafeteria.service.HorarioService horarioService;
    @Mock
    private CocinaCola cocinaCola;

    @InjectMocks
    private PedidoService pedidoService;

    // ===============================================
    // PRUEBAS DE LA ESTRUCTURA DE DATOS: PILA (STACK)
    // ===============================================

    @Test
    @DisplayName("Pila: Comportamiento LIFO correcto (apilar, desapilar y verCima)")
    void testPilaOperacionesFundamentales() {
        Pila<String> pila = new Pila<>();
        assertTrue(pila.estaVacia());
        assertEquals(0, pila.getTamanio());

        pila.apilar("Primero");
        pila.apilar("Segundo");
        pila.apilar("Tercero");

        assertFalse(pila.estaVacia());
        assertEquals(3, pila.getTamanio());
        assertEquals("Tercero", pila.verCima(), "La cima debe ser el último elemento apilado (LIFO)");

        assertEquals("Tercero", pila.desapilar());
        assertEquals(2, pila.getTamanio());
        assertEquals("Segundo", pila.verCima());

        assertEquals("Segundo", pila.desapilar());
        assertEquals("Primero", pila.desapilar());
        assertTrue(pila.estaVacia());
    }

    @Test
    @DisplayName("Pila: Recorrido RECURSIVO de elementos en orden LIFO")
    void testPilaRecorridoRecursivo() {
        Pila<Integer> pila = new Pila<>();
        pila.apilar(10);
        pila.apilar(20);
        pila.apilar(30);

        List<Integer> listado = pila.listarRecursivo();
        assertEquals(3, listado.size());
        assertEquals(List.of(30, 20, 10), listado, "Debe listar recursivamente desde la cima al fondo");
    }

    @Test
    @DisplayName("Pila: Manejo de errores al desapilar o ver cima en pila vacía")
    void testPilaExcepcionesVacia() {
        Pila<String> pila = new Pila<>();
        assertThrows(RuntimeException.class, pila::desapilar);
        assertThrows(RuntimeException.class, pila::verCima);
    }

    // ===============================================
    // PRUEBAS DE ALGORITMOS RECURSIVOS (RECURSIVIDAD)
    // ===============================================

    @Test
    @DisplayName("Recursividad 1: Cálculo recursivo de costo total de un pedido")
    void testCalculoTotalRecursivo() {
        List<DetallePedido> detalles = List.of(
                DetallePedido.builder()
                        .productoNombre("Café Latte")
                        .precioUnitario(new BigDecimal("45.00"))
                        .cantidad(2)
                        .subtotal(new BigDecimal("90.00"))
                        .build(),
                DetallePedido.builder()
                        .productoNombre("Sandwich Clásico")
                        .precioUnitario(new BigDecimal("60.00"))
                        .cantidad(1)
                        .subtotal(new BigDecimal("60.00"))
                        .build(),
                DetallePedido.builder()
                        .productoNombre("Galleta de Avena")
                        .precioUnitario(new BigDecimal("25.00"))
                        .cantidad(3)
                        .subtotal(new BigDecimal("75.00"))
                        .build()
        );

        BigDecimal total = pedidoService.calcularTotalRecursivo(detalles, 0);
        assertEquals(new BigDecimal("225.00"), total);

        // Caso base lista vacía
        assertEquals(BigDecimal.ZERO, pedidoService.calcularTotalRecursivo(new ArrayList<>(), 0));
        assertEquals(BigDecimal.ZERO, pedidoService.calcularTotalRecursivo(null, 0));
    }

    @Test
    @DisplayName("Recursividad 2: Suma recursiva de cantidad total de artículos")
    void testContarCantidadRecursivo() {
        List<DetallePedido> detalles = List.of(
                DetallePedido.builder().cantidad(2).build(),
                DetallePedido.builder().cantidad(1).build(),
                DetallePedido.builder().cantidad(4).build()
        );

        int totalArticulos = pedidoService.calcularCantidadTotalRecursivo(detalles, 0);
        assertEquals(7, totalArticulos);

        assertEquals(0, pedidoService.calcularCantidadTotalRecursivo(List.of(), 0));
    }

    @Test
    @DisplayName("Recursividad 3: Estimación de tiempo de espera en cola de cocina")
    void testTiempoEsperaColaRecursivo() {
        CocinaCola cocina = new CocinaCola();

        Pedido p1 = Pedido.builder()
                .id("ped1")
                .estado(PedidoEstado.PENDIENTE)
                .detalles(List.of(
                        DetallePedido.builder().cantidad(2).build() // 3 base + 4 items = 7 min
                ))
                .build();

        Pedido p2 = Pedido.builder()
                .id("ped2")
                .estado(PedidoEstado.PENDIENTE)
                .detalles(List.of(
                        DetallePedido.builder().cantidad(1).build(), // 3 base + (3*2) items = 9 min
                        DetallePedido.builder().cantidad(2).build()
                ))
                .build();

        int tiempoTotal = cocina.calcularTiempoEsperaColaRecursivo(List.of(p1, p2), 0);
        // p1: 3 + 2*2 = 7 minutos
        // p2: 3 + 3*2 = 9 minutos
        // total recursivo = 16 minutos
        assertEquals(16, tiempoTotal);
    }

    @Test
    @DisplayName("Recursividad 4: Búsqueda binaria recursiva sobre catálogo")
    void testBusquedaBinariaRecursiva() {
        CatalogoService catalogo = new CatalogoService(null, null);

        List<ProductoResponse> ordenados = List.of(
                ProductoResponse.builder().id("1").nombre("Agua Natural").build(),
                ProductoResponse.builder().id("2").nombre("Café Americano").build(),
                ProductoResponse.builder().id("3").nombre("Capuchino").build(),
                ProductoResponse.builder().id("4").nombre("Donut").build(),
                ProductoResponse.builder().id("5").nombre("Muffin").build(),
                ProductoResponse.builder().id("6").nombre("Sandwich Gourmet").build(),
                ProductoResponse.builder().id("7").nombre("Té Verde").build()
        );

        // Búsqueda exitosa en el medio
        Optional<ProductoResponse> encontrado1 = catalogo.buscarBinarioRecursivo(ordenados, "Donut", 0, ordenados.size() - 1);
        assertTrue(encontrado1.isPresent());
        assertEquals("Donut", encontrado1.get().getNombre());

        // Búsqueda en rama izquierda
        Optional<ProductoResponse> encontrado2 = catalogo.buscarBinarioRecursivo(ordenados, "Agua Natural", 0, ordenados.size() - 1);
        assertTrue(encontrado2.isPresent());
        assertEquals("Agua Natural", encontrado2.get().getNombre());

        // Búsqueda en rama derecha
        Optional<ProductoResponse> encontrado3 = catalogo.buscarBinarioRecursivo(ordenados, "Té Verde", 0, ordenados.size() - 1);
        assertTrue(encontrado3.isPresent());
        assertEquals("Té Verde", encontrado3.get().getNombre());

        // Elemento inexistente
        Optional<ProductoResponse> noExiste = catalogo.buscarBinarioRecursivo(ordenados, "Pizza", 0, ordenados.size() - 1);
        assertFalse(noExiste.isPresent());
    }

    @Test
    @DisplayName("Pila e Integración en CocinaCola: Historial y Órdenes Recientes")
    void testCocinaPilaIntegracion() {
        CocinaCola cocina = new CocinaCola();

        Pedido pedido = Pedido.builder()
                .id("ped_test")
                .estado(PedidoEstado.PENDIENTE)
                .build();

        cocina.registrar(pedido);
        assertEquals(1, cocina.tamanos().get("pilaOrdenesRecientes"));

        cocina.registrarCambio("ped_test", PedidoEstado.PENDIENTE, PedidoEstado.EN_PREPARACION);
        cocina.registrarCambio("ped_test", PedidoEstado.EN_PREPARACION, PedidoEstado.LISTO);

        assertEquals(2, cocina.tamanos().get("pila"));
        assertEquals(PedidoEstado.LISTO, cocina.verCimaHistorial().nuevo());

        CocinaCola.CambioEstado ultimo = cocina.deshacer();
        assertEquals(PedidoEstado.LISTO, ultimo.nuevo());
        assertEquals(PedidoEstado.EN_PREPARACION, ultimo.anterior());
        assertEquals(1, cocina.tamanos().get("pila"));
    }
}
