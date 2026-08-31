package cafeteria.repository;

import cafeteria.entity.Producto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProductoRepository extends MongoRepository<Producto, String> {
    List<Producto> findByActivoTrueOrderByNombreAsc();
    List<Producto> findByCategoriaIdAndActivoTrue(String categoriaId);
}
