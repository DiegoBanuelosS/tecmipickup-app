package cafeteria.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableConfigurationProperties(MongoPoolProperties.class)
public class MongoConfig {

    @Bean
    public MongoClient mongoClient(
            @Value("${spring.data.mongodb.uri}") String uri,
            MongoPoolProperties pool
    ) {
        ConnectionString connectionString = new ConnectionString(uri);
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .applyToConnectionPoolSettings(builder -> builder
                        .maxSize(pool.getMaxSize())
                        .minSize(pool.getMinSize())
                        .maxWaitTime(pool.getMaxWaitMs(), TimeUnit.MILLISECONDS)
                        .maxConnectionIdleTime(pool.getMaxIdleMs(), TimeUnit.MILLISECONDS)
                        .maxConnectionLifeTime(pool.getMaxLifeMs(), TimeUnit.MILLISECONDS))
                .applyToSocketSettings(builder -> builder
                        .connectTimeout((int) pool.getConnectTimeoutMs(), TimeUnit.MILLISECONDS)
                        .readTimeout((int) pool.getSocketTimeoutMs(), TimeUnit.MILLISECONDS))
                .applyToServerSettings(builder -> builder
                        .heartbeatFrequency(10, TimeUnit.SECONDS))
                .build();
        return MongoClients.create(settings);
    }
}
