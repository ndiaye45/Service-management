
package com.services.management.dto;

import com.services.management.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRequestStatusDto(
        @NotNull RequestStatus status
) {}
