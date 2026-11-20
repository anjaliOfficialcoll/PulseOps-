package com.pulseops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableCaching
@ConfigurationPropertiesScan
@EntityScan(basePackages = "com.pulseops.entity")
@EnableJpaRepositories(basePackages = "com.pulseops.repository")
public class PulseOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PulseOpsApplication.class, args);
    }
}

