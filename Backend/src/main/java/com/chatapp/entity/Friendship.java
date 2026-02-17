package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Friendship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail; 
    private String friendEmail; 
    private String status;
}