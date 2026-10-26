
package com.services.management.controller;

import com.services.management.dto.CreateServiceReviewDto;
import com.services.management.dto.ServiceReviewResponse;
import com.services.management.service.ServiceReviewService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ServiceReviewController {

    private final ServiceReviewService reviewService;

    public ServiceReviewController(ServiceReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/requests/{requestId}/reviews")
    public ServiceReviewResponse create(
            @PathVariable Long requestId,
            @Valid @RequestBody CreateServiceReviewDto dto) {
        return reviewService.create(requestId, dto);
    }

    @GetMapping("/providers/{providerId}/reviews")
    public List<ServiceReviewResponse> getForProvider(
            @PathVariable Long providerId) {
        return reviewService.getForProvider(providerId);
    }
}
