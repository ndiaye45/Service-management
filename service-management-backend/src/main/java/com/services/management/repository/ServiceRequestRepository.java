
package com.services.management.repository;

import com.services.management.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository
        extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    List<ServiceRequest> findByOfferedServiceProviderIdOrderByCreatedAtDesc(
            Long providerId);
    boolean existsByOfferedService_Id(Long serviceId);

}
