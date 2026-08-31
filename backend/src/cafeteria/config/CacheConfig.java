package cafeteria.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfig {

    public static final String PRODUCTOS = "productos";
    public static final String PRODUCTOS_CATEGORIA = "productosPorCategoria";
    public static final String CATEGORIAS = "categorias";
    public static final String HORARIOS = "horarios";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                PRODUCTOS, PRODUCTOS_CATEGORIA, CATEGORIAS, HORARIOS);
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(Duration.ofSeconds(45))
                .recordStats());
        return manager;
    }
}
