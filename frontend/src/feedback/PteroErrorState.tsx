import { faRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Center, Stack, Text } from '@mantine/core';
import Button from '@/elements/buttons/Button.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { optionalTranslation } from '../compat.ts';
import { useExtTranslations } from '../translations.ts';

/**
 * A list that failed to load: the panel's error state of Calagopus 1.2.7 (elements/feedback/ErrorState.tsx),
 * which 1.2.6 doesn't have (it shows the same, without the retry button, see ErrorItems there).
 */
export default function PteroErrorState({
  error,
  onRetry,
  retrying,
}: {
  error: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const { t } = useTranslations();
  const { t: tExt } = useExtTranslations();

  return (
    <Center py='lg'>
      <Stack align='center' c='red' gap='xs'>
        <FontAwesomeIcon icon={faTriangleExclamation} size='3x' className='-mb-2' />
        <Text fw={500}>{t('common.alert.error', {})}</Text>
        <Text c='dimmed' size='sm' ta='center'>
          {error}
        </Text>
        {onRetry && (
          <Button
            variant='default'
            size='xs'
            mt='xs'
            loading={retrying}
            leftSection={<FontAwesomeIcon icon={faRotateRight} />}
            onClick={onRetry}
          >
            {optionalTranslation(t, 'common.button.retry') ?? tExt('errorState.retry', {})}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
