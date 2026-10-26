
package com.services.management.repository;

import com.services.management.entity.ServiceReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceReviewRepository
        extends JpaRepository<ServiceReview, Long> {

    boolean existsByServiceRequestId(Long requestId);

    List<ServiceReview>
    findByServiceRequestOfferedServiceProviderId(Long providerId);
}
