
package com.services.management.service;

import com.services.management.dto.CreateServiceReviewDto;
import com.services.management.dto.ServiceReviewResponse;
import com.services.management.entity.AppUser;
import com.services.management.entity.ServiceRequest;
import com.services.management.entity.ServiceReview;
import com.services.management.enums.RequestStatus;
import com.services.management.repository.ServiceRequestRepository;
import com.services.management.repository.ServiceReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ServiceReviewService {

    private final ServiceReviewRepository reviewRepository;
    private final ServiceRequestRepository requestRepository;

    public ServiceReviewService(
            ServiceReviewRepository reviewRepository,
            ServiceRequestRepository requestRepository) {
        this.reviewRepository = reviewRepository;
        this.requestRepository = requestRepository;
    }

    private AppUser getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AppUser user)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentification requise");
        }

        return user;
    }

    @Transactional
    public ServiceReviewResponse create(
            Long requestId, CreateServiceReviewDto dto) {

        AppUser currentUser = getCurrentUser();

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Demande introuvable"));

        if (!currentUser.getId().equals(request.getRequester().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seul le demandeur peut noter cette prestation");
        }

        if (request.getStatus() != RequestStatus.COMPLETED
                || !request.isConfirmedByRequester()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La prestation doit être terminée et confirmée");
        }

        if (reviewRepository.existsByServiceRequestId(requestId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cette prestation a déjà été notée");
        }

        ServiceReview review = new ServiceReview();
        review.setServiceRequest(request);
        review.setRating(dto.rating());
        review.setComment(dto.comment());

        return toResponse(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public List<ServiceReviewResponse> getForProvider(Long providerId) {
        return reviewRepository
                .findByServiceRequestOfferedServiceProviderId(providerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ServiceReviewResponse toResponse(ServiceReview review) {
        ServiceRequest request = review.getServiceRequest();

        return new ServiceReviewResponse(
                review.getId(),
                request.getId(),
                request.getOfferedService().getProvider().getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
