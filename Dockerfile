# Multi-stage build for the Inventory Management Spring Boot application.

FROM maven:3-amazoncorretto-25 AS build
WORKDIR /build
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

FROM amazoncorretto:25-alpine
RUN addgroup -S inventory && adduser -S -G inventory inventory
WORKDIR /app
COPY --from=build /build/target/inventory.jar /app/inventory.jar
RUN chown -R inventory:inventory /app
USER inventory

EXPOSE 8080

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"'

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/inventory.jar"]
