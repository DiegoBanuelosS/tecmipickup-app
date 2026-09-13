package cafeteria.dto;

import cafeteria.entity.PedidoEstado;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ResumenPedidoRecursivo {
    private String pedidoId;
    private String cliente;
    private PedidoEstado estado;
    private LocalDateTime fechaEntrega;
    private int cantidadTotalArticulosRecursivo;
    private BigDecimal totalCalculadoRecursivo;
    private int tiempoEstimadoPreparacionMinutos;
    private String metodoCalculo;
}
