# SentinelAPI — Signature-Based Intrusion Detection Middleware

This project is a small REST API protected by a custom intrusion-detection middleware layer that detects 11 distinct categories of attacks in real time, logs them to a SQLite database, and displays them on a live dashboard.

## Requirements
- Node.js (v18+ recommended)
- npm

## How to Run

1. **Install dependencies and setup database:**
   \`\`\`bash
   npm install
   npx prisma db push
   \`\`\`

2. **Start the API Server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   The server will start on `http://localhost:3000`.

3. **Open the Dashboard:**
   Simply double-click `dashboard/index.html` to open it in your browser, or serve it via a local static file server. It will automatically connect to the live API via Server-Sent Events (SSE).

4. **Run the Attack Simulation (in a separate terminal):**
   \`\`\`bash
   npm run test:sim
   \`\`\`
   Follow the interactive prompts in the terminal to step through the simulated attacks one by one. Watch the dashboard update in real time.

## Syllabus Mapping

| Attack / Detector | Description | Syllabus Module |
| :--- | :--- | :--- |
| **SQL Injection** | Detects SQL metacharacters (`UNION SELECT`, `--`). | Web Application Security |
| **XSS** | Detects script injections (`<script>`, `onerror=`). | Web Application Security |
| **Path Traversal** | Detects relative paths (`../`) to access system files. | OS & File System Security |
| **Command Injection** | Detects shell metacharacters and commands (`; rm`). | System Exploitation |
| **Brute-Force Login** | Flags an IP making many failed login attempts to one user. | Authentication & Access Control |
| **Credential Stuffing** | Flags an IP trying one password across many users. | Authentication & Access Control |
| **DDoS (Request Flood)** | Flags and temporarily rate-limits IPs with too many requests. | Network Security & DDoS |
| **SSRF** | Blocks API fetches to internal cloud metadata IP addresses. | Cloud Security |
| **Malicious File Upload** | Inspects file magic bytes (e.g., `MZ`) to block executables. | OS & File System Security |
| **Attack Scanner Tool** | Blocks requests from known vulnerability scanners (sqlmap). | Threat Intelligence & Recon |
| **Endpoint Enumeration** | Flags IPs generating an excessive number of 404 errors. | Threat Intelligence & Recon |
