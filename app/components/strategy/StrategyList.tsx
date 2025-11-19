'use client';

import { useStrategies } from '@/hooks/use-strategies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Play, Pause, Archive } from 'lucide-react';
import { Strategy } from '@/lib/api/architect';

interface StrategyListProps {
  status?: 'draft' | 'active' | 'paused' | 'archived';
}

export function StrategyList({ status }: StrategyListProps) {
  const { strategies, isLoading, error, deleteStrategy } = useStrategies({ status });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-2/3 mb-4" />
              <div className="h-8 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Error loading strategies: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (strategies.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {status === 'active' 
                ? 'No active strategies. Deploy a strategy to start trading!'
                : 'No strategies yet. Create your first strategy with Prophet AI!'}
            </p>
            <Button>Create Strategy</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = async (strategy: Strategy) => {
    if (confirm(`Delete "${strategy.name}"? This cannot be undone.`)) {
      try {
        await deleteStrategy(strategy.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const getStatusBadge = (status: Strategy['status']) => {
    const variants: Record<string, any> = {
      active: 'default',
      draft: 'secondary',
      paused: 'outline',
      archived: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {strategies.map((strategy) => (
        <Card key={strategy.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{strategy.name}</CardTitle>
              {getStatusBadge(strategy.status)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {strategy.description}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Version:</span>
              <Badge variant="outline">{strategy.version}</Badge>

              <span className="text-xs text-muted-foreground ml-4">Plugins:</span>
              {strategy.base_plugins.map((plugin) => (
                <Badge key={plugin} variant="secondary">
                  {plugin}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              {strategy.status === 'draft' && (
                <Button size="sm" variant="default">
                  <Play className="h-4 w-4 mr-2" />
                  Deploy
                </Button>
              )}
              {strategy.status === 'active' && (
                <Button size="sm" variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(strategy)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
