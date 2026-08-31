package cafeteria.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "mongodb.pool")
public class MongoPoolProperties {
    private int maxSize = 50;
    private int minSize = 5;
    private long maxWaitMs = 10_000;
    private long maxIdleMs = 60_000;
    private long maxLifeMs = 300_000;
    private long connectTimeoutMs = 10_000;
    private long socketTimeoutMs = 15_000;
}
