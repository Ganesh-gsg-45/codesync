# Build stage using official Maven + Eclipse Temurin JDK 21
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copy pom.xml and dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage using lightweight JRE 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/codesync-backend-*.jar app.jar

# Create directory for H2 persistent data
RUN mkdir -p /app/data

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
ENV SPRING_PROFILES_ACTIVE="dev"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
