# 🚀 Kubernetes Multi-Cluster Monitoring (Portainer-Based)

A lightweight Node.js service to monitor Kubernetes clusters via Portainer API.
It aggregates **namespaces, services, pods, and node metrics** across multiple environments and sends **email alerts only when issues are detected**.

---

# 📌 Features

- 🌐 Multi-cluster monitoring (via Portainer)
- 📦 Namespaces, Services, Pods, Node Metrics
- 📊 Aggregated metrics per environment
- 🚨 Email alerts for **non-running pods only**
- 🧠 Smart filtering (ignores healthy pods)
- ⚡ Concurrency-controlled API calls
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

# Mail configuration
MAIL_USER=your_email@mail.com
MAIL_PASS=your_email_password

# Multiple recipients (comma-separated, NO quotes)
MAIL_RECIPIENTS=kembedt@gmail.com,m.zawawi1996@gmail.com,zed3781@gmail.com

# Portainer API
PTOKEN=your_portainer_api_token
PURL=https://your-portainer-url:9443/api
```

---

# 🐳 Running with Docker

### docker-compose.yml

```yaml
name: monitor-resources

services:
  monitoring-k8s:
    image: zed378/monitoring:latest
    container_name: monitoring
    ports:
      - '6789:6789'
    env_file:
      - .env
    restart: unless-stopped
```

---

### Run

```bash
docker compose up -d
```

---

# 🧪 API Endpoints

## 1. Namespaces

```
GET /k8s/namespaces
```

Grouped by environment with totals.

---

## 2. Services

```
GET /k8s/services
```

Structured by:

```
environment → namespace → services
```

---

## 3. Pods Metrics

```
GET /k8s/metrics
```

Includes:

- total pods
- phase distribution
- problematic pods detection

---

## 4. Node Metrics

```
GET /k8s/nodes
```

Includes:

- CPU usage (cores + %)
- Memory usage (bytes + GB)
- GPU (if available)

---

# 🚨 Alerting Logic (IMPORTANT)

Emails are sent **ONLY when problematic pods exist**.

### ✅ Email WILL be sent if:

- Pod status is NOT:
  - `Running`
  - `Succeeded`

Examples:

- `Pending`
- `Failed`
- `CrashLoopBackOff`
- `Unknown`

---

### ❌ Email will NOT be sent if:

- All pods are healthy (`Running` / `Succeeded`)

---

### 🔁 Check Interval

```bash
*/10 * * * *
```

Every 10 minutes via cron.

---

# 📧 Email Behavior

- Sends **ONE aggregated email**
- Includes all problematic pods
- Supports **multiple recipients**
- Highlights:
  - 🔴 Critical → Failed / CrashLoopBackOff
  - 🟡 Warning → others

---

# 📊 Email Preview

| Environment | Pod     | Status | Namespace | Host     |
| ----------- | ------- | ------ | --------- | -------- |
| k8s-dev     | api-xyz | Failed | default   | 10.x.x.x |

---

# 🧠 Architecture

```
Portainer API
     ↓
Monitoring Service (Node.js)
     ↓
Aggregation Layer
     ↓
REST API + Email Alerts
```

---

# ⚡ Performance Notes

- Uses concurrency control (`p-limit`)
- Avoids API overload
- Fault-tolerant per environment
- Safe for multi-cluster setups

---

# 🔒 Security Notes

- Never commit `.env`
- Keep `PTOKEN` private
- Use secure SMTP credentials

---

# 🛠️ Development

```bash
npm install
npm start
```

---

# 📬 Health Check

```
GET /health
```

Response:

```
OK
```

---

# 🚀 Future Improvements

- Redis caching
- Alert deduplication
- WebSocket live metrics
- Grafana-style dashboard
- Kubernetes (Helm) deployment

---

# 🤝 Contributing

PRs and improvements are welcome.

---

# 📄 License

MIT
