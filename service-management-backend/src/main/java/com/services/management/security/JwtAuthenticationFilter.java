
package com.services.management.security;

import com.services.management.entity.AppUser;
import com.services.management.repository.UserRepository;
import com.services.management.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log =
            LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserRepository appUserRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository appUserRepository) {

        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Pas de token : laisser Spring Security décider
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            String email = jwtService.extractUsername(token);
            Long userId = jwtService.extractUserId(token);

            // Ne pas remplacer une authentification déjà établie
            if (SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                AppUser user = appUserRepository.findByEmail(email)
                        .orElseThrow(
                                () -> new JwtException("Utilisateur introuvable")
                        );

                // Vérifier que le token correspond au bon utilisateur
                if (!user.getId().equals(userId)) {
                    throw new JwtException(
                            "Identifiant utilisateur invalide"
                    );
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                Collections.emptyList()
                        );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }

        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
            log.warn("Authentification JWT refusée : {}", e.getMessage());
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            log.error("Erreur pendant l'authentification JWT", e);
        }

        filterChain.doFilter(request, response);
    }
}
