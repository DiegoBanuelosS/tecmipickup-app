package cafeteria.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PedidoRequest {

    @NotNull
    private LocalDateTime fechaEntregaSolicitada;

    @NotEmpty
    @Valid
    private List<DetallePedidoRequest> detalles;
}
