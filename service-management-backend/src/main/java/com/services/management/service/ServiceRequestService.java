
package com.services.management.service;

import com.services.management.dto.CreateServiceRequestDto;
import com.services.management.dto.ServiceRequestResponse;
import com.services.management.dto.UpdateRequestStatusDto;
import com.services.management.entity.AppUser;
import com.services.management.entity.OfferedService;
import com.services.management.entity.ServiceRequest;
import com.services.management.enums.RequestStatus;
import com.services.management.repository.OfferedServiceRepository;
import com.services.management.repository.ServiceRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository requestRepository;
    private final OfferedServiceRepository serviceRepository;

    public ServiceRequestService(
            ServiceRequestRepository requestRepository,
            OfferedServiceRepository serviceRepository) {
        this.requestRepository = requestRepository;
        this.serviceRepository = serviceRepository;
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

    @Transactional
    public ServiceRequestResponse create(
            Long serviceId, CreateServiceRequestDto dto) {

        AppUser requester = getCurrentUser();

        OfferedService offeredService = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Service introuvable"));

        if (offeredService.getProvider().getId().equals(requester.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tu ne peux pas demander ton propre service");
        }

        ServiceRequest request = new ServiceRequest();
        request.setOfferedService(offeredService);
        request.setRequester(requester);
        request.setMessage(dto.message());
        request.setStatus(RequestStatus.PENDING);

        return toResponse(requestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getForRequester(Long requesterId) {
        AppUser currentUser = getCurrentUser();

        if (!currentUser.getId().equals(requesterId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tu ne peux consulter que tes propres demandes");
        }

        return requestRepository
                .findByRequesterIdOrderByCreatedAtDesc(requesterId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getForProvider(Long providerId) {
        AppUser currentUser = getCurrentUser();

        if (!currentUser.getId().equals(providerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tu ne peux consulter que les demandes concernant tes services");
        }

        return requestRepository
                .findByOfferedServiceProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ServiceRequestResponse updateStatus(
            Long requestId, UpdateRequestStatusDto dto) {

        AppUser currentUser = getCurrentUser();

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Demande introuvable"));

        Long providerId = request.getOfferedService()
                .getProvider().getId();

        if (!currentUser.getId().equals(providerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seul le fournisseur de ce service peut modifier la demande");
        }

        RequestStatus current = request.getStatus();
        RequestStatus next = dto.status();

        boolean allowed =
                (current == RequestStatus.PENDING
                        && (next == RequestStatus.ACCEPTED
                        || next == RequestStatus.REJECTED))
                        || (current == RequestStatus.ACCEPTED
                        && next == RequestStatus.COMPLETED);

        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Transition de statut non autorisée");
        }

        request.setStatus(next);
        return toResponse(requestRepository.save(request));
    }


    @Transactional
    public ServiceRequestResponse confirmByRequester(Long requestId) {

        AppUser currentUser = getCurrentUser();

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Demande introuvable"
                ));

        // Seul le demandeur peut confirmer la prestation
        if (!currentUser.getId().equals(
                request.getRequester().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seul le demandeur peut confirmer la prestation"
            );
        }

        // Le fournisseur doit avoir terminé la prestation
        if (request.getStatus() != RequestStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La prestation doit être terminée avant confirmation"
            );
        }

        // Empêcher une confirmation répétée
        if (request.isConfirmedByRequester()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La prestation a déjà été confirmée"
            );
        }

        request.setConfirmedByRequester(true);

        return toResponse(requestRepository.save(request));
    }

    private ServiceRequestResponse toResponse(ServiceRequest request) {
        OfferedService offeredService = request.getOfferedService();

        return new ServiceRequestResponse(
                request.getId(),
                offeredService.getId(),
                offeredService.getTitle(),
                request.getRequester().getId(),
                request.getRequester().getFullName(),
                offeredService.getProvider().getId(),
                request.getStatus(),
                request.isConfirmedByRequester(),
                request.getMessage(),
                request.getCreatedAt()
        );
    }
}
