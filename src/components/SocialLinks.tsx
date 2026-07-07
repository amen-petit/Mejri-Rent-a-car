"use client";

/**
 * Renders the configured social media links. URLs come from the central
 * SOCIAL_LINKS config, so a client without (say) an Instagram page simply omits
 * that icon. Shared by the navbar and footer to avoid duplication.
 */
import { SOCIAL_LINKS } from "@/lib/constants";
import { useI18n } from "@/i18n/client";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";

type Props = {
  /** Extra classes for each icon anchor (color/hover come from the parent). */
  className?: string;
  iconSize?: number;
};

export default function SocialLinks({ className = "", iconSize = 18 }: Props) {
  const { t } = useI18n();

  const links = [
    {
      href: SOCIAL_LINKS.facebook,
      label: t.nav.followFacebook,
      Icon: FacebookIcon,
    },
    {
      href: SOCIAL_LINKS.instagram,
      label: t.nav.followInstagram,
      Icon: InstagramIcon,
    },
  ].filter((link) => link.href);

  if (links.length === 0) return null;

  return (
    <>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={className}
        >
          <Icon size={iconSize} />
        </a>
      ))}
    </>
  );
}
