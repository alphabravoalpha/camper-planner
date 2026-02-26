import { ExternalLink } from 'lucide-react';

interface GearLinkProps {
  href: string;
  children: React.ReactNode;
}

const GearLink: React.FC<GearLinkProps> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="sponsored noopener noreferrer"
    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 underline underline-offset-2 transition-colors"
  >
    {children}
    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
  </a>
);

export default GearLink;
