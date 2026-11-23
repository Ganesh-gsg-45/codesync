# Build stage
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy Maven wrapper & pom.xml
COPY pom.xml .
COPY .mvn-bin .mvn-bin

# Copy source code and build
COPY src src
RUN ./.mvn-bin/apache-maven-3.9.6/bin/mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create unprivileged user for security
RUN groupadd -r spring && useradd -r -g spring spring

# Copy built jar from build stage
COPY --from=build /app/target/codesync-backend-1.0.0-SNAPSHOT.jar app.jar

# Create directory for H2 persistent data
RUN mkdir -p /app/data && chown -R spring:spring /app

USER spring:spring

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
ENV SPRING_PROFILES_ACTIVE="dev"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
