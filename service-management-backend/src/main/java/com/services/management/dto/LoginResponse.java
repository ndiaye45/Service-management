
package com.services.management.dto;

public record LoginResponse(
        String token,
        String tokenType,
        UserResponse user
) {}
