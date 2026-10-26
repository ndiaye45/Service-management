
    package com.services.management.entity;

    import jakarta.persistence.*;
    import java.math.BigDecimal;
    import java.time.LocalDateTime;

    @Entity
    @Table(name = "offered_services")
    public class OfferedService {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, length = 120)
        private String title;

        @Column(nullable = false, length = 2000)
        private String description;

        @Column(nullable = false, precision = 10, scale = 2)
        private BigDecimal price;

        @Column(nullable = false, length = 80)
        private String category;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "provider_id", nullable = false)
        private AppUser provider;

        @Column(nullable = false)
        private LocalDateTime createdAt;

        public OfferedService() {}

        @PrePersist
        protected void onCreate() {
            createdAt = LocalDateTime.now();
        }

        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public BigDecimal getPrice() { return price; }
        public String getCategory() { return category; }
        public AppUser getProvider() { return provider; }
        public LocalDateTime getCreatedAt() { return createdAt; }

        public void setId(Long id) { this.id = id; }
        public void setTitle(String title) { this.title = title; }
        public void setDescription(String description) {
            this.description = description;
        }
        public void setPrice(BigDecimal price) { this.price = price; }
        public void setCategory(String category) { this.category = category; }
        public void setProvider(AppUser provider) { this.provider = provider; }
    }
