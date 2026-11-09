import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/buttons/Button.tsx';
import { AdminCan } from '@/elements/Can.tsx';
import TitleCard from '@/elements/data-display/TitleCard.tsx';
import NumberInput from '@/elements/input/NumberInput.tsx';
import Select from '@/elements/input/Select.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { DEFAULT_FOOTER_TEXT } from '../footer/footerText.tsx';
import { useExtTranslations } from '../translations.ts';
import { getAdminThemeSettings, updateAdminThemeSettings } from './api.ts';
import {
  defaultPteroThemeSettings,
  PTERO_MAX_FOOTER_TEXT_LENGTH,
  PTERO_MAX_LOADING_BAR_DELAY,
  type PteroAnimationSpeed,
  type PteroAuthHeader,
  type PteroColorPalette,
  type PteroFooterPosition,
  type PteroThemeSettings,
  pteroThemeSettingsFormSchema,
} from './schema.ts';
import { setPteroThemeSettings } from './store.ts';

type Option<T extends string> = { value: T; label: string };

/** Admin area -> Extensions -> Pterodactyl Theme, in the stock admin look like every other admin page. */
export default function ConfigurationPage() {
  const { t } = useTranslations();
  const { t: tExt } = useExtTranslations();
  const { addToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<PteroThemeSettings>({
    initialValues: defaultPteroThemeSettings,
    validateInputOnBlur: true,
    validate: zod4Resolver(pteroThemeSettingsFormSchema),
  });

  const showSettings = (settings: PteroThemeSettings) => {
    form.setValues(settings);
    form.resetDirty(settings);
  };

  useEffect(() => {
    getAdminThemeSettings()
      .then((settings) => {
        showSettings(settings);
        setLoaded(true);
      })
      .catch((error) => addToast(httpErrorToHuman(error), 'error'));
  }, []);

  const colorPaletteOptions: Option<PteroColorPalette>[] = [
    { value: 'default', label: tExt('settings.colorPalette.default', {}) },
    { value: 'darker', label: tExt('settings.colorPalette.darker', {}) },
  ];

  const animationSpeedOptions: Option<PteroAnimationSpeed>[] = [
    { value: 'very_slow', label: tExt('settings.animationSpeed.verySlow', {}) },
    { value: 'slow', label: tExt('settings.animationSpeed.slow', {}) },
    { value: 'normal', label: tExt('settings.animationSpeed.normal', {}) },
    { value: 'fast', label: tExt('settings.animationSpeed.fast', {}) },
    { value: 'very_fast', label: tExt('settings.animationSpeed.veryFast', {}) },
  ];

  const footerPositionOptions: Option<PteroFooterPosition>[] = [
    { value: 'bottom', label: tExt('settings.footerPosition.bottom', {}) },
    { value: 'content', label: tExt('settings.footerPosition.content', {}) },
    { value: 'hidden', label: tExt('settings.footerPosition.hidden', {}) },
  ];

  const authHeaderOptions: Option<PteroAuthHeader>[] = [
    { value: 'default', label: tExt('settings.authHeader.default', {}) },
    { value: 'icon_name', label: tExt('settings.authHeader.iconName', {}) },
    { value: 'icon', label: tExt('settings.authHeader.icon', {}) },
    { value: 'name', label: tExt('settings.authHeader.name', {}) },
    { value: 'banner', label: tExt('settings.authHeader.banner', {}) },
    { value: 'banner_name', label: tExt('settings.authHeader.bannerName', {}) },
    { value: 'hidden', label: tExt('settings.authHeader.hidden', {}) },
  ];

  const save = (values: PteroThemeSettings) => {
    setSaving(true);

    updateAdminThemeSettings(values)
      .then((settings) => {
        showSettings(settings);
        // the pages this admin opens next use the new settings right away
        setPteroThemeSettings(settings);
        addToast(tExt('settings.toast.saved', {}), 'success');
      })
      .catch((error) => addToast(httpErrorToHuman(error), 'error'))
      .finally(() => setSaving(false));
  };

  return (
    <TitleCard title={tExt('settings.title', {})}>
      <form onSubmit={form.onSubmit(save)}>
        <Stack>
          <Select
            label={tExt('settings.colorPalette.label', {})}
            description={tExt('settings.colorPalette.description', {})}
            data={colorPaletteOptions}
            disabled={!loaded}
            {...form.getInputProps('colorPalette')}
          />

          <Switch
            label={tExt('settings.animations.label', {})}
            description={tExt('settings.animations.description', {})}
            disabled={!loaded}
            {...form.getInputProps('animations', { type: 'checkbox' })}
          />

          <Select
            label={tExt('settings.animationSpeed.label', {})}
            description={tExt('settings.animationSpeed.description', {})}
            data={animationSpeedOptions}
            disabled={!loaded || !form.values.animations}
            {...form.getInputProps('animationSpeed')}
          />

          <Switch
            label={tExt('settings.loadingBar.label', {})}
            description={tExt('settings.loadingBar.description', {})}
            disabled={!loaded}
            {...form.getInputProps('loadingBar', { type: 'checkbox' })}
          />

          <NumberInput
            label={tExt('settings.loadingBarDelay.label', {})}
            description={tExt('settings.loadingBarDelay.description', {})}
            min={0}
            max={PTERO_MAX_LOADING_BAR_DELAY}
            step={50}
            allowDecimal={false}
            allowNegative={false}
            suffix=' ms'
            disabled={!loaded}
            {...form.getInputProps('loadingBarDelay')}
          />

          <Select
            label={tExt('settings.footerPosition.label', {})}
            description={tExt('settings.footerPosition.description', {})}
            data={footerPositionOptions}
            disabled={!loaded}
            {...form.getInputProps('footerPosition')}
          />

          <TextInput
            label={tExt('settings.footerText.label', {})}
            description={tExt('settings.footerText.description', {
              variables: '{app}, {url}, {year}',
              links: '[text](https://example.com)',
            })}
            placeholder={DEFAULT_FOOTER_TEXT}
            maxLength={PTERO_MAX_FOOTER_TEXT_LENGTH}
            disabled={!loaded || form.values.footerPosition === 'hidden'}
            {...form.getInputProps('footerText')}
          />

          <Select
            label={tExt('settings.authHeader.label', {})}
            description={tExt('settings.authHeader.description', {})}
            data={authHeaderOptions}
            disabled={!loaded}
            {...form.getInputProps('authHeader')}
          />

          <AdminCan action='extensions.manage' cantSave>
            <Button type='submit' loading={saving} disabled={!loaded || !form.isValid()} className='w-fit!'>
              {t('common.button.save', {})}
            </Button>
          </AdminCan>
        </Stack>
      </form>
    </TitleCard>
  );
}
