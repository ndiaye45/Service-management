
package com.services.management.entity;

import com.services.management.enums.RequestStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_requests")
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private AppUser requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offered_service_id", nullable = false)
    private OfferedService offeredService;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(nullable = false)
    private boolean confirmedByRequester = false;

    @Column(length = 1000)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ServiceRequest() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public AppUser getRequester() { return requester; }
    public OfferedService getOfferedService() { return offeredService; }
    public RequestStatus getStatus() { return status; }
    public boolean isConfirmedByRequester() {
        return confirmedByRequester;
    }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setRequester(AppUser requester) { this.requester = requester; }
    public void setOfferedService(OfferedService offeredService) {
        this.offeredService = offeredService;
    }
    public void setStatus(RequestStatus status) { this.status = status; }
    public void setConfirmedByRequester(boolean confirmedByRequester) {
        this.confirmedByRequester = confirmedByRequester;
    }
    public void setMessage(String message) { this.message = message; }
}
