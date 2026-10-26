
package com.services.management.controller;

import com.services.management.dto.CreateUserRequest;
import com.services.management.dto.LoginRequest;
import com.services.management.dto.LoginResponse;
import com.services.management.dto.UserResponse;
import com.services.management.entity.AppUser;
import com.services.management.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/api/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(
            @Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @GetMapping("/api/users/{id}")
    public UserResponse getById(@PathVariable Long id) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        AppUser currentUser = (AppUser) authentication.getPrincipal();

        if (!currentUser.getId().equals(id)) {
            throw new AccessDeniedException(
                    "Vous ne pouvez consulter que votre propre profil."
            );
        }

        return userService.getById(id);
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }
}
