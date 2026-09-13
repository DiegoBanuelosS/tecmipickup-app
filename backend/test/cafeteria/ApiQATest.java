package cafeteria;

import cafeteria.controller.*;
import cafeteria.dto.*;
import cafeteria.entity.*;
import cafeteria.exception.ApiException;
import cafeteria.exception.GlobalExceptionHandler;
import cafeteria.kitchen.CocinaCola;
import cafeteria.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class ApiQATest {

    @Mock
    private AuthService authService;
    @Mock
    private CatalogoService catalogoService;
    @Mock
    private HorarioService horarioService;
    @Mock
    private PedidoService pedidoService;

    @InjectMocks
    private AuthController authController;
    @InjectMocks
    private CatalogoController catalogoController;
    @InjectMocks
    private HorarioController horarioController;
    @InjectMocks
    private PedidoController pedidoController;
    @InjectMocks
    private CocinaController cocinaController;

    private MockMvc mockMvcAuth;
    private MockMvc mockMvcCatalogo;
    private MockMvc mockMvcHorario;
    private MockMvc mockMvcPedido;
    private MockMvc mockMvcCocina;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

        mockMvcAuth = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(exceptionHandler)
                .build();

        mockMvcCatalogo = MockMvcBuilders.standaloneSetup(catalogoController)
                .setControllerAdvice(exceptionHandler)
                .build();

        mockMvcHorario = MockMvcBuilders.standaloneSetup(horarioController)
                .setControllerAdvice(exceptionHandler)
                .build();

        mockMvcPedido = MockMvcBuilders.standaloneSetup(pedidoController)
                .setControllerAdvice(exceptionHandler)
                .build();

        mockMvcCocina = MockMvcBuilders.standaloneSetup(cocinaController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("TC-01: Registro exitoso de usuario (POST /api/auth/register)")
    void tc01_registroUsuarioExitoso() throws Exception {
        RegistroUsuarioRequest request = new RegistroUsuarioRequest();
        request.setNombre("Carlos Mendoza");
        request.setEmail("carlos.mendoza@tec.mx");
        request.setPassword("PasswordSeguro123!");
        request.setMatricula("A01234567");

        AuthResponse response = AuthResponse.builder()
                .id("usr_001")
                .token("jwt.mock.token.tc01")
                .email("carlos.mendoza@tec.mx")
                .nombre("Carlos Mendoza")
                .role("CLIENT")
                .build();

        when(authService.registrar(any(RegistroUsuarioRequest.class))).thenReturn(response);

        mockMvcAuth.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("usr_001"))
                .andExpect(jsonPath("$.email").value("carlos.mendoza@tec.mx"))
                .andExpect(jsonPath("$.token").value("jwt.mock.token.tc01"))
                .andExpect(jsonPath("$.role").value("CLIENT"));

        verify(authService, times(1)).registrar(any(RegistroUsuarioRequest.class));
    }

    @Test
    @DisplayName("TC-02: Inicio de sesión y generación de token JWT (POST /api/auth/login)")
    void tc02_loginExitoso() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("carlos.mendoza@tec.mx");
        request.setPassword("PasswordSeguro123!");

        AuthResponse response = AuthResponse.builder()
                .id("usr_001")
                .token("jwt.valid.session.token")
                .email("carlos.mendoza@tec.mx")
                .nombre("Carlos Mendoza")
                .role("CLIENT")
                .build();

        when(authService.login(any(AuthRequest.class))).thenReturn(response);

        mockMvcAuth.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("usr_001"))
                .andExpect(jsonPath("$.token").value("jwt.valid.session.token"))
                .andExpect(jsonPath("$.email").value("carlos.mendoza@tec.mx"));

        verify(authService, times(1)).login(any(AuthRequest.class));
    }

    @Test
    @DisplayName("TC-03: Consulta de catálogo home con cabecera Cache-Control (GET /api/home)")
    void tc03_consultarHomeCatalogo() throws Exception {
        CategoriaProducto cat1 = CategoriaProducto.builder().id("cat_bebidas").nombre("Bebidas").build();
        ProductoResponse prod1 = ProductoResponse.builder()
                .id("p1")
                .nombre("Café Americano")
                .precio(new BigDecimal("35.00"))
                .stock(20)
                .categoria("Bebidas")
                .activo(true)
                .build();

        when(catalogoService.listarCategorias()).thenReturn(List.of(cat1));
        when(catalogoService.listarProductos()).thenReturn(List.of(prod1));

        mockMvcCatalogo.perform(get("/api/home"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("max-age=30")))
                .andExpect(jsonPath("$.categorias", hasSize(1)))
                .andExpect(jsonPath("$.categorias[0].nombre").value("Bebidas"))
                .andExpect(jsonPath("$.productos", hasSize(1)))
                .andExpect(jsonPath("$.productos[0].nombre").value("Café Americano"));
    }

    @Test
    @DisplayName("TC-04: Filtrado de productos por categoría existente (GET /api/productos/categoria/{categoriaId})")
    void tc04_productosPorCategoria() throws Exception {
        ProductoResponse sandwich = ProductoResponse.builder()
                .id("p2")
                .nombre("Sandwich Gourmet")
                .precio(new BigDecimal("65.00"))
                .stock(15)
                .categoria("Comida")
                .activo(true)
                .build();

        when(catalogoService.listarPorCategoria("cat_comida")).thenReturn(List.of(sandwich));

        mockMvcCatalogo.perform(get("/api/productos/categoria/cat_comida"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Sandwich Gourmet"))
                .andExpect(jsonPath("$[0].precio").value(65.00));
    }

    @Test
    @DisplayName("TC-05: Consulta de horarios de operación con caché HTTP de 5 min (GET /api/horarios)")
    void tc05_consultarHorarios() throws Exception {
        HorarioCafeteria horario = HorarioCafeteria.builder()
                .id("h1")
                .diaSemana(DayOfWeek.MONDAY.name())
                .horaApertura(LocalTime.of(8, 0))
                .horaCierre(LocalTime.of(20, 0))
                .build();

        when(horarioService.listar()).thenReturn(List.of(horario));

        mockMvcHorario.perform(get("/api/horarios"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("max-age=300")))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].diaSemana").value("MONDAY"));
    }

    @Test
    @DisplayName("TC-06: Creación de pedido válido con anticipación >= 2 horas (POST /api/pedidos/{usuarioId})")
    void tc06_crearPedidoValido() throws Exception {
        LocalDateTime fechaFutura = LocalDateTime.now().plusHours(3);

        DetallePedidoRequest detalle = new DetallePedidoRequest();
        detalle.setProductoId("p1");
        detalle.setCantidad(2);

        PedidoRequest request = new PedidoRequest();
        request.setFechaEntregaSolicitada(fechaFutura);
        request.setDetalles(List.of(detalle));

        PedidoResponse response = PedidoResponse.builder()
                .id("ped_100")
                .usuarioId("usr_001")
                .usuarioNombre("Carlos Mendoza")
                .estado(PedidoEstado.PENDIENTE)
                .total(new BigDecimal("70.00"))
                .fechaEntregaSolicitada(fechaFutura)
                .build();

        when(pedidoService.crearPedido(eq("usr_001"), any(PedidoRequest.class))).thenReturn(response);

        mockMvcPedido.perform(post("/api/pedidos/usr_001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("ped_100"))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.total").value(70.00));
    }

    @Test
    @DisplayName("TC-07: Rechazo de pedido con anticipación < 2 horas (POST /api/pedidos/{usuarioId})")
    void tc07_rechazoPedidoAnticipacionInsuficiente() throws Exception {
        LocalDateTime entregaInvalida = LocalDateTime.now().plusMinutes(30);

        DetallePedidoRequest detalle = new DetallePedidoRequest();
        detalle.setProductoId("p1");
        detalle.setCantidad(1);

        PedidoRequest request = new PedidoRequest();
        request.setFechaEntregaSolicitada(entregaInvalida);
        request.setDetalles(List.of(detalle));

        when(pedidoService.crearPedido(eq("usr_001"), any(PedidoRequest.class)))
                .thenThrow(new ApiException("El pedido debe agendarse con al menos 2 horas de anticipación."));

        mockMvcPedido.perform(post("/api/pedidos/usr_001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(containsString("al menos 2 horas de anticipación")));
    }

    @Test
    @DisplayName("TC-08: Cancelación de pedido pendiente y liberación de stock (PATCH /api/pedidos/{id}/cancelar)")
    void tc08_cancelarPedido() throws Exception {
        PedidoResponse response = PedidoResponse.builder()
                .id("ped_100")
                .usuarioId("usr_001")
                .estado(PedidoEstado.CANCELADO)
                .total(new BigDecimal("70.00"))
                .build();

        when(pedidoService.cancelarPedido("ped_100")).thenReturn(response);

        mockMvcPedido.perform(patch("/api/pedidos/ped_100/cancelar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ped_100"))
                .andExpect(jsonPath("$.estado").value("CANCELADO"));

        verify(pedidoService, times(1)).cancelarPedido("ped_100");
    }

    @Test
    @DisplayName("TC-09: Despacho de orden de cocina mediante cola FIFO (GET /api/cocina/siguiente)")
    void tc09_cocinaSiguienteFifo() throws Exception {
        PedidoResponse response = PedidoResponse.builder()
                .id("ped_100")
                .usuarioNombre("Carlos Mendoza")
                .estado(PedidoEstado.PENDIENTE)
                .total(new BigDecimal("70.00"))
                .build();

        when(pedidoService.siguienteFifo()).thenReturn(response);

        mockMvcCocina.perform(get("/api/cocina/siguiente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ped_100"))
                .andExpect(jsonPath("$.usuarioNombre").value("Carlos Mendoza"));

        verify(pedidoService, times(1)).siguienteFifo();
    }

    @Test
    @DisplayName("TC-10: Monitoreo de estado de cocina y reversión de cambio (GET /api/cocina/estado & POST /api/cocina/deshacer)")
    void tc10_cocinaEstadoYDeshacer() throws Exception {
        Map<String, Integer> metricasCocina = Map.of(
                "fifo", 3,
                "prioridad", 2,
                "historial", 5
        );

        when(pedidoService.estadoCocina()).thenReturn(metricasCocina);

        mockMvcCocina.perform(get("/api/cocina/estado"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fifo").value(3))
                .andExpect(jsonPath("$.prioridad").value(2))
                .andExpect(jsonPath("$.historial").value(5));

        PedidoResponse revertido = PedidoResponse.builder()
                .id("ped_100")
                .estado(PedidoEstado.EN_PREPARACION)
                .build();

        when(pedidoService.deshacerUltimoCambio()).thenReturn(revertido);

        mockMvcCocina.perform(post("/api/cocina/deshacer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ped_100"))
                .andExpect(jsonPath("$.estado").value("EN_PREPARACION"));

        verify(pedidoService, times(1)).estadoCocina();
        verify(pedidoService, times(1)).deshacerUltimoCambio();
    }
}
