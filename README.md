# SentinelAPI — Signature-Based Intrusion Detection Middleware

This project is a small REST API protected by a custom intrusion-detection middleware layer that detects 11 distinct categories of attacks in real time, logs them to a local PostgreSQL database, and displays them on a live dashboard.

## Requirements
- Node.js (v18+ recommended)
- npm
- PostgreSQL 14+ with the `psql` command available

## How to Run

1. **Create the local PostgreSQL database:**
   \`\`\`bash
   brew services start postgresql@16
   createdb sentinelapi
   \`\`\`

   If your PostgreSQL user/password differs, copy `.env.example` to `.env` and edit `DATABASE_URL`. The API automatically creates the `alerts` table and its index at startup.

2. **Install backend dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the API Server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   The server will start on `http://localhost:3000`.

4. **Start the Dashboard (in a second terminal):**
   \`\`\`bash
   cd dashboard
   npm install
   npm run dev
   \`\`\`
   Open the URL printed by Vite (normally `http://localhost:5173`). It connects to the API using Server-Sent Events (SSE).

5. **Run the Attack Simulation (in a third terminal, from the project root):**
   \`\`\`bash
   npm run test:sim
   \`\`\`
   Follow the interactive prompts in the terminal to step through the simulated attacks one by one. Watch the dashboard update in real time.

## PostgreSQL Configuration

The default connection string is:

\`\`\`text
postgresql://localhost:5432/sentinelapi
\`\`\`

Override it with `DATABASE_URL` in `.env`, for example:

\`\`\`text
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/sentinelapi
\`\`\`

Useful checks:

\`\`\`bash
psql sentinelapi -c '\\d alerts'
psql sentinelapi -c 'SELECT id, detector_name, severity, timestamp FROM alerts ORDER BY timestamp DESC LIMIT 10;'
\`\`\`

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
