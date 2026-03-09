import { cn } from "@/lib/utils";
import { useCMSSettings } from "@/hooks/useCMSSettings";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const { data: settings } = useCMSSettings();

  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const logoUrl = settings?.logo_url;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={settings?.site_name || "Logo"}
          className={cn("object-contain rounded-xl", sizes[size])}
        />
      ) : (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-xl bg-primary shadow-glow",
            sizes[size]
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-2/3 h-2/3 text-primary-foreground"
            fill="currentColor"
          >
            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
          </svg>
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full shadow-gold" />
        </div>
      )}
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-semibold leading-tight text-foreground",
              textSizes[size]
            )}
          >
            {settings?.site_name || "Universal"}
          </span>
          <span className="text-xs font-medium text-primary">
            {settings?.site_tagline || "Reciters"}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
