package cafeteria.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {
    private List<String> origins = new ArrayList<>();
    private List<String> patterns = new ArrayList<>();
}
