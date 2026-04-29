# 🚀 Kubernetes Multi-Cluster Monitoring (Portainer-Based)

A lightweight Node.js service to monitor Kubernetes clusters via Portainer API.  
It aggregates **namespaces, services, pods, and node metrics** across multiple environments and sends **alerts only when issues are detected**.

---

# 📌 Features

- 🌐 Multi-cluster monitoring (via Portainer)
- 📦 Namespaces, Services, Pods, Node Metrics
- 📊 Aggregated metrics per environment
- 🚨 Email alerts for **non-running pods only**
- 🧠 Smart filtering (ignores healthy pods)
- ⚡ Optimized API (fast, minimal calls)
- ❤️ Built-in healthcheck
- 🐳 Docker-ready deployment

---

# ⚙️ Requirements

Before running this service, make sure you have:

### 1. Portainer Installed

- Access to Portainer
- **Admin or equivalent privileges**

---

### 2. Portainer Agent in Kubernetes

- Portainer Agent must be deployed in your Kubernetes clusters

---

### 3. Kubernetes Environments Added

- All clusters must be registered in Portainer

---

### 4. Portainer API Token

- Go to: **My Account → Access Tokens**
- Generate token and keep it secure

---

# 🔑 Environment Variables

Create a `.env` file:

```env
PORT=6789

# 📧 Mail Configuration
MAIL_USER=your_email@mail.com
MAIL_PASS=your_email_password
MAIL_HOST=your_email_host
MAIL_PORT=your_email_port

# Multiple recipients (comma-separated, NO quotes)
MAIL_RECIPIENTS=tech@company.com,devops@company.com

# 🔐 Portainer API (Recommended)
PTOKEN=your_portainer_api_token
PURL=https://your-portainer-url:9443/api

# (Optional) Fallback login if token not used
PUSER=your_portainer_username
PPASS=your_portainer_password

# Cron expression for scheduling send alert. Default is every 10 minutes.
CRON_EXPRESSION="*/10 * * * *"
```

---

# 🐳 Running with Docker

create `docker-compose.yml` file:

```yaml
name: monitor-resources

services:
  monitoring-k8s:
    container_name: monitoring
    image: zed378/monitoring:latest
    ports:
      - "6789:6789"
    environment:
      - PORT=6789

      # 📧 Email Configuration
      - MAIL_USER=user@mail.com
      - MAIL_PASS=mail_password
      - MAIL_HOST=yourmailhost
      - MAIL_PORT=yourmailport
      - MAIL_RECIPIENTS=allyourrecipient # comma separated

      # 🔐 Portainer Configuration
      - PTOKEN=your_portainer_token
      - PURL=https://your_portainer_url:9443/api

      # (Optional)
      - PUSER=yourportaineruser
      - PPASS=yourportainerpassword

      # Cron expression default is every 10 minutes
      - CRON_EXPRESSION="*/10 * * * *"

    restart: unless-stopped

    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:6789/health/check"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## Run:

```code
docker compose up -d
```

---

# 🧪 API Endpoints

## 1. Namespaces

```
GET /k8s/namespaces
```

## 2. Services

```
GET /k8s/services
```

## 3. Pods Metrics

```
GET /k8s/metrics
```

**Includes:**

- total pods
- phase distribution
- problematic pods detection

## 4. Node Metrics

```
GET /k8s/nodes
```

**Includes:**

- CPU usage (cores + %)
- Memory usage (bytes + GB)
- GPU (if available)

---

# 🚨 Alerting Logic (IMPORTANT)

Alerts are sent ONLY when problematic pods exist.

### ✅ Triggered when:

Pod status is NOT:

- `Running`
- `Succeeded`

Examples:

- `Pending`
- `Failed`
- `CrashLoopBackOff`
- `Unknown`

### ❌ Not triggered when:

- All pods are healthy

### 🔁 Check Interval

```
*/10 * * * *
```

Runs every 10 minutes via cron.

---

# 📧 Email Behavior

- Sends **ONE aggregated email**
- Supports **multiple recipients**
- Includes all problematic pods

Severity:

- 🔴 Critical → Failed, CrashLoopBackOff
- 🟡 Warning → others

---

# 📊 Email Preview

| Environment | Pod     | Status | Namespace | Host     |
| ----------- | ------- | ------ | --------- | -------- |
| k8s-dev     | api-xyz | Failed | default   | 10.x.x.x |

---

# ❤️ Health Check

```
GET /health/check
```

Response:

```
OK
```

Used by Docker healthcheck to ensure container is running properly.

---

# 🧠 Architecture

```
Portainer API
     ↓
Monitoring Service (Node.js)
     ↓
Aggregation Layer
     ↓
REST API + Alerting System
```

---

# ⚡ Performance Notes

- 🚀 Single API call per resource (optimized)
- ⚡ Fast response time (~1–2s)
- 🔁 Optional caching support
- 🛡 Fault-tolerant per environment

---

# 🔒 Security Notes

- Never commit .env
- Keep PTOKEN private
- Prefer token over username/password
- Use secure SMTP credentials

---

# 🛠️ Development

```
npm install
npm run dev
```

---

# 🚀 Future Improvements

- MS Teams / Slack alert integration
- Alert deduplication
- Redis caching
- WebSocket real-time updates
- Dashboard (React + charts)
- Helm / Kubernetes deployment

---

# 🤝 Contributing

PRs and improvements are welcome.

---

# 📄 License

MIT

---
