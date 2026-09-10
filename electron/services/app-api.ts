import type { CompleteHostServiceRegistry } from '../main/ipc/host-contract';
import { COMPANY_KNOWLEDGE_WEBVIEW_PARTITION } from '@shared/company-knowledge';
import type {
  ProviderEnvDefaultsPreview,
  SeedProviderFromEnvResponse,
} from '@shared/host-api/contract';
import { session } from 'electron';
import { runOpenClawDoctor, runOpenClawDoctorFix } from '../utils/openclaw-doctor';
import {
  getProviderEnvDefaultsPreview,
  seedProviderFromEnvIfNeeded,
} from '../utils/seed-provider-from-env';
import {
  fetchCompanyKnowledgeResource,
  resolveMainCompanyKnowledgeUrl,
} from '../utils/company-knowledge-resource';
import { isRecord } from './payload-utils';

type OpenClawDoctorPayload = {
  mode?: unknown;
};

export function createAppApi(): CompleteHostServiceRegistry['app'] {
  return {
    openClawDoctor: async (payload) => {
      const body = isRecord(payload) ? payload as OpenClawDoctorPayload : {};
      return body.mode === 'fix' ? runOpenClawDoctorFix() : runOpenClawDoctor();
    },
    getProviderEnvDefaults: async (): Promise<ProviderEnvDefaultsPreview | null> => {
      return getProviderEnvDefaultsPreview();
    },
    seedProviderFromEnv: async (): Promise<SeedProviderFromEnvResponse> => {
      return seedProviderFromEnvIfNeeded();
    },
    fetchCompanyKnowledgeResource: async (payload) => {
      const url = isRecord(payload) ? payload.url : undefined;
      return fetchCompanyKnowledgeResource({
        url,
        embedUrl: resolveMainCompanyKnowledgeUrl(),
        fetch: (requestUrl) => session.fromPartition(COMPANY_KNOWLEDGE_WEBVIEW_PARTITION).fetch(requestUrl),
      });
    },
  };
}
