package cafeteria.controller;

import cafeteria.dto.PedidoResponse;
import cafeteria.entity.Pedido;
import cafeteria.kitchen.CocinaCola;
import cafeteria.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cocina")
@RequiredArgsConstructor
public class CocinaController {

    private final PedidoService pedidoService;

    @GetMapping("/siguiente")
    public ResponseEntity<PedidoResponse> siguienteFifo() {
        return ResponseEntity.ok(pedidoService.siguienteFifo());
    }

    @GetMapping("/prioridad")
    public ResponseEntity<PedidoResponse> siguientePorEntrega() {
        return ResponseEntity.ok(pedidoService.siguientePorEntrega());
    }

    /**
     * Desapila (POP) la última acción registrada en la PILA de historial
     * y revierte el estado del pedido.
     */
    @PostMapping("/deshacer")
    public ResponseEntity<PedidoResponse> deshacer() {
        return ResponseEntity.ok(pedidoService.deshacerUltimoCambio());
    }

    @GetMapping("/estado")
    public ResponseEntity<Map<String, Integer>> estado() {
        return ResponseEntity.ok(pedidoService.estadoCocina());
    }

    @GetMapping("/bitacora")
    public ResponseEntity<List<String>> bitacora() {
        return ResponseEntity.ok(pedidoService.bitacoraCocina());
    }

    // ===============================================
    // ENDPOINTS PARA ESTRUCTURA PILA (STACK)
    // ===============================================

    /**
     * Consulta los elementos contenidos en la PILA de transiciones de cocina (orden LIFO).
     */
    @GetMapping("/pila/historial")
    public ResponseEntity<List<CocinaCola.CambioEstado>> consultarPilaHistorial() {
        return ResponseEntity.ok(pedidoService.obtenerHistorialPila());
    }

    /**
     * Consulta el elemento en la CIMA de la PILA de historial (operación PEEK) sin removerlo.
     */
    @GetMapping("/pila/cima")
    public ResponseEntity<CocinaCola.CambioEstado> consultarCimaPila() {
        return ResponseEntity.ok(pedidoService.obtenerCimaHistorialPila());
    }

    /**
     * Consulta las órdenes recién llegadas apiladas en la PILA de órdenes recientes.
     */
    @GetMapping("/pila/recientes")
    public ResponseEntity<List<Pedido>> consultarOrdenesRecientesPila() {
        return ResponseEntity.ok(pedidoService.obtenerOrdenesRecientesPila());
    }

    // ===============================================
    // ENDPOINTS PARA RECURSIVIDAD EN COCINA
    // ===============================================

    /**
     * Calcula RECURSIVAMENTE el tiempo estimado total de preparación
     * de los pedidos pendientes en la cola de cocina.
     */
    @GetMapping("/tiempo-espera-recursivo")
    public ResponseEntity<Map<String, Object>> calcularTiempoEsperaRecursivo() {
        return ResponseEntity.ok(pedidoService.tiempoEstimadoCocinaRecursivo());
    }
}
