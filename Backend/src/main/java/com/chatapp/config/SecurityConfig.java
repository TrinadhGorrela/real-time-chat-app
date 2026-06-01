package com.chatapp.config;

import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.chatapp.security.JwtAuthFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:8081,https://localhost:3000,https://localhost:8081,http://localhost:5173,https://localhost:5173,https://real-time-chat-app-eta-roan.vercel.app}")
    private String[] allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter authFilter) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Public HTML pages
                        .requestMatchers("/", "/index.html", "/login.html", "/register.html", "/chat.html")
                        .permitAll()

                        // Static resources
                        .requestMatchers("/css/**", "/js/**", "/image/**", "/audio/**").permitAll()

                        // API endpoints
                        .requestMatchers("/chatapp/adduser", "/chatapp/validateuser").permitAll()

                        // WebSocket
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/app/**").permitAll()

                        // File serving
                        .requestMatchers("/files/**").permitAll()

                        // Protected endpoints
                        .requestMatchers("/chatapp/status/**").authenticated()
                        .requestMatchers("/chatapp/mycontacts").authenticated()
                        .requestMatchers("/chatapp/request").authenticated()
                        .requestMatchers("/chatapp/requests").authenticated()
                        .requestMatchers("/chatapp/accept").authenticated()
                        .requestMatchers("/chatapp/decline").authenticated()
                        .requestMatchers("/chatapp/delete-contact").authenticated()
                        .requestMatchers("/chatapp/messages/**").authenticated()
                        .requestMatchers("/chatapp/message/**").authenticated()

                        .anyRequest().authenticated())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
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