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
        await onPress?.(event);
        if ('defaultPrevented' in event && event.defaultPrevented) {
          return;
        }

        if (typeof window !== 'undefined') {
          event.preventDefault();
          window.open(href, '_blank', 'noopener,noreferrer');
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
