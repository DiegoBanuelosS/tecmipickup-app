package cafeteria.structure;

import cafeteria.exception.ApiException;

import java.util.ArrayList;
import java.util.List;

/**
 * Estructura de datos genérica Pila (Stack - LIFO: Last In, First Out).
 * Implementada con nodos enlazados propios y operaciones fundamentales
 * (apilar, desapilar, verCima, estaVacia, getTamanio)
 * complementada con recorrido recursivo de sus elementos.
 *
 * @param <T> Tipo de dato almacenado en la pila.
 */
public class Pila<T> {

    /**
     * Nodo interno para la estructura enlazada de la pila.
     */
    private static class Nodo<E> {
        private final E dato;
        private final Nodo<E> siguiente;

        public Nodo(E dato, Nodo<E> siguiente) {
            this.dato = dato;
            this.siguiente = siguiente;
        }
    }

    private Nodo<T> cima;
    private int tamanio;

    public Pila() {
        this.cima = null;
        this.tamanio = 0;
    }

    /**
     * Operación PUSH (apilar): Inserta un elemento en la cima de la pila.
     * Complejidad: O(1).
     *
     * @param elemento Elemento a apilar.
     */
    public synchronized void apilar(T elemento) {
        if (elemento == null) {
            throw new IllegalArgumentException("No se puede apilar un elemento nulo.");
        }
        this.cima = new Nodo<>(elemento, this.cima);
        this.tamanio++;
    }

    /**
     * Operación POP (desapilar): Extrae y retorna el elemento en la cima de la pila.
     * Complejidad: O(1).
     *
     * @return El elemento desapilado.
     * @throws ApiException Si la pila está vacía.
     */
    public synchronized T desapilar() {
        if (estaVacia()) {
            throw ApiException.notFound("La pila está vacía. No hay elementos para desapilar.");
        }
        T dato = this.cima.dato;
        this.cima = this.cima.siguiente;
        this.tamanio--;
        return dato;
    }

    /**
     * Operación PEEK (ver cima): Retorna el elemento en la cima sin removerlo.
     * Complejidad: O(1).
     *
     * @return Elemento en la cima de la pila.
     * @throws ApiException Si la pila está vacía.
     */
    public synchronized T verCima() {
        if (estaVacia()) {
            throw ApiException.notFound("La pila está vacía.");
        }
        return this.cima.dato;
    }

    /**
     * Comprueba si la pila no contiene elementos.
     *
     * @return true si la pila está vacía, false en caso contrario.
     */
    public synchronized boolean estaVacia() {
        return this.cima == null;
    }

    /**
     * Retorna la cantidad de elementos almacenados en la pila.
     *
     * @return Tamaño de la pila.
     */
    public synchronized int getTamanio() {
        return this.tamanio;
    }

    /**
     * Vacía completamente la pila.
     */
    public synchronized void limpiar() {
        this.cima = null;
        this.tamanio = 0;
    }

    /**
     * Recorre y convierte los elementos de la pila a una lista en orden LIFO
     * empleando un algoritmo RECURSIVO.
     *
     * @return Lista de elementos en orden de la cima hacia el fondo.
     */
    public synchronized List<T> listarRecursivo() {
        List<T> resultado = new ArrayList<>();
        recorrerNodosRecursivo(this.cima, resultado);
        return resultado;
    }

    /**
     * Función recursiva auxiliar para recorrer los nodos de la pila.
     * - Caso Base: Si el nodo actual es null, retorna sin hacer nada.
     * - Caso Recursivo: Agrega el dato actual y se invoca a sí misma con el nodo siguiente.
     *
     * @param nodoActual Nodo actual evaluado en la pila.
     * @param acumulador Lista donde se acumulan los elementos en orden.
     */
    private void recorrerNodosRecursivo(Nodo<T> nodoActual, List<T> acumulador) {
        // CASO BASE: Fondo de la pila alcanzado
        if (nodoActual == null) {
            return;
        }

        // Procesamiento del nodo actual (LIFO)
        acumulador.add(nodoActual.dato);

        // PASO RECURSIVO: avanzar hacia el siguiente nodo
        recorrerNodosRecursivo(nodoActual.siguiente, acumulador);
    }
}
