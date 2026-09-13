package cafeteria.kitchen;

import cafeteria.entity.DetallePedido;
import cafeteria.entity.Pedido;
import cafeteria.entity.PedidoEstado;
import cafeteria.exception.ApiException;
import cafeteria.structure.Pila;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Queue;

/**
 * Cola y gestión de cocina en memoria utilizando estructuras de datos fundamentales:
 * - HashMap (acceso directo por ID)
 * - Queue (cola FIFO de preparación)
 * - PriorityQueue (cola ordenada por hora de entrega solicitada)
 * - Pila (Stack LIFO para deshacer cambios y pedidos recientes)
 * - Algoritmos Recursivos para cálculo de tiempos acumulados y recorrido de ítems.
 */
@Component
public class CocinaCola {

    private final Map<String, Pedido> indice = new HashMap<>();
    private final Queue<String> fifo = new ArrayDeque<>();
    private final PriorityQueue<PedidoPrioridad> porEntrega = new PriorityQueue<>();
    private final Pila<CambioEstado> pilaHistorial = new Pila<>();
    private final Pila<Pedido> pilaOrdenesRecientes = new Pila<>();
    private final List<String> bitacora = new ArrayList<>();

    public synchronized void registrar(Pedido pedido) {
        indice.put(pedido.getId(), pedido);
        fifo.offer(pedido.getId());
        porEntrega.offer(new PedidoPrioridad(
                pedido.getId(),
                pedido.getFechaEntregaSolicitada(),
                pedido.getFechaCreacion()
        ));
        pilaOrdenesRecientes.apilar(pedido);
        bitacora.add("ENTRA " + pedido.getId());
    }

    public synchronized void actualizar(Pedido pedido) {
        indice.put(pedido.getId(), pedido);
        bitacora.add("ACTUALIZA " + pedido.getId() + " -> " + pedido.getEstado());
    }

    /**
     * Registra una transición de estado en la PILA de historial para permitir deshacer (Undo).
     */
    public synchronized void registrarCambio(String pedidoId, PedidoEstado anterior, PedidoEstado nuevo) {
        pilaHistorial.apilar(new CambioEstado(pedidoId, anterior, nuevo));
    }

    /**
     * Desapila la última acción realizada de la PILA para revertir el estado del pedido.
     */
    public synchronized CambioEstado deshacer() {
        if (pilaHistorial.estaVacia()) {
            throw ApiException.notFound("No hay cambios para deshacer en la pila de historial.");
        }
        return pilaHistorial.desapilar();
    }

    /**
     * Consulta la cima de la PILA de historial sin desapilarla.
     */
    public synchronized CambioEstado verCimaHistorial() {
        if (pilaHistorial.estaVacia()) {
            throw ApiException.notFound("La pila de historial está vacía.");
        }
        return pilaHistorial.verCima();
    }

    /**
     * Retorna todos los elementos de la PILA de historial en orden LIFO usando recorrido RECURSIVO.
     */
    public synchronized List<CambioEstado> listarHistorialPila() {
        return pilaHistorial.listarRecursivo();
    }

    /**
     * Retorna las órdenes más recientes apiladas en la PILA en orden LIFO usando RECURSIVIDAD.
     */
    public synchronized List<Pedido> listarOrdenesRecientesPila() {
        return pilaOrdenesRecientes.listarRecursivo();
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

    // ==========================================
    // SECCIÓN DE ALGORITMOS RECURSIVOS EN COCINA
    // ==========================================

    /**
     * Calcula RECURSIVAMENTE el tiempo estimado total de preparación (en minutos)
     * para una lista de pedidos pendientes en cocina.
     * Regla: 3 minutos base por orden + 2 minutos por cada artículo individual.
     *
     * @param pedidos Lista de pedidos a evaluar.
     * @param indice Índice actual en la recursión.
     * @return Tiempo estimado en minutos.
     */
    public int calcularTiempoEsperaColaRecursivo(List<Pedido> pedidos, int indice) {
        // CASO BASE: si la lista es nula o se procesaron todos los pedidos
        if (pedidos == null || indice >= pedidos.size()) {
            return 0;
        }

        Pedido pedidoActual = pedidos.get(indice);
        int totalItemsPedido = contarItemsRecursivo(pedidoActual.getDetalles(), 0);
        int tiempoEstePedido = 3 + (totalItemsPedido * 2);

        // PASO RECURSIVO: tiempo de este pedido + suma recursiva de los restantes
        return tiempoEstePedido + calcularTiempoEsperaColaRecursivo(pedidos, indice + 1);
    }

    /**
     * Cuenta RECURSIVAMENTE la cantidad total de artículos de una lista de detalles.
     *
     * @param detalles Lista de detalles.
     * @param indice Índice de iteración recursiva.
     * @return Cantidad total sumada.
     */
    public int contarItemsRecursivo(List<DetallePedido> detalles, int indice) {
        // CASO BASE: fin de la lista de detalles
        if (detalles == null || indice >= detalles.size()) {
            return 0;
        }

        int cantidadActual = detalles.get(indice).getCantidad();

        // PASO RECURSIVO
        return cantidadActual + contarItemsRecursivo(detalles, indice + 1);
    }

    /**
     * Obtiene recursivamente todos los pedidos activos en cola FIFO.
     */
    public synchronized List<Pedido> obtenerPedidosPendientesCola() {
        List<Pedido> pendientes = new ArrayList<>();
        List<String> ids = List.copyOf(fifo);
        recolectarPedidosRecursivo(ids, 0, pendientes);
        return pendientes;
    }

    private void recolectarPedidosRecursivo(List<String> ids, int posicion, List<Pedido> resultado) {
        // CASO BASE
        if (ids == null || posicion >= ids.size()) {
            return;
        }

        Pedido p = this.indice.get(ids.get(posicion));
        if (p != null && (p.getEstado() == PedidoEstado.PENDIENTE || p.getEstado() == PedidoEstado.EN_PREPARACION)) {
            resultado.add(p);
        }

        // PASO RECURSIVO
        recolectarPedidosRecursivo(ids, posicion + 1, resultado);
    }

    public synchronized Map<String, Integer> tamanos() {
        Map<String, Integer> out = new HashMap<>();
        out.put("hashMap", indice.size());
        out.put("queue", fifo.size());
        out.put("priorityQueue", porEntrega.size());
        out.put("pila", pilaHistorial.getTamanio());
        out.put("stack", pilaHistorial.getTamanio());
        out.put("pilaOrdenesRecientes", pilaOrdenesRecientes.getTamanio());
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
