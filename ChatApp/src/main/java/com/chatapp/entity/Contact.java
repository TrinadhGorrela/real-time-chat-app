package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String requester; 
    private String approver;  
    private String status;    
}