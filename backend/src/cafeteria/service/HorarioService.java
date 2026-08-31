package cafeteria.service;

import cafeteria.config.CacheConfig;
import cafeteria.entity.HorarioCafeteria;
import cafeteria.repository.HorarioCafeteriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HorarioService {

    private final HorarioCafeteriaRepository horarioCafeteriaRepository;

    @Cacheable(cacheNames = CacheConfig.HORARIOS, key = "'all'")
    public List<HorarioCafeteria> listar() {
        return horarioCafeteriaRepository.findAll();
    }

    @Cacheable(cacheNames = CacheConfig.HORARIOS, key = "#diaSemana")
    public Optional<HorarioCafeteria> porDia(String diaSemana) {
        return horarioCafeteriaRepository.findByDiaSemana(diaSemana);
    }
}
