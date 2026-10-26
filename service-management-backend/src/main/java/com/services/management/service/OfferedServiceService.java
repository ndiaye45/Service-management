
package com.services.management.service;

import com.services.management.dto.CreateServiceRequest;
import com.services.management.dto.ServiceResponse;
import com.services.management.entity.AppUser;
import com.services.management.entity.OfferedService;
import com.services.management.repository.OfferedServiceRepository;
import com.services.management.repository.ServiceRequestRepository;
import com.services.management.entity.ServiceRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OfferedServiceService {

    private final OfferedServiceRepository serviceRepository;
    private final ServiceRequestRepository requestRepository;

    public OfferedServiceService(
            OfferedServiceRepository serviceRepository,
            ServiceRequestRepository requestRepository) {
        this.serviceRepository = serviceRepository;
        this.requestRepository = requestRepository;
    }

    @Transactional
    public ServiceResponse create(CreateServiceRequest request) {
        AppUser provider = getCurrentUser();

        OfferedService service = new OfferedService();
        service.setTitle(request.title().trim());
        service.setDescription(request.description().trim());
        service.setPrice(request.price());
        service.setCategory(request.category().trim());
        service.setProvider(provider);

        return toResponse(serviceRepository.save(service));
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> getAll() {
        return serviceRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse getById(Long id) {
        OfferedService service = findService(id);
        return toResponse(service);
    }

    @Transactional
    public ServiceResponse update(
            Long id,
            CreateServiceRequest request) {

        AppUser currentUser = getCurrentUser();
        OfferedService service = findService(id);

        checkOwnership(service, currentUser);

        service.setTitle(request.title().trim());
        service.setDescription(request.description().trim());
        service.setPrice(request.price());
        service.setCategory(request.category().trim());

        return toResponse(serviceRepository.save(service));
    }

    @Transactional
    public void delete(Long id) {
        AppUser currentUser = getCurrentUser();
        OfferedService service = findService(id);

        checkOwnership(service, currentUser);

        if (requestRepository.existsByOfferedService_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Impossible de supprimer une offre associée à des demandes"
            );
        }

        serviceRepository.delete(service);
    }

    private AppUser getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AppUser user)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentification requise"
            );
        }

        return user;
    }

    private OfferedService findService(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Service introuvable"
                ));
    }

    private void checkOwnership(
            OfferedService service,
            AppUser currentUser) {

        if (!currentUser.getId().equals(
                service.getProvider().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seul le fournisseur de ce service peut le modifier"
            );
        }
    }

    private ServiceResponse toResponse(OfferedService service) {
        return new ServiceResponse(
                service.getId(),
                service.getTitle(),
                service.getDescription(),
                service.getPrice(),
                service.getCategory(),
                service.getProvider().getId(),
                service.getProvider().getFullName(),
                service.getCreatedAt()
        );
    }
}
