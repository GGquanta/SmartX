import type { CompleteHostServiceRegistry } from '../main/ipc/host-contract';
import type {
  ProviderEnvDefaultsPreview,
  SeedProviderFromEnvResponse,
} from '@shared/host-api/contract';
import { runOpenClawDoctor, runOpenClawDoctorFix } from '../utils/openclaw-doctor';
import {
  getProviderEnvDefaultsPreview,
  seedProviderFromEnvIfNeeded,
} from '../utils/seed-provider-from-env';
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
  };
}
