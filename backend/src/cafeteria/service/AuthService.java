package cafeteria.service;

import cafeteria.dto.AuthRequest;
import cafeteria.dto.AuthResponse;
import cafeteria.dto.RegistroUsuarioRequest;
import cafeteria.entity.Role;
import cafeteria.entity.Usuario;
import cafeteria.exception.ApiException;
import cafeteria.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse registrar(RegistroUsuarioRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("Ya existe un usuario registrado con ese correo.");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CLIENT)
                .matricula(request.getMatricula())
                .build();

        usuario = usuarioRepository.save(usuario);
        String token = jwtService.generateToken(usuario.getEmail(), usuario.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .role(usuario.getRole().name())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> ApiException.unauthorized("Credenciales inválidas."));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw ApiException.unauthorized("Credenciales inválidas.");
        }

        String token = jwtService.generateToken(usuario.getEmail(), usuario.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .role(usuario.getRole().name())
                .build();
    }
}
