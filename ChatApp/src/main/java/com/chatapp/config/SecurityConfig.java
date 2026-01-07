package com.chatapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.chatapp.security.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter authFilter) throws Exception {
        return http
                .csrf(csrf -> csrf.disable()) 
                .authorizeHttpRequests(auth -> auth
                        // 1. ALLOW STATIC FILES & ADMIN HTML
                        .requestMatchers("/", "/index.html", "/login.html", "/register.html", "/chat.html", "/admin.html").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/image/**").permitAll()

                        // 2. ALLOW AUTHENTICATION ENDPOINTS
                        .requestMatchers("/chatapp/adduser", "/chatapp/validateuser").permitAll()

                        // 3. ALLOW WEBSOCKETS
                        .requestMatchers("/ws/**").permitAll()

                        .requestMatchers("/app/**").permitAll()

                        // 4. ALLOW ADMIN ENDPOINTS (Handled by AdminController's secret password check)
                        .requestMatchers("/admin/**").permitAll() 

                        // 5. PROTECT CHAT DATA
                        .anyRequest().authenticated())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}