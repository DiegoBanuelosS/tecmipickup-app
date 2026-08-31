package cafeteria.controller;

import cafeteria.dto.PedidoResponse;
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
}
