
package com.services.management.repository;

import com.services.management.entity.OfferedService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferedServiceRepository
        extends JpaRepository<OfferedService, Long> {

    List<OfferedService> findAllByOrderByCreatedAtDesc();

    List<OfferedService> findByCategoryIgnoreCaseOrderByCreatedAtDesc(
            String category);
}
