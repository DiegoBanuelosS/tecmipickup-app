package cafeteria.repository;

import cafeteria.entity.HorarioCafeteria;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface HorarioCafeteriaRepository extends MongoRepository<HorarioCafeteria, String> {
    Optional<HorarioCafeteria> findByDiaSemana(String diaSemana);
}
