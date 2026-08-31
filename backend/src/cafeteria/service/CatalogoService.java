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
