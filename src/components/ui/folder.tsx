import type { ReactNode } from "react";

/** 3D folder whose sheets fan out on hover/focus of an ancestor `.group`. Colors come from theme tokens. */
export function Folder3D({ children }: { children?: ReactNode }) {
  const sheet = "absolute inset-1 rounded-2xl origin-bottom transition-transform duration-300 ease-out motion-reduce:transition-none";
  return (
    <div className="relative mx-auto h-40 w-60 origin-bottom [perspective:1500px]">
      <div className="relative h-full w-full origin-top rounded-2xl rounded-tl-none bg-primary/70 transition-shadow duration-300 group-hover:shadow-glass after:absolute after:bottom-[99%] after:left-0 after:h-4 after:w-20 after:rounded-t-2xl after:bg-primary/70 after:content-['']" />
      <div className={`${sheet} bg-muted-foreground/60 group-hover:[transform:rotateX(-20deg)] group-focus-visible:[transform:rotateX(-20deg)]`} />
      <div className={`${sheet} bg-muted-foreground/80 group-hover:[transform:rotateX(-30deg)] group-focus-visible:[transform:rotateX(-30deg)]`} />
      <div className={`${sheet} bg-foreground/90 group-hover:[transform:rotateX(-38deg)] group-focus-visible:[transform:rotateX(-38deg)]`} />
      <div className="absolute bottom-0 flex h-[156px] w-full origin-bottom items-end rounded-2xl rounded-tr-none bg-linear-to-t from-primary to-primary/85 p-4 text-primary-foreground transition-transform duration-300 ease-out motion-reduce:transition-none after:absolute after:bottom-[99%] after:right-0 after:h-4 after:w-[146px] after:rounded-t-2xl after:bg-primary/85 after:content-[''] group-hover:[transform:rotateX(-46deg)_translateY(1px)] group-focus-visible:[transform:rotateX(-46deg)_translateY(1px)]">
        {children}
      </div>
    </div>
  );
}
