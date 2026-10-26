
package com.services.management.controller;

import com.services.management.dto.CreateServiceRequestDto;
import com.services.management.dto.ServiceRequestResponse;
import com.services.management.dto.UpdateRequestStatusDto;
import com.services.management.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ServiceRequestController {

    private final ServiceRequestService service;

    public ServiceRequestController(ServiceRequestService service) {
        this.service = service;
    }
    // for creating a new service request, we need the serviceId and the request body containing the message
    @PostMapping("/services/{serviceId}/requests")
    public ServiceRequestResponse create(
            @PathVariable Long serviceId,
            @Valid @RequestBody CreateServiceRequestDto request) {
        return service.create(serviceId, request);
    }
    // for getting all requests for a specific requester, we need the userId
    @GetMapping("/users/{userId}/requests")
    public List<ServiceRequestResponse> getForRequester(
            @PathVariable Long userId) {
        return service.getForRequester(userId);
    }
    // for getting all requests for a specific provider, we need the providerId
    @GetMapping("/providers/{providerId}/requests")
    public List<ServiceRequestResponse> getForProvider(
            @PathVariable Long providerId) {
        return service.getForProvider(providerId);
    }


    @PatchMapping("/requests/{requestId}/confirm")
    public ServiceRequestResponse confirmByRequester(
            @PathVariable Long requestId) {
        return service.confirmByRequester(requestId);
    }

    @PatchMapping("/requests/{requestId}/status")
    public ServiceRequestResponse updateStatus(
            @PathVariable Long requestId,
            @Valid @RequestBody UpdateRequestStatusDto request) {
        return service.updateStatus(requestId, request);
    }
}
