
package com.services.management.dto;

import com.services.management.enums.RequestStatus;
import java.time.LocalDateTime;

public record ServiceRequestResponse(
        Long id,
        Long serviceId,
        String serviceTitle,
        Long requesterId,
        String requesterName,
        Long providerId,
        RequestStatus status,
        boolean confirmedByRequester,
        String message,
        LocalDateTime createdAt
) {}
