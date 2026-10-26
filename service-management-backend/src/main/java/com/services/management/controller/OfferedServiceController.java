
package com.services.management.controller;

import com.services.management.dto.CreateServiceRequest;
import com.services.management.dto.ServiceResponse;
import com.services.management.service.OfferedServiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class OfferedServiceController {

    private final OfferedServiceService service;

    public OfferedServiceController(OfferedServiceService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceResponse create(
            @Valid @RequestBody CreateServiceRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<ServiceResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ServiceResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public ServiceResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CreateServiceRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
