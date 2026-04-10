# ── Stage 1: Build ────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache Maven dependencies in a separate Docker layer
COPY backend/pom.xml backend/pom.xml
RUN mvn -f backend/pom.xml dependency:go-offline -q

# Copy everything (frontend + backend source)
COPY . .

# Build the fat JAR — maven-resources-plugin copies frontend into static/
RUN mvn -f backend/pom.xml clean package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create the data directory used by H2 in local / dev mode
RUN mkdir -p /app/data

COPY --from=build /app/backend/target/*.jar app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# Strip Windows CRLF line endings and ensure executable
RUN sed -i 's/\r//' /app/docker-entrypoint.sh \
 && chmod +x /app/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
