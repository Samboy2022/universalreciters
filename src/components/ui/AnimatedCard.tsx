import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export const AnimatedCard = ({ 
  children, 
  className, 
  delay = 0, 
  hover = true 
}: AnimatedCardProps) => {
  return (
    <Card 
      className={cn(
        "animate-fade-in opacity-0 [animation-fill-mode:forwards]",
        hover && "hover:shadow-glow hover:-translate-y-1 transition-all duration-300 cursor-pointer",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
};