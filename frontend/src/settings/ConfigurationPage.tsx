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
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useExtTranslations } from '../translations.ts';
import { getAdminThemeSettings, updateAdminThemeSettings } from './api.ts';
import {
  defaultPteroThemeSettings,
  type PteroAnimationSpeed,
  type PteroThemeSettings,
  pteroThemeSettingsSchema,
} from './schema.ts';
import { setPteroThemeSettings } from './store.ts';

/** admin area -> Extensions -> Pterodactyl Theme, uses the stock admin look like every other admin page */
export default function ConfigurationPage() {
  const { t } = useTranslations();
  const { t: tExt } = useExtTranslations();
  const { addToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<PteroThemeSettings>({
    initialValues: defaultPteroThemeSettings,
    validateInputOnBlur: true,
    validate: zod4Resolver(pteroThemeSettingsSchema),
  });

  useEffect(() => {
    getAdminThemeSettings()
      .then((settings) => {
        form.setValues(settings);
        form.resetDirty(settings);
        setLoaded(true);
      })
      .catch((error) => addToast(httpErrorToHuman(error), 'error'));
  }, []);

  const speedOptions: { value: PteroAnimationSpeed; label: string }[] = [
    { value: 'very_slow', label: tExt('settings.animationSpeed.verySlow', {}) },
    { value: 'slow', label: tExt('settings.animationSpeed.slow', {}) },
    { value: 'normal', label: tExt('settings.animationSpeed.normal', {}) },
    { value: 'fast', label: tExt('settings.animationSpeed.fast', {}) },
    { value: 'very_fast', label: tExt('settings.animationSpeed.veryFast', {}) },
  ];

  const doSave = (values: PteroThemeSettings) => {
    setLoading(true);

    updateAdminThemeSettings(values)
      .then((settings) => {
        form.setValues(settings);
        form.resetDirty(settings);
        // the pages this admin opens next use the new settings right away
        setPteroThemeSettings(settings);
        addToast(tExt('settings.toast.saved', {}), 'success');
      })
      .catch((error) => addToast(httpErrorToHuman(error), 'error'))
      .finally(() => setLoading(false));
  };

  return (
    <TitleCard title={tExt('settings.title', {})}>
      <form onSubmit={form.onSubmit(doSave)}>
        <Stack>
          <Switch
            label={tExt('settings.animations.label', {})}
            description={tExt('settings.animations.description', {})}
            disabled={!loaded}
            {...form.getInputProps('animations', { type: 'checkbox' })}
          />

          <Select
            label={tExt('settings.animationSpeed.label', {})}
            description={tExt('settings.animationSpeed.description', {})}
            data={speedOptions}
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
            max={10_000}
            step={50}
            allowDecimal={false}
            allowNegative={false}
            suffix=' ms'
            disabled={!loaded || !form.values.loadingBar}
            {...form.getInputProps('loadingBarDelay')}
          />

          <AdminCan action='extensions.manage' cantSave>
            <Button type='submit' loading={loading} disabled={!loaded || !form.isValid()} className='w-fit!'>
              {t('common.button.save', {})}
            </Button>
          </AdminCan>
        </Stack>
      </form>
    </TitleCard>
  );
}
