# Inventory & Order Management System (Sample App)

A sample inventory and order management system with an **AngularJS 1.x**
single-page frontend, running as a **standalone Spring Boot 3.5 application**
with an embedded servlet container.

This application was originally a Jakarta EE 10 / EJB **EAR** deployed to
**WildFly**. It has been migrated to Spring Boot: the application server, the
EAR/WAR/EJB-JAR packaging, the EJB component model, the JAX-RS layer and the
JNDI datasource are all gone. See [Migration outcome](#migration-outcome).

The frontend still pins several **deprecated / end-of-life (EOL) libraries**
so that modernization tooling (e.g. **AWS Transform Continuous
Modernisation**) can detect and process them.

## Architecture

Single **executable JAR** (`target/inventory.jar`):

- `src/main/java` — Spring `@Service` beans, JPA entities
  (`jakarta.persistence.*`), and Spring MVC `@RestController` endpoints,
  backed by an embedded H2 database.
- `src/main/resources/static` — AngularJS 1.x SPA, served directly by Spring
  Boot from the application root.

### Backend services

| Service | Spring bean | REST base path |
|---|---|---|
| Product / Inventory | `ProductService` | `/api/products` |
| Customer | `CustomerService` | `/api/customers` |
| Order | `OrderService` | `/api/orders` |
| Billing / Invoice | `InvoiceService` | `/api/invoices` |
| Notification | `NotificationService` | `/api/notifications` |
| Reporting / Alerts | `ReportingService` | `/api/reports` |

`DataSeederBean` (a `CommandLineRunner`) seeds sample products and customers
once the application context has started.

### Frontend

AngularJS 1.5.x SPA under `src/main/resources/static`, using `ngRoute` for
client-side routing. Modules: Dashboard, Products, Customers, Orders,
Invoices, Notifications. Vendored libraries live under `static/lib/` (also
described in `static/bower.json`, since Bower was the standard AngularJS-era
frontend package manager). `index.html` is served as the welcome file at `/`.

### Persistence

Configured in `src/main/resources/application.yml` (replacing the former
`persistence.xml` persistence unit `inventoryPU` and the WildFly
`inventory-ds.xml` datasource `java:/InventoryDS`):

```
jdbc:h2:mem:inventorydb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
```

The schema is generated on startup (`spring.jpa.hibernate.ddl-auto=create-drop`),
so **data is reset every time the application restarts**. The sample
credentials (`sa`/`sa`) can be overridden with `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`.

Transactions are managed by Spring (`@Transactional` on each service),
replacing EJB container-managed transactions.

## Backend dependency modernisation

| Library | Was | Now | Where it's used |
|---|---|---|---|
| Application server | WildFly 31 (EAR) | Spring Boot 3.5.16 embedded Tomcat | Whole application |
| Jakarta EE umbrella API | `jakarta.jakartaee-api` 10.0.0 (provided) | Spring Boot starters (web, data-jpa, validation, actuator) | Whole application |
| Logging | Log4j 2 `2.25.4` via the `log4j-1.2-api` bridge | SLF4J + Logback (`spring-boot-starter-logging`) | `LoggingUtil`, used across all services |
| Apache Commons Lang | 2.6 | `commons-lang3` `3.18.0` | `ProductService`, `CustomerService`, `InvoiceNumberGenerator` |
| Jackson | 2.9.10 | `2.21.7` (BOM override; the 3.5.16 BOM's 2.21.4 has known CVEs) | `InvoiceService` (audit snapshot JSON), REST serialization |
| Apache Commons HttpClient | 3.1 (EOL) | JDK `java.net.http.HttpClient` | `NotificationService` (webhook dispatch) |
| JAXB | container-provided | `jakarta.xml.bind-api` + `org.glassfish.jaxb:jaxb-runtime` | All JPA entities and DTOs (`@XmlRootElement`) |
| JPA provider | WildFly-provided Hibernate | Hibernate 6.6 via `spring-boot-starter-data-jpa` | All entities / services |
| H2 | 1.4.197 | `2.3.232` | Dev/test database |
| JUnit / Mockito | 4.13.2 / 5.24.0 | JUnit 5 Jupiter `5.12.2` / Mockito `5.24.0` | All unit tests |

## Deliberately deprecated / EOL frontend dependencies

| Library | Version | Status | Where it's used |
|---|---|---|---|
| AngularJS | 1.5.11 | EOL since January 2022 | Entire frontend |
| jQuery | 1.12.4 | Old 1.x line | Frontend (Bootstrap dependency) |
| Bootstrap | 3.3.7 | Old 3.x line | Frontend styling |
| Bower | — | Deprecated package manager | `static/bower.json` |

---

## Running locally

### 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| JDK | **25** | The build targets `maven.compiler.release=25`. If your Maven runs on an older JDK, set `JAVA_HOME` to a JDK 25 installation. |
| Maven | 3.6+ | 3.8.x / 3.9.x verified. |

No application server is required.

```bash
java -version   # should report 25.x
mvn -version
```

### 2. Build

```bash
mvn clean verify
```

This compiles the application, runs the JUnit 5 + Mockito unit tests and the
Spring Boot integration test (76 tests: 69 migrated unit tests covering all
six services and all six REST controllers, plus 7 new integration tests), and
produces the executable JAR:

```
target/inventory.jar
```

To build without running tests: `mvn clean package -DskipTests`.

### 3. Run

```bash
java -jar target/inventory.jar
```

or, during development:

```bash
mvn spring-boot:run
```

### 4. Open the app

| What | URL |
|---|---|
| Frontend (AngularJS SPA) | http://localhost:8080/ |
| REST API base | http://localhost:8080/api/ |
| Health / probes | http://localhost:8080/actuator/health |
| Metrics | http://localhost:8080/actuator/metrics |

The `/api` prefix is the `@ApplicationPath("/api")` of the former JAX-RS
activator, now carried on each controller's `@RequestMapping`. Note the
context root changed: the SPA and API were previously served under
`/inventory-web/` (the WAR context root) and are now served from `/`.

### 5. Smoke-test the API

```bash
BASE=http://localhost:8080/api

# seeded data
curl -s $BASE/products
curl -s $BASE/customers
curl -s $BASE/reports/low-stock-alerts

# place an order (use real ids from the two calls above)
curl -s -X POST $BASE/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":1,"lineItems":[{"productId":1,"quantity":2}]}'

# generate an invoice for order 1
curl -s -X POST $BASE/invoices/generate/1
```

All endpoints should return `200`/`201`. Orders, invoices, and
notifications start empty (only products and customers are seeded).

### 6. Container image

```bash
docker build -t inventory-management .
docker run --rm -p 8080:8080 inventory-management
```

The `Dockerfile` is a multi-stage build (`maven:3-amazoncorretto-25` build
stage, `amazoncorretto:25-alpine` runtime), runs as a non-root user, sizes the
heap with `-XX:MaxRAMPercentage=75`, and declares a `HEALTHCHECK` against
`/actuator/health`.

### Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Startup fails with `Failed to configure a DataSource` | The H2 driver or the `spring.datasource.*` settings are missing — check `application.yml`. |
| `500` with `LazyInitializationException` / Jackson `JsonMappingException` | A JPA relationship is being serialized after its transaction closed. Lazy back-references are marked `@JsonIgnore`; associations the frontend needs (`Order.customer`, `Invoice.order`) are `FetchType.EAGER`. |
| Port 8080 already in use | Start with a different port: `java -jar target/inventory.jar --server.port=8180`. |
| App runs but data is empty after restart | Expected — H2 is in-memory with `create-drop`; `DataSeederBean` reseeds products/customers on each start. |

## Project layout

```
inventory-management/
├── pom.xml                        Spring Boot application POM
├── Dockerfile                     multi-stage container build
└── src
    ├── main/java/com/example/inventory/
    │   ├── InventoryApplication.java   @SpringBootApplication entry point
    │   ├── entity/  dto/               JPA entities and transfer objects
    │   ├── service/                    @Service business logic
    │   ├── rest/                       @RestController endpoints under /api
    │   └── util/                       logging + invoice-number helpers
    ├── main/resources/
    │   ├── application.yml             datasource, JPA, actuator config
    │   ├── logback-spring.xml          logging config
    │   └── static/                     AngularJS 1.x SPA
    └── test/java/com/example/inventory/
        ├── InventoryApplicationTests.java   @SpringBootTest + MockMvc
        ├── service/                    service unit tests
        └── rest/                       controller unit tests
```

---

## Migration outcome

Migrated from Jakarta EE 10 / EJB on WildFly to Spring Boot 3.5.16.

**What changed**

- The three Maven modules (`inventory-ejb`, `inventory-web`, `inventory-ear`)
  were consolidated into one Spring Boot module. All 34 main and 12 test
  sources kept their packages and class names.
- `@Stateless` session beans → `@Service` + `@Transactional`;
  `@EJB`/field injection → constructor injection; `@Local` removed from the
  six `*ServiceLocal` business interfaces (the interfaces themselves are
  retained).
- `@Singleton @Startup` + `@PostConstruct` `DataSeederBean` → `@Component`
  implementing `CommandLineRunner`, with `seed()` now `@Transactional`.
- JAX-RS resources → `@RestController`; `@Path`/`@GET`/`@PathParam`/
  `@QueryParam` → `@RequestMapping` family; `Response` → `ResponseEntity`
  with identical HTTP status codes. Unannotated JAX-RS body parameters were
  given explicit `@RequestBody`.
- `InventoryRestApplication` (the `@ApplicationPath("/api")` activator) was
  deleted; its `/api` prefix is now part of every controller mapping.
- `persistence.xml`, `inventory-ds.xml`, `ejb-jar.xml`, `beans.xml`,
  `web.xml` and `log4j2.properties` were removed after every setting was
  transferred to `application.yml` / `logback-spring.xml`.
- Tests migrated from JUnit 4 to JUnit 5. All 69 original tests and their
  assertions are preserved; 7 Spring Boot integration tests were added.

**Open items / behaviour to review**

- `LoggingUtil.getLogger(Class<?>)` now returns `org.slf4j.Logger` instead of
  `org.apache.log4j.Logger`. The class and method names are unchanged and all
  call sites emit the same messages, but this is a public signature change for
  any out-of-tree caller.
- The context root changed from `/inventory-web/` to `/`, and `index.html`'s
  `<base href>` was updated accordingly. Bookmarked
  `/inventory-web/...` URLs will no longer resolve.
- `web.xml`'s `<display-name>` has no Spring Boot equivalent and was dropped.
- Transaction boundaries now begin at the Spring service proxy rather than at
  the EJB container. Propagation semantics match (EJB `REQUIRED` default →
  Spring `@Transactional` default), but the seeding path now runs as one
  explicit transaction.
- EJB remoting is out of scope: the `*ServiceLocal` interfaces are now plain
  Java interfaces and can no longer be looked up over JNDI.
- No coverage tool was configured before or after the migration, so
  per-package test coverage is unmeasured.
