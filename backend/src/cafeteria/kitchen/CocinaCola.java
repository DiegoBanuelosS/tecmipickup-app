package cafeteria.kitchen;

import cafeteria.entity.Pedido;
import cafeteria.entity.PedidoEstado;
import cafeteria.exception.ApiException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Queue;

/**
 * Cola de cocina en memoria: HashMap, Queue FIFO, PriorityQueue y Stack (Deque).
 */
@Component
public class CocinaCola {

    private final Map<String, Pedido> indice = new HashMap<>();
    private final Queue<String> fifo = new ArrayDeque<>();
    private final PriorityQueue<PedidoPrioridad> porEntrega = new PriorityQueue<>();
    private final Deque<CambioEstado> historial = new ArrayDeque<>();
    private final List<String> bitacora = new ArrayList<>();

    public synchronized void registrar(Pedido pedido) {
        indice.put(pedido.getId(), pedido);
        fifo.offer(pedido.getId());
        porEntrega.offer(new PedidoPrioridad(
                pedido.getId(),
                pedido.getFechaEntregaSolicitada(),
                pedido.getFechaCreacion()
        ));
        bitacora.add("ENTRA " + pedido.getId());
    }

    public synchronized void actualizar(Pedido pedido) {
        indice.put(pedido.getId(), pedido);
        bitacora.add("ACTUALIZA " + pedido.getId() + " -> " + pedido.getEstado());
    }

    public synchronized void registrarCambio(String pedidoId, PedidoEstado anterior, PedidoEstado nuevo) {
        historial.push(new CambioEstado(pedidoId, anterior, nuevo));
    }

    public synchronized CambioEstado deshacer() {
        if (historial.isEmpty()) {
            throw ApiException.notFound("No hay cambios para deshacer.");
        }
        return historial.pop();
    }

    public synchronized Pedido siguienteFifo() {
        while (!fifo.isEmpty()) {
            String id = fifo.poll();
            Pedido pedido = indice.get(id);
            if (pedido != null && pedido.getEstado() == PedidoEstado.PENDIENTE) {
                return pedido;
            }
        }
        return null;
    }

    public synchronized Pedido siguientePorEntrega() {
        while (!porEntrega.isEmpty()) {
            PedidoPrioridad prioridad = porEntrega.peek();
            Pedido pedido = indice.get(prioridad.pedidoId());
            if (pedido == null || pedido.getEstado() == PedidoEstado.CANCELADO
                    || pedido.getEstado() == PedidoEstado.ENTREGADO) {
                porEntrega.poll();
                continue;
            }
            return pedido;
        }
        return null;
    }

    public synchronized List<String> idsFifo() {
        return List.copyOf(fifo);
    }

    public synchronized Map<String, Integer> tamanos() {
        Map<String, Integer> out = new HashMap<>();
        out.put("hashMap", indice.size());
        out.put("queue", fifo.size());
        out.put("priorityQueue", porEntrega.size());
        out.put("stack", historial.size());
        out.put("list", bitacora.size());
        return out;
    }

    public synchronized List<String> bitacora() {
        return List.copyOf(bitacora);
    }

    public record PedidoPrioridad(String pedidoId, LocalDateTime entrega, LocalDateTime creado)
            implements Comparable<PedidoPrioridad> {
        @Override
        public int compareTo(PedidoPrioridad other) {
            int byEntrega = entrega.compareTo(other.entrega);
            return byEntrega != 0 ? byEntrega : creado.compareTo(other.creado);
        }
    }

    public record CambioEstado(String pedidoId, PedidoEstado anterior, PedidoEstado nuevo) {
    }
}
