package cafeteria.service;

import cafeteria.config.CacheConfig;
import cafeteria.dto.ProductoResponse;
import cafeteria.entity.CategoriaProducto;
import cafeteria.entity.Producto;
import cafeteria.exception.ApiException;
import cafeteria.repository.CategoriaProductoRepository;
import cafeteria.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CatalogoService {

    private final ProductoRepository productoRepository;
    private final CategoriaProductoRepository categoriaProductoRepository;

    @Cacheable(cacheNames = CacheConfig.PRODUCTOS)
    public List<ProductoResponse> listarProductos() {
        return productoRepository.findByActivoTrueOrderByNombreAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Cacheable(cacheNames = CacheConfig.PRODUCTOS_CATEGORIA, key = "#categoriaId")
    public List<ProductoResponse> listarPorCategoria(String categoriaId) {
        if (!categoriaProductoRepository.existsById(categoriaId)) {
            throw ApiException.notFound("Categoría no encontrada.");
        }
        return productoRepository.findByCategoriaIdAndActivoTrue(categoriaId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Cacheable(cacheNames = CacheConfig.CATEGORIAS)
    public List<CategoriaProducto> listarCategorias() {
        return categoriaProductoRepository.findAll();
    }

    /**
     * Búsqueda por nombre utilizando el algoritmo de BÚSQUEDA BINARIA RECURSIVA.
     * Aprovecha que el catálogo viene ordenado por nombre ascendente.
     * Complejidad: O(log n).
     *
     * @param nombre Nombre del producto a buscar.
     * @return ProductoResponse encontrado.
     */
    public ProductoResponse buscarPorNombreRecursivo(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new ApiException("El parámetro 'nombre' es obligatorio para la búsqueda.");
        }
        List<ProductoResponse> productos = listarProductos();
        return buscarBinarioRecursivo(productos, nombre.trim(), 0, productos.size() - 1)
                .orElseThrow(() -> ApiException.notFound("Producto no encontrado mediante búsqueda recursiva: " + nombre));
    }

    /**
     * Función RECURSIVA auxiliar de Búsqueda Binaria.
     *
     * @param lista Lista ordenada de productos.
     * @param buscado Nombre del producto a localizar.
     * @param inicio Límite inferior del rango de búsqueda.
     * @param fin Límite superior del rango de búsqueda.
     * @return Optional con el producto si existe, o empty si no.
     */
    public Optional<ProductoResponse> buscarBinarioRecursivo(List<ProductoResponse> lista, String buscado, int inicio, int fin) {
        // CASO BASE 1: Rango inválido (elemento no existe en la lista)
        if (inicio > fin || lista == null || lista.isEmpty()) {
            return Optional.empty();
        }

        int medio = inicio + (fin - inicio) / 2;
        ProductoResponse actual = lista.get(medio);
        int comparacion = actual.getNombre().compareToIgnoreCase(buscado);

        // CASO BASE 2: Coincidencia exacta encontrada en la posición central
        if (comparacion == 0) {
            return Optional.of(actual);
        }

        // PASO RECURSIVO 1: Si el elemento buscado es menor, descartar mitad derecha
        if (comparacion > 0) {
            return buscarBinarioRecursivo(lista, buscado, inicio, medio - 1);
        }

        // PASO RECURSIVO 2: Si el elemento buscado es mayor, descartar mitad izquierda
        return buscarBinarioRecursivo(lista, buscado, medio + 1, fin);
    }

    private ProductoResponse toResponse(Producto producto) {
        return ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .categoria(producto.getCategoriaNombre())
                .activo(producto.getActivo())
                .build();
    }
}
