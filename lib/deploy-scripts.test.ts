import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("vps deploy script requires env file and push settings", () => {
  const deployScript = readFileSync(
    path.join(root, "scripts/vps-deploy.sh"),
    "utf8"
  );

  assert.match(deployScript, /ENV_FILE="\.env\.vps"/);
  assert.match(deployScript, /require_env_file/);
  assert.match(deployScript, /REQUIRED_PREFIX="PROD"/);
  assert.match(deployScript, /REQUIRED_PREFIX="STAGING"/);
  assert.match(deployScript, /require_env_key "\$\{REQUIRED_PREFIX\}_DOMAIN"/);
  assert.match(deployScript, /require_env_key "\$\{REQUIRED_PREFIX\}_POSTGRES_DB"/);
  assert.match(deployScript, /require_env_key "\$\{REQUIRED_PREFIX\}_POSTGRES_USER"/);
  assert.match(
    deployScript,
    /require_env_key "\$\{REQUIRED_PREFIX\}_POSTGRES_PASSWORD"/
  );
  assert.match(
    deployScript,
    /require_env_key "\$\{REQUIRED_PREFIX\}_LOYVERSE_ACCESS_TOKEN"/
  );
  assert.match(
    deployScript,
    /require_env_key "\$\{REQUIRED_PREFIX\}_LOYVERSE_STORE_ID"/
  );
  assert.match(
    deployScript,
    /require_env_key "\$\{REQUIRED_PREFIX\}_STAFF_JWT_SECRET"/
  );
  assert.match(
    deployScript,
    /require_env_key "\$\{REQUIRED_PREFIX\}_NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY"/
  );
  assert.match(
    deployScript,
    /require_env_key "\$\{REQUIRED_PREFIX\}_WEB_PUSH_VAPID_PRIVATE_KEY"/
  );
  assert.match(deployScript, /require_env_key "\$\{REQUIRED_PREFIX\}_WEB_PUSH_CONTACT_EMAIL"/);
  assert.match(deployScript, /docker compose --env-file "\$ENV_FILE"/);
});

test("github deploy workflows can sync vps env file before deploy", () => {
  for (const workflow of [
    ".github/workflows/deploy-staging.yml",
    ".github/workflows/deploy-production.yml",
  ]) {
    const content = readFileSync(path.join(root, workflow), "utf8");

    assert.match(content, /VPS_ENV_FILE: \$\{\{ secrets\.VPS_ENV_FILE \}\}/);
    assert.match(content, /cat > "\$1\/\.env\.vps"/);
    assert.match(content, /scripts\/vps-deploy\.sh "\$2" "\$3"/);
  }
});

test("vps workers have outbound network access for external APIs", () => {
  const composeFile = readFileSync(path.join(root, "compose.vps.yml"), "utf8");

  assert.match(
    composeFile,
    /worker-prod:[\s\S]*?networks:[\s\S]*?- olmosq-public[\s\S]*?- olmosq-prod/
  );
  assert.match(
    composeFile,
    /worker-staging:[\s\S]*?networks:[\s\S]*?- olmosq-public[\s\S]*?- olmosq-staging/
  );
});

test("vps app and worker services use cloudflare dns", () => {
  const composeFile = readFileSync(path.join(root, "compose.vps.yml"), "utf8");

  assert.match(
    composeFile,
    /x-cloudflare-dns: &cloudflare-dns\s+- 1\.1\.1\.1\s+- 1\.0\.0\.1/
  );

  for (const service of [
    "app-prod",
    "app-staging",
    "worker-prod",
    "worker-staging",
  ]) {
    assert.match(
      composeFile,
      new RegExp(`${service}:[\\s\\S]*?dns: \\*cloudflare-dns`)
    );
  }
});
