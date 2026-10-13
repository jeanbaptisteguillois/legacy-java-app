# Inventory & Order Management System (Sample App)

A sample Jakarta EE 10 / EJB inventory and order management system, built for
deployment to **WildFly**, with an **AngularJS 1.x** single-page frontend.

The backend has been modernised to **Java 25 (LTS)** and the Jakarta EE 10
`jakarta.*` package namespace, and its third-party libraries have been
updated to current, supported versions. The frontend still pins several
**deprecated / end-of-life (EOL) libraries** so that modernization tooling
(e.g. **AWS Transform Continuous Modernisation**) can detect and process
them.

## Architecture

Single **EAR** deployable containing two modules:

- `inventory-ejb` — Stateless Session Beans (`javax.ejb.*`), JPA entities
  (`javax.persistence.*`), and JAX-RS (`javax.ws.rs.*`) REST endpoints,
  backed by an embedded H2 database. The JAX-RS resource classes are
  themselves `@Stateless` EJBs so the container injects their `@EJB`
  service dependencies.
- `inventory-web` — AngularJS 1.x SPA (WAR), consuming the JAX-RS APIs.
- `inventory-ear` — bundles both modules plus a deployable WildFly
  datasource descriptor (`META-INF/inventory-ds.xml`).

### Backend services

| Service | EJB | REST base path |
|---|---|---|
| Product / Inventory | `ProductService` | `/api/products` |
| Customer | `CustomerService` | `/api/customers` |
| Order | `OrderService` | `/api/orders` |
| Billing / Invoice | `InvoiceService` | `/api/invoices` |
| Notification | `NotificationService` | `/api/notifications` |
| Reporting / Alerts | `ReportingService` | `/api/reports` |

A `@Singleton @Startup` bean (`DataSeederBean`) seeds sample products and
customers on application start.

### Frontend

AngularJS 1.5.x SPA under `inventory-web/src/main/webapp`, using `ngRoute`
for client-side routing. Modules: Dashboard, Products, Customers, Orders,
Invoices, Notifications. Vendored libraries live under `webapp/lib/` (also
described in `webapp/bower.json`, since Bower was the standard AngularJS-era
frontend package manager).

### Persistence

The persistence unit `inventoryPU` (`inventory-ejb/.../persistence.xml`) is
JTA-based and uses the datasource `java:/InventoryDS`. That datasource is
defined by the deployable descriptor `inventory-ear/.../META-INF/inventory-ds.xml`,
which points at an in-memory H2 database:

```
jdbc:h2:mem:inventorydb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
```

The schema is generated on deploy (`hibernate.hbm2ddl.auto=create-drop`),
so **data is reset every time the app is deployed or the server restarts**.

## Backend dependency modernisation

| Library | Was | Now | Where it's used |
|---|---|---|---|
| Log4j | 1.2.17 (EOL) | Log4j 2 `2.25.4` via `log4j-1.2-api` bridge | `LoggingUtil`, used across all services |
| Apache Commons Lang | 2.6 | `commons-lang3` `3.18.0` | `ProductService`, `CustomerService`, `InvoiceNumberGenerator` |
| Jackson | 2.9.10 | `2.18.11` | `InvoiceService` (audit snapshot JSON) |
| Apache Commons HttpClient | 3.1 (EOL) | JDK `java.net.http.HttpClient` | `NotificationService` (webhook dispatch) |
| javax.xml.bind / JAXB RI | 2.3.0 | `jakarta.xml.bind` from Jakarta EE 10 API | All JPA entities (`@XmlRootElement`) |
| H2 | 1.4.197 | `2.3.232` | Dev/test database |
| JUnit / Mockito | 4.11 / 3.12.4 | `4.13.2` / `5.24.0` | All unit tests |

## Deliberately deprecated / EOL frontend dependencies

| Library | Version | Status | Where it's used |
|---|---|---|---|
| AngularJS | 1.5.11 | EOL since January 2022 | Entire frontend |
| jQuery | 1.12.4 | Old 1.x line | Frontend (Bootstrap dependency) |
| Bootstrap | 3.3.7 | Old 3.x line | Frontend styling |
| Bower | — | Deprecated package manager | `webapp/bower.json` |

Also note: the backend now uses the **Jakarta EE 10 (`jakarta.*`)
namespace**, so it requires a WildFly release that targets Jakarta EE 10.

---

## Running locally

### 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| JDK | **25** | Java 25 (LTS). The build targets `maven.compiler.release=25`. |
| Maven | 3.6+ | 3.9.x verified. |
| WildFly | **27+** | A WildFly release on Jakarta EE 10 / `jakarta.*`. Do **not** use WildFly 26 or older (those are still on the `javax.*` namespace and will not run this app). |

