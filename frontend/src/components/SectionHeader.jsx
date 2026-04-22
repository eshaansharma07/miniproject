import { BadgeInfo } from 'lucide-react';

export default function SectionHeader({ eyebrow, title, description, info }) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center">
      <div className="flex items-center justify-center gap-3">
        {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
        {info ? (
          <span className="info-badge" title={info} aria-label={info}>
            <BadgeInfo size={15} />
            <span className="hidden sm:inline">Logic</span>
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-slate-500">{description}</p> : null}
    </div>
  );
}
