package cafeteria.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalTime;

@Document(collection = "horarios_cafeteria")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HorarioCafeteria {

    @Id
    private String id;

    @Indexed(unique = true)
    private String diaSemana;

    private LocalTime horaApertura;
    private LocalTime horaCierre;
}
