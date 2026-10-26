
package com.services.management.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record CreateServiceReviewDto(
        @Min(1) @Max(5)
        int rating,

        @Size(max = 1000)
        String comment
) {}
