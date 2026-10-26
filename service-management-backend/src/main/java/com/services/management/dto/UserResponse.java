
package com.services.management.dto;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        LocalDateTime createdAt
) {}
