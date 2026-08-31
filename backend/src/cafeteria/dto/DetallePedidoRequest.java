package cafeteria.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DetallePedidoRequest {

    @NotBlank
    private String productoId;

    @NotNull
    @Min(1)
    private Integer cantidad;
}
