package cafeteria.dto;

import cafeteria.entity.PedidoEstado;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoResponse {
    private String id;
    private String usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaEntregaSolicitada;
    private PedidoEstado estado;
    private BigDecimal total;
    private List<DetallePedidoResponse> detalles;
}
