import { Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type LinkHref = ComponentProps<typeof Link>['href'];
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

export function ExternalLink({ href, onPress, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as unknown as LinkHref}
      onPress={async (event) => {
        if (typeof window !== 'undefined') {
          // Pre-open a blank tab synchronously to preserve the user-gesture context
          // so popup blockers don't interfere, then navigate it after onPress resolves.
          event.preventDefault();
          const tab = window.open('', '_blank', 'noopener,noreferrer');
          await onPress?.(event);
          if (tab && !tab.closed) {
            tab.location.href = href;
          } else {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
          return;
        }

        await onPress?.(event);
        if ('defaultPrevented' in event && event.defaultPrevented) {
          return;
        }

        // Prevent the default behavior of linking to the default browser on native.
        event.preventDefault();
        // Open the link in an in-app browser.
        await openBrowserAsync(href);
      }}
    />
  );
}
