# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
# Évite les soucis de fins de ligne Windows (CRLF) sur le script Maven.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -DskipTests package && cp target/service-management-*[!l].jar app.jar

# ---------- Run ----------
FROM eclipse-temurin:21-jre
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --create-home --shell /usr/sbin/nologin app
WORKDIR /app
COPY --from=build /app/app.jar app.jar
USER app

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
EXPOSE 8080

# Toute route protégée répond 401 sans token : preuve que Spring est démarré.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/services)" = "401" || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]