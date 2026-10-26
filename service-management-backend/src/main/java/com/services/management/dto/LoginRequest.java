package com.services.management.dto;

public record LoginRequest(
        String email,
        String password
) {}
