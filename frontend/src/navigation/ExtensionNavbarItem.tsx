import { Tooltip, type TransitionOverride } from '@mantine/core';
import { Component, type ReactNode } from 'react';
import { Link } from 'react-router';
import { LOG_PREFIX } from '../core/constants.ts';
import { isWithinLink } from '../core/paths.ts';
import type { PteroNavbarItem } from '../extensionApi/navbarItems.ts';

interface BoundaryProps {
  item: PteroNavbarItem;
  children: ReactNode;
}

interface BoundaryState {
  item: PteroNavbarItem;
  failed: boolean;
}

/** An icon of another extension that fails to render is left out, instead of taking down the whole bar. */
class NavbarItemBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { item: this.props.item, failed: false };

  // a replacement with the same id gets a new try
  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): Partial<BoundaryState> | null {
    return props.item === state.item ? null : { item: props.item, failed: false };
  }

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failed: true };
  }

  override componentDidCatch(error: Error) {
    console.error(`${LOG_PREFIX} navbar item "${this.props.item.id}" failed to render`, error);
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function isItemActive(item: PteroNavbarItem, pathname: string): boolean {
  try {
    if (item.isActive) return item.isActive(pathname);
    return item.to ? isWithinLink(pathname, item.to) : false;
  } catch (error) {
    console.error(`${LOG_PREFIX} isActive of navbar item "${item.id}" failed`, error);
    return false;
  }
}

function NavbarItemLink({
  item,
  pathname,
  transitionProps,
}: {
  item: PteroNavbarItem;
  pathname: string;
  transitionProps: TransitionOverride;
}) {
  const className = isItemActive(item, pathname) ? 'active' : undefined;

  return (
    <Tooltip label={item.label} position='bottom' transitionProps={transitionProps}>
      {item.to ? (
        <Link to={item.to} aria-label={item.label} className={className}>
          {item.icon}
        </Link>
      ) : item.href ? (
        <a href={item.href} target='_blank' rel='noopener noreferrer' aria-label={item.label} className={className}>
          {item.icon}
        </a>
      ) : (
        <button type='button' aria-label={item.label} className={className} onClick={item.onClick}>
          {item.icon}
        </button>
      )}
    </Tooltip>
  );
}

/** An icon another extension added to the top bar (extensionApi/navbarItems.ts). */
export default function ExtensionNavbarItem(props: {
  item: PteroNavbarItem;
  pathname: string;
  transitionProps: TransitionOverride;
}) {
  return (
    <NavbarItemBoundary item={props.item}>
      <NavbarItemLink {...props} />
    </NavbarItemBoundary>
  );
}
