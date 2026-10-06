import { faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Popover } from '@mantine/core';
import classNames from 'classnames';
import type { ComponentProps } from 'react';
import Button from '@/elements/buttons/Button.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import Card from '@/elements/data-display/Card.tsx';
// inside this file the path resolves to the stock component, see overrides.ts
import StatCard from '@/elements/data-display/StatCard.tsx';
import ThemeIcon from '@/elements/data-display/ThemeIcon.tsx';
import RedactedText from '@/elements/typography/RedactedText.tsx';
import { usageColor } from '@/lib/format/usage.ts';
import { usePteroThemeActive } from '../scope.tsx';

type Props = ComponentProps<typeof StatCard>;

/**
 * The stat cards of the console and database pages (elements/data-display/StatCard.tsx) like
 * Pterodactyl's StatBlock: a value too long for the card is cut off instead of scrolling sideways, and
 * the details (the network speeds) get their own line below it. Off the themed pages, the stock card.
 */
export default function PteroStatCard(props: Props) {
  return usePteroThemeActive() ? <PteroStatBlock {...props} /> : <StatCard {...props} />;
}

function PteroStatBlock({
  icon,
  label,
  value,
  order,
  className,
  copyOnClick,
  popover,
  popoverIcon = faCog,
  limit,
  details,
  progress,
  total,
  valueColor,
  redact,
}: Props) {
  const displayValue = redact ? <RedactedText value={value} /> : value;
  const color = usageColor(progress, total);

  const valueLine = (
    <>
      {displayValue} {limit && <span className='text-sm text-(--mantine-color-dimmed)'>/ {limit}</span>}
    </>
  );

  return (
    <Card className={className} style={{ order }} progress={progress} total={total} progressColor={color}>
      <div className='flex flex-row items-center'>
        {icon && (
          <ThemeIcon size='xl' radius='md' color={color}>
            <FontAwesomeIcon size='xl' icon={icon} />
          </ThemeIcon>
        )}
        <div className={classNames('flex flex-col w-full min-w-0', icon && 'ml-4')}>
          <div className='w-full flex justify-between'>
            <span className='text-sm text-left text-(--mantine-color-dimmed) font-bold'>{label}</span>
            {popover && (
              <Popover position='bottom' withArrow shadow='md'>
                <Popover.Target>
                  <Button variant='transparent' size='compact-xs'>
                    <FontAwesomeIcon size='lg' icon={popoverIcon} />
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>{popover}</Popover.Dropdown>
              </Popover>
            )}
          </div>
          <span
            className='ptero-stat-value text-lg font-bold'
            style={valueColor ? { color: `var(--mantine-color-${valueColor}-text)` } : undefined}
          >
            {copyOnClick ? (
              <CopyOnClick content={value} className='text-left'>
                {valueLine}
              </CopyOnClick>
            ) : (
              valueLine
            )}
          </span>
          {details && <div className='ptero-stat-details'>{details}</div>}
        </div>
      </div>
    </Card>
  );
}
