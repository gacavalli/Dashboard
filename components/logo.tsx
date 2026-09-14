import { cn } from "@/lib/utils"

const LOGO_SRC = "/iga_color_logo.png"

/**
 * Logotipo da marca.
 *
 * A logo colorida é renderizada diretamente para preservar as cores originais
 * do arquivo e acompanhar o tema visual do site.
 */
export function Logo({ className }: { className?: string }) {
  /*
  Implementação anterior com máscara CSS, preservada para facilitar a reversão:

  const LOGO_SRC = "/iga-iso-blanco-1024x776.png"

  return (
    <span
      role="img"
      aria-label="IGA"
      className={cn(
        "block aspect-[128/97] h-9 shrink-0 bg-foreground",
        className
      )}
      style={{
        maskImage: `url(${LOGO_SRC})`,
        WebkitMaskImage: `url(${LOGO_SRC})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  )
  */
  return (
    <img
      src={LOGO_SRC}
      alt="IGA"
      className={cn("block h-9 w-auto shrink-0 object-contain", className)}
    />
  )
}
