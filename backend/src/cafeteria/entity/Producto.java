package cafeteria.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(collection = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {

    @Id
    private String id;

    private String nombre;

    private String descripcion;

    private BigDecimal precio;

    private Integer stock;

    @Builder.Default
    private Boolean activo = true;

    @Indexed
    private String categoriaId;

    private String categoriaNombre;
}
