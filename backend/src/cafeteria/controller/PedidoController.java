package cafeteria.controller;

import cafeteria.dto.PedidoRequest;
import cafeteria.dto.PedidoResponse;
import cafeteria.entity.PedidoEstado;
import cafeteria.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping("/pedidos/{usuarioId}")
    public ResponseEntity<PedidoResponse> crearPedido(
            @PathVariable String usuarioId,
            @Valid @RequestBody PedidoRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.crearPedido(usuarioId, request));
    }

    @GetMapping("/pedidos/{id}")
    public ResponseEntity<PedidoResponse> obtenerPedido(@PathVariable String id) {
        return ResponseEntity.ok(pedidoService.consultarPedido(id));
    }

    @GetMapping("/usuarios/{usuarioId}/pedidos")
    public ResponseEntity<List<PedidoResponse>> obtenerPedidosUsuario(@PathVariable String usuarioId) {
        return ResponseEntity.ok(pedidoService.consultarPedidosUsuario(usuarioId));
    }

    @PatchMapping("/pedidos/{id}/estado")
    public ResponseEntity<PedidoResponse> cambiarEstado(
            @PathVariable String id,
            @RequestParam PedidoEstado estado
    ) {
        return ResponseEntity.ok(pedidoService.cambiarEstado(id, estado));
    }

    @PatchMapping("/pedidos/{id}/cancelar")
    public ResponseEntity<PedidoResponse> cancelarPedido(@PathVariable String id) {
        return ResponseEntity.ok(pedidoService.cancelarPedido(id));
    }
}