Verify your toolchain:

```bash
java -version   # should report 25.x
mvn -version
```

### 2. Install WildFly

Download and unpack WildFly 31.0.1.Final (any directory is fine; these
steps use `~/wildfly-local`):

```bash
mkdir -p ~/wildfly-local && cd ~/wildfly-local
curl -LO https://download.jboss.org/wildfly/31.0.1.Final/wildfly-31.0.1.Final.zip
unzip -q wildfly-31.0.1.Final.zip
```

> The official download host is `download.jboss.org`. WildFly's GitHub
> Releases page does **not** host the distribution `.zip`, so a
> `github.com/.../releases/download/...` link will 404. A `.tar.gz` is also
> available at the same path if you prefer it over the `.zip`.

This gives you `~/wildfly-local/wildfly-31.0.1.Final` (referred to as
`$WILDFLY_HOME` below).

```bash
export WILDFLY_HOME=~/wildfly-local/wildfly-31.0.1.Final
```

> **H2 driver:** no extra setup required. WildFly ships the H2 driver as the
> `com.h2database.h2` module out of the box, which is exactly what
> `inventory-ds.xml` references. The datasource binds automatically on
> deploy — you do **not** need to add an H2 module or edit `standalone.xml`.

### 3. Build

From the project root (`java-sg-app/`):

```bash
mvn clean install
```

This builds all three modules, runs the JUnit 4 + Mockito unit tests
(~69 tests in `inventory-ejb` covering all six services and all six REST
resources), and produces the deployable:

```
inventory-ear/target/inventory.ear
```

To build without running tests:

```bash
mvn clean install -DskipTests
```

### 4. Deploy

The `inventory-ear` module uses WildFly's **deployment-scanner** model
(drop the EAR into the `deployments/` directory).

Start the server (leave it running in its own terminal):

```bash
$WILDFLY_HOME/bin/standalone.sh
```

In another terminal, copy the EAR into the deployments directory:

```bash
cp inventory-ear/target/inventory.ear $WILDFLY_HOME/standalone/deployments/
```

WildFly auto-deploys within a few seconds. A `inventory.ear.deployed`
marker file appears next to it on success (a `inventory.ear.failed` marker
indicates a deployment error — check the server console).

To **redeploy** after a rebuild, just copy the new EAR over the old one; the
scanner detects the change and redeploys.

### 5. Open the app

| What | URL |
|---|---|
| Frontend (AngularJS SPA) | http://localhost:8080/inventory-web/ |
| REST API base | http://localhost:8080/inventory-web/api/ |

(JAX-RS is activated via `@ApplicationPath("/api")` in the EJB module and
exposed through the web module's context root `/inventory-web`.)

### 6. Smoke-test the API

```bash
BASE=http://localhost:8080/inventory-web/api

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

### Stopping / undeploying

- **Stop the server:** `Ctrl-C` in the terminal running `standalone.sh`
  (or `$WILDFLY_HOME/bin/jboss-cli.sh --connect command=:shutdown`).
- **Undeploy without stopping:** delete the EAR from the deployments dir —
  `rm $WILDFLY_HOME/standalone/deployments/inventory.ear` — and the scanner
  removes it.

### Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `inventory.ear.failed` marker appears | Open the WildFly console output; the stack trace names the failing component. |
| REST calls return `500` with `NullPointerException` on a service field | A JAX-RS resource is not being managed as an EJB. All resources must be annotated `@Stateless` so the container injects their `@EJB` fields. |
| `500` with `LazyInitializationException` / Jackson `JsonMappingException` | A JPA relationship is being serialized after its transaction closed. Lazy back-references are marked `@JsonIgnore`; associations the frontend needs (`Order.customer`, `Invoice.order`) are `FetchType.EAGER`. |
| Port 8080 already in use | Another process (or a second WildFly) holds the port. Stop it, or start WildFly with an offset: `standalone.sh -Djboss.socket.binding.port-offset=100` (app then on `:8180`). |
| App runs but data is empty after restart | Expected — H2 is in-memory with `create-drop`; the `DataSeederBean` reseeds products/customers on each deploy. |

## Project layout

```
inventory-management-parent/   (root pom, dependency management)
├── inventory-ejb/     EJB module: entities, services, REST resources, tests
├── inventory-web/     WAR module: AngularJS 1.x SPA
└── inventory-ear/     EAR module: packaging + WildFly datasource descriptor
```
