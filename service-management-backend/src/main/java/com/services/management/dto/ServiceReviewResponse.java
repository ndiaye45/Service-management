
package com.services.management.dto;

import java.time.LocalDateTime;

public record ServiceReviewResponse(
        Long id,
        Long requestId,
        Long providerId,
        int rating,
        String comment,
        LocalDateTime createdAt
) {}
