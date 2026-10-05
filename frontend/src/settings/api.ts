import { axiosInstance } from '@/api/axios.ts';
import { parseFromApi, serializeForApi } from '@/lib/serialization/api-transform.ts';
import { PACKAGE_NAME } from '../scope.tsx';
import { type PteroThemeSettings, pteroThemeSettingsSchema } from './schema.ts';

/** Read-only for every visitor, the login pages are themed as well. */
export async function getPublicThemeSettings(): Promise<PteroThemeSettings> {
  const { data } = await axiosInstance.get(`/api/auth/extensions/${PACKAGE_NAME}/settings`);
  return parseFromApi(pteroThemeSettingsSchema, data.settings);
}

export async function getAdminThemeSettings(): Promise<PteroThemeSettings> {
  const { data } = await axiosInstance.get(`/api/admin/extensions/${PACKAGE_NAME}/settings`);
  return parseFromApi(pteroThemeSettingsSchema, data.settings);
}

export async function updateAdminThemeSettings(settings: PteroThemeSettings): Promise<PteroThemeSettings> {
  const { data } = await axiosInstance.put(
    `/api/admin/extensions/${PACKAGE_NAME}/settings`,
    serializeForApi(pteroThemeSettingsSchema, settings),
  );
  return parseFromApi(pteroThemeSettingsSchema, data.settings);
}
