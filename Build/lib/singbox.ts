import { isProbablyIpv4, isProbablyIpv6 } from './is-fast-ip';

const unsupported = Symbol('unsupported');

function toNumberTuple<T extends string>(key: T, value: string): [T, number] | null {
  const tmp = Number(value);
  return Number.isNaN(tmp) ? null : [key, tmp];
}

// https://sing-box.sagernet.org/configuration/rule-set/source-format/
export const PROCESSOR: Record<string, ((raw: string, type: string, value: string) => [key: keyof SingboxHeadlessRule, value: Required<SingboxHeadlessRule>[keyof SingboxHeadlessRule][number]] | null) | typeof unsupported> = {
  'IP-ASN': unsupported,
  'SRC-IP': (_1, _2, value) => {
    if (value.includes('/')) {
      return ['source_ip_cidr', value];
    }
    if (isProbablyIpv4(value)) {
      return ['source_ip_cidr', value + '/32'];
    }
    if (isProbablyIpv6(value)) {
      return ['source_ip_cidr', value + '/128'];
    }
    return null;
  },
  'SRC-IP-CIDR': (_1, _2, value) => ['source_ip_cidr', value.endsWith(',no-resolve') ? value.slice(0, -11) : value],
  'SRC-PORT': (_1, _2, value) => toNumberTuple('source_port', value),
  'DST-PORT': (_1, _2, value) => toNumberTuple('port', value),
  'PROCESS-NAME': (_1, _2, value) => ((value.includes('/') || value.includes('\\')) ? ['process_path', value] : ['process_name', value]),
  // 'PROCESS-PATH': (_1, _2, value) => ['process_path', value],
  'DEST-PORT': (_1, _2, value) => toNumberTuple('port', value),
  'IN-PORT': (_1, _2, value) => toNumberTuple('source_port', value),
  'URL-REGEX': unsupported,
  'USER-AGENT': unsupported
};

interface SingboxHeadlessRule {
  domain?: string[],
  domain_suffix?: string[],
  domain_keyword?: string[],
  domain_regex?: string[],
  source_ip_cidr?: string[],
  ip_cidr?: string[],
  source_port?: number[],
  source_port_range?: string[],
  port?: number[],
  port_range?: string[],
  process_name?: string[],
  process_path?: string[]
}

export interface SingboxSourceFormat {
  version: 2 | number & {},
  rules: SingboxHeadlessRule[]
}
