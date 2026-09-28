import { createSign } from 'node:crypto';

const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | undefined;

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function loadCredentials(): ServiceAccountCredentials {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;

  if (!encoded) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not configured.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not valid base64-encoded JSON.');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('client_email' in parsed) ||
    typeof parsed.client_email !== 'string' ||
    !('private_key' in parsed) ||
    typeof parsed.private_key !== 'string'
  ) {
    throw new Error('Service account JSON is missing client_email or private_key.');
  }

  return parsed as ServiceAccountCredentials;
}

async function requestAccessToken(): Promise<CachedToken> {
  const credentials = loadCredentials();
  const tokenUri = credentials.token_uri || DEFAULT_TOKEN_URI;
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = encodeBase64Url(
    JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
    }),
  );

  const payload = encodeBase64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: DRIVE_READONLY_SCOPE,
      aud: tokenUri,
      iat: issuedAt,
      exp: expiresAt,
    }),
  );

  const unsignedJwt = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();

  const signature = encodeBase64Url(signer.sign(credentials.private_key));
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Google service-account token request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!body.access_token) {
    throw new Error('Google token response did not contain access_token.');
  }

  const lifetime = typeof body.expires_in === 'number' ? body.expires_in : 3600;

  return {
    value: body.access_token,
    expiresAt: Date.now() + Math.max(60, lifetime - 60) * 1000,
  };
}

export async function getGoogleDriveAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  cachedToken = await requestAccessToken();
  return cachedToken.value;
}
