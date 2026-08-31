package cafeteria.config;

import cafeteria.entity.CategoriaProducto;
import cafeteria.entity.HorarioCafeteria;
import cafeteria.entity.Producto;
import cafeteria.repository.CategoriaProductoRepository;
import cafeteria.repository.HorarioCafeteriaRepository;
import cafeteria.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogoSeeder implements CommandLineRunner {

    private final CategoriaProductoRepository categoriaProductoRepository;
    private final ProductoRepository productoRepository;
    private final HorarioCafeteriaRepository horarioCafeteriaRepository;

    @Override
    public void run(String... args) {
        if (horarioCafeteriaRepository.count() == 0) {
            for (DayOfWeek dia : DayOfWeek.values()) {
                boolean fin = dia == DayOfWeek.SATURDAY || dia == DayOfWeek.SUNDAY;
                horarioCafeteriaRepository.save(HorarioCafeteria.builder()
                        .diaSemana(dia.name())
                        .horaApertura(fin ? LocalTime.of(9, 0) : LocalTime.of(8, 0))
                        .horaCierre(fin ? LocalTime.of(18, 0) : LocalTime.of(20, 0))
                        .build());
            }
            log.info("Horarios de cafetería inicializados.");
        }

        if (categoriaProductoRepository.count() > 0) {
            return;
        }

        CategoriaProducto bebidas = categoriaProductoRepository.save(
                CategoriaProducto.builder().nombre("Bebidas").build());
        CategoriaProducto comida = categoriaProductoRepository.save(
                CategoriaProducto.builder().nombre("Comida").build());

        productoRepository.save(Producto.builder()
                .nombre("Café americano")
                .descripcion("Café de grano")
                .precio(new BigDecimal("35.00"))
                .stock(40)
                .activo(true)
                .categoriaId(bebidas.getId())
                .categoriaNombre(bebidas.getNombre())
                .build());
        productoRepository.save(Producto.builder()
                .nombre("Taco sencillo")
                .descripcion("Taco de guisado")
                .precio(new BigDecimal("50.00"))
                .stock(25)
                .activo(true)
                .categoriaId(comida.getId())
                .categoriaNombre(comida.getNombre())
                .build());
        log.info("Catálogo de ejemplo inicializado.");
    }
}
