package cafeteria.repository;

import cafeteria.entity.CategoriaProducto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CategoriaProductoRepository extends MongoRepository<CategoriaProducto, String> {
    Optional<CategoriaProducto> findByNombre(String nombre);
}
