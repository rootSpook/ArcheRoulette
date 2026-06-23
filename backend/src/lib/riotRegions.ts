export const SERVERS = [
  { value: 'na1', label: 'NA' },
  { value: 'euw1', label: 'EUW' },
  { value: 'eun1', label: 'EUNE' },
  { value: 'tr1', label: 'TR' },
  { value: 'kr', label: 'KR' },
  { value: 'jp1', label: 'JP' },
  { value: 'br1', label: 'BR' },
  { value: 'la1', label: 'LAN' },
  { value: 'la2', label: 'LAS' },
  { value: 'oc1', label: 'OCE' },
  { value: 'ru', label: 'RU' },
  { value: 'ph2', label: 'PH' },
  { value: 'sg2', label: 'SG' },
  { value: 'th2', label: 'TH' },
  { value: 'tw2', label: 'TW' },
  { value: 'vn2', label: 'VN' },
] as const;

export type ServerValue = (typeof SERVERS)[number]['value'];

// Platform routing value → regional routing value, used by Riot's account-v1 API
const PLATFORM_TO_REGIONAL: Record<string, string> = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas', oc1: 'americas',
  kr: 'asia', jp1: 'asia',
  euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
  ph2: 'sea', sg2: 'sea', th2: 'sea', tw2: 'sea', vn2: 'sea',
};

export function regionalRoutingFor(platform: string): string | undefined {
  return PLATFORM_TO_REGIONAL[platform];
}

export function isValidServer(value: string): value is ServerValue {
  return SERVERS.some((s) => s.value === value);
}
