import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export type FeatureLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  withCard?: boolean;
};

/**
 * Feature layout - Wrapper for individual feature sections
 * Can be used for Market, Admin, Chat, Predictions, etc.
 */
export function FeatureLayout({
  title,
  description,
  children,
  actions,
  withCard = true,
}: FeatureLayoutProps) {
  const content = (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Content */}
      {children}
    </>
  );

  if (withCard) {
    return (
      <Card>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    );
  }

  return <div>{content}</div>;
}
