type PlaceholderRouteProps = {
  title: string;
  description: string;
};

export default function PlaceholderRoute({ title, description }: PlaceholderRouteProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-black text-white/90">{title}</div>
      <div className="mt-2 max-w-2xl text-sm leading-6 text-white/45">{description}</div>
    </div>
  );
}
