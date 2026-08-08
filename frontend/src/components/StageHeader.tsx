interface StageHeaderProps {
  stage?: string;
  round?: number;
  title: string;
  subtitle?: string;
}

export function StageHeader({ stage, round, title, subtitle }: StageHeaderProps) {
  return (
    <div className="text-center space-y-1 pt-8 pb-2">
      {(stage || round) && (
        <p className="text-xs font-bold text-primary uppercase tracking-widest">
          {stage}{round ? ` · Round ${round}` : ''}
        </p>
      )}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 font-medium pt-1 max-w-xs mx-auto">{subtitle}</p>}
    </div>
  );
}
