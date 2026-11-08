import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export function adConfiguration(env = process.env) {
  if (env.ADSENSE_REQUESTS_ENABLED === 'true')
    throw new Error(
      'Live ad requests are intentionally blocked. Integrate and review a certified CMP, legal consent, CSP, approval and placements before implementing an SDK.',
    );
  const enabled = env.ADS_TXT_ENABLED === 'true';
  const publisher = env.ADSENSE_PUBLISHER_ID ?? '';
  const slot = env.ADSENSE_SLOT_ID ?? '';
  if (publisher && (!/^pub-\d{16}$/.test(publisher) || /^(\d)\1{15}$/.test(publisher.slice(4))))
    throw new Error(
      'Invalid publisher ID; use the actual public ID from your own AdSense account.',
    );
  if (slot && !/^\d{1,20}$/.test(slot)) throw new Error('Invalid ad slot ID.');
  if (enabled && !publisher)
    throw new Error('ads.txt requires an actual publisher ID; placeholders are forbidden.');
  return {
    active: false,
    adsTxtEnabled: enabled,
    publisherId: enabled ? publisher : '',
    slotId: slot,
    requestsEnabled: false,
    consentAdapter: 'not-implemented',
    notice:
      'Configuration only; no account approval, tracking, third-party requests or earnings implied.',
  };
}
export function prepareAds(directory = 'dist', env = process.env) {
  const config = adConfiguration(env);
  mkdirSync(directory, { recursive: true });
  const content = config.adsTxtEnabled
    ? `google.com, ${config.publisherId}, DIRECT, f08c47fec0942fa0\n`
    : '# Advertising disabled. No authorized digital sellers configured.\n';
  writeFileSync(resolve(directory, 'ads.txt'), content);
  writeFileSync(resolve(directory, 'ads-config.json'), JSON.stringify(config, null, 2) + '\n');
  return config;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  console.log(JSON.stringify(prepareAds()));
