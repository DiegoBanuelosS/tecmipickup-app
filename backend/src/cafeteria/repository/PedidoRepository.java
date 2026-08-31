package cafeteria.repository;

import cafeteria.entity.Pedido;
import cafeteria.entity.PedidoEstado;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PedidoRepository extends MongoRepository<Pedido, String> {
    List<Pedido> findByUsuarioIdOrderByFechaCreacionDesc(String usuarioId);
    List<Pedido> findByEstadoOrderByFechaCreacionDesc(PedidoEstado estado);
}
