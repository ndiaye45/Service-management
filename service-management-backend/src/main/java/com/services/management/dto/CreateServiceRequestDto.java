
package com.services.management.dto;

import jakarta.validation.constraints.Size;

public record CreateServiceRequestDto(
        @Size(max = 1000) String message
) {}
