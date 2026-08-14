import React from 'react';
import { Smartphone, CheckCircle, Monitor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { isCapacitorNative, getCapacitorPlatform } from '../../../lib/capacitor';

export const CapacitorBridgeStatus: React.FC = () => {
  const isNative = isCapacitorNative();
  const platform = getCapacitorPlatform();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Platform Mobile Status</CardTitle>
        <CardDescription>
          Parallel is built from day one to run identically on Web, iOS, and Android.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-background-elevated border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-purple/15 text-brand-purple-light">
              {isNative ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">Current Environment</div>
              <div className="text-[11px] text-text-muted capitalize">
                {platform} {isNative ? '(Native App Shell)' : '(Desktop/Mobile Web)'}
              </div>
            </div>
          </div>
          <Badge variant="working" size="sm" dot>
            Ready
          </Badge>
        </div>

        <div className="p-3.5 rounded-xl bg-background-deep text-xs text-text-secondary border border-border flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
          <span>
            Safe-area insets, touch target sizing (≥44px), and offline resilience are active across all pages.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
