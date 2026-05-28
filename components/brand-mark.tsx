import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent ring-1 ring-primary/15",
        className
      )}
    >
      <Image
        src="/brand/olmosq-logo.jpg"
        alt="Olmosq Coffee logo"
        width={72}
        height={72}
        priority
        className={cn("size-full object-cover", imageClassName)}
      />
    </span>
  );
}
