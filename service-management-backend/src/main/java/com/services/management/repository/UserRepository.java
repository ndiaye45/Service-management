
package com.services.management.repository;

import com.services.management.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    boolean existsByEmailIgnoreCase(String email);
    java.util.Optional<AppUser> findByEmailIgnoreCase(String email);
    java.util.Optional<AppUser> findByEmail(String email);
}
