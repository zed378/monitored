# 🚀 Kubernetes Multi-Cluster Monitoring (Portainer-Based)

A lightweight Node.js service to monitor Kubernetes clusters via Portainer API.
It aggregates **namespaces, services, pods, and node metrics** across multiple environments and sends **email alerts** for problematic pods.

---

# 📌 Features

- 🌐 Multi-cluster support (via Portainer)
- 📦 Namespaces, Services, Pods, Node Metrics
- 📊 Aggregated metrics per environment
- 🚨 Email alerts for non-running pods
- ⚡ Concurrency-controlled API calls
- 🛡️ Safe for large clusters
- 🐳 Docker-ready

---

# ⚙️ Requirements

Before running this service, make sure you have:

### 1. Portainer Installed

- Access to Portainer
- **Admin or equivalent privileges**

---

### 2. Portainer Agent in Kubernetes

- Portainer Agent must already be deployed in your Kubernetes cluster

---

### 3. Kubernetes Environment Added to Portainer

- Your clusters must be registered as environments in Portainer

---

### 4. Portainer API Token

- Generate an API token from Portainer:
  - Go to **My Account → Access Tokens**
  - Create a new token
  - Save it securely

---

# 🔑 Environment Variables

Create a `.env` file:

```env
PORT=6789

# Mail configuration
MAIL_USER=your_email@mail.com
MAIL_PASS=your_email_password

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
      - "6789:6789"
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
- CrashLoopBackOff detection

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

# 📊 Example Response (Pods)

```json
{
  "total": {
    "all": 120,
    "byPhase": {
      "Running": 90,
      "Pending": 10,
      "Failed": 5,
      "CrashLoopBackOff": 3
    }
  },
  "environments": [
    {
      "environment": { "name": "k8s-dev" },
      "total": 70
    }
  ]
}
```

---

# 🚨 Email Alert System

A cron job runs every **10 minutes** to detect problematic pods:

### Trigger Conditions

- Pod NOT in:
  - `Running`
  - `Succeeded`

- Includes:
  - `Pending`
  - `Failed`
  - `CrashLoopBackOff`

---

### Email Behavior

- Sends **single aggregated email**
- Includes:
  - pod name
  - namespace
  - environment
  - status
  - host IP

---

# ⏱️ Cron Schedule

```bash
*/10 * * * *
```

Every 10 minutes.

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
- Use secrets manager in production
- Avoid exposing Portainer API publicly

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
- WebSocket real-time metrics
- Grafana-style dashboard
- Kubernetes native deployment (Helm)

---

# 🤝 Contributing

PRs and improvements are welcome.

---

# 📄 License

MIT
