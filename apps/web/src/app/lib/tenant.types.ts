export type Tenant = { kind: 'landing' } | { kind: 'shop'; subdomain: string } | { kind: 'unknown' };
