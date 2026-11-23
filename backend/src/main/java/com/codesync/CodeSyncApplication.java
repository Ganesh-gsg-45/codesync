package com.codesync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CodeSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(CodeSyncApplication.class, args);
    }
}
