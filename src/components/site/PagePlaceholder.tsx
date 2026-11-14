// Temporary content for site pages that haven't been designed yet.
export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="site-container flex min-h-[60vh] flex-col justify-center py-24">
      <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-sm">{eyebrow}</p>
      <h1 className="mt-4 max-w-4xl text-[30px] font-bold tracking-tight text-white sm:text-6xl">{title}</h1>
      <p className="mt-6 max-w-2xl text-xs leading-5 text-neutral-400 sm:leading-7 sm:text-lg">{description}</p>
      <p className="mt-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-400 sm:px-4 sm:py-1.5 sm:text-sm">
        <span className="size-1.5 rounded-full bg-neutral-500" aria-hidden />
        Page coming soon
      </p>
    </section>
  );
}
