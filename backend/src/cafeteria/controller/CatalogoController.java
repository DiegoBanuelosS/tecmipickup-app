package cafeteria.controller;

import cafeteria.dto.ProductoResponse;
import cafeteria.entity.CategoriaProducto;
import cafeteria.service.CatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService catalogoService;
    private static final CacheControl CATALOGO_CACHE =
            CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic().mustRevalidate();

    @GetMapping("/home")
    public ResponseEntity<Object> home() {
        return ResponseEntity.ok()
                .cacheControl(CATALOGO_CACHE)
                .body(new HomeResponse(
                        catalogoService.listarCategorias(),
                        catalogoService.listarProductos()
                ));
    }

    @GetMapping("/productos")
    public ResponseEntity<List<ProductoResponse>> productos() {
        return ResponseEntity.ok()
                .cacheControl(CATALOGO_CACHE)
                .body(catalogoService.listarProductos());
    }

    @GetMapping("/productos/categoria/{categoriaId}")
    public ResponseEntity<List<ProductoResponse>> productosPorCategoria(@PathVariable String categoriaId) {
        return ResponseEntity.ok()
                .cacheControl(CATALOGO_CACHE)
                .body(catalogoService.listarPorCategoria(categoriaId));
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaProducto>> categorias() {
        return ResponseEntity.ok()
                .cacheControl(CATALOGO_CACHE)
                .body(catalogoService.listarCategorias());
    }

    public record HomeResponse(List<CategoriaProducto> categorias, List<ProductoResponse> productos) {
    }
}
