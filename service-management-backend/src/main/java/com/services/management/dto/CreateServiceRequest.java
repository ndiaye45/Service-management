
package com.services.management.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateServiceRequest(
        @NotBlank
        @Size(max = 120)
        String title,

        @NotBlank
        @Size(max = 2000)
        String description,

        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 8, fraction = 2)
        BigDecimal price,

        @NotBlank
        @Size(max = 80)
        String category
) {}
