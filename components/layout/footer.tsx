import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-surface-1">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <p className="text-sm text-neutral-500">
          Court of Agents &mdash; Powered by{" "}
          <Link
            href="https://www.genlayer.com"
            target="_blank"
            className="text-brand-600 hover:underline"
          >
            GenLayer
          </Link>
        </p>
        <div className="flex gap-4">
          <Link
            href="https://docs.genlayer.com"
            target="_blank"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Docs
          </Link>
          <Link
            href="https://studionet.genlayer.com"
            target="_blank"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            StudioNet
          </Link>
        </div>
      </div>
    </footer>
  );
}
