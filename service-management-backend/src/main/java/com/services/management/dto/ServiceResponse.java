
package com.services.management.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ServiceResponse(
        Long id,
        String title,
        String description,
        BigDecimal price,
        String category,
        Long providerId,
        String providerName,
        LocalDateTime createdAt
) {}
