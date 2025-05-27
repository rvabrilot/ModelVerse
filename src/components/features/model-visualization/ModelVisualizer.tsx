// src/components/features/model-visualization/ModelVisualizer.tsx
"use client";
import type { AiModel, ModelLayer, ModelInputOutput } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDown, Network, ZoomIn, ZoomOut, Move, Shapes, Binary, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ModelVisualizerProps {
  model?: AiModel | null;
  className?: string;
}

const LayerCard: React.FC<{ layer: ModelLayer, isFirst: boolean, isLast: boolean }> = ({ layer, isFirst, isLast }) => (
  <Card className="mb-2 shadow-md bg-card/80 backdrop-blur-sm">
    <CardHeader className="p-3">
      <CardTitle className="text-base flex items-center justify-between">
        <span className="truncate" title={layer.name}>{layer.name}</span>
        <Badge variant="secondary" className="ml-2 whitespace-nowrap">{layer.type}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 text-xs space-y-1">
      {layer.inputShape && <p>Input: <span className="font-mono">{layer.inputShape.join(' x ')}</span></p>}
      {layer.outputShape && <p>Output: <span className="font-mono">{layer.outputShape.join(' x ')}</span></p>}
      {layer.params && Object.keys(layer.params).length > 0 && (
        <div className="pt-1">
          <h4 className="font-medium">Params:</h4>
          <ul className="list-disc list-inside">
            {Object.entries(layer.params).slice(0,3).map(([key, value]) => (
              <li key={key} className="truncate" title={`${key}: ${JSON.stringify(value)}`}>
                {key}: <span className="font-mono">{JSON.stringify(value)}</span>
              </li>
            ))}
            {Object.keys(layer.params).length > 3 && <li>...and more</li>}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>
);

const IOPoint: React.FC<{ point: ModelInputOutput, type: 'Input' | 'Output' }> = ({ point, type }) => (
  <Card className="mb-2 shadow-sm bg-card/70">
    <CardHeader className="p-3">
      <CardTitle className="text-sm flex items-center">
        {type === 'Input' ? <Shapes className="w-4 h-4 mr-2 text-green-400" /> : <Binary className="w-4 h-4 mr-2 text-blue-400" />}
        {type}: {point.name}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 text-xs">
      <p>Shape: <span className="font-mono">{point.shape}</span></p>
      <p>DType: <span className="font-mono">{point.dtype}</span></p>
    </CardContent>
  </Card>
);

export function ModelVisualizer({ model, className }: ModelVisualizerProps) {
  if (!model || !model.architecture) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center"><Network className="w-6 h-6 mr-2 text-primary" /> Model Architecture</CardTitle>
          <CardDescription>Select a model to visualize its structure.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Image src="https://placehold.co/300x200.png" alt="Placeholder graph" width={300} height={200} data-ai-hint="neural network graph" className="opacity-30 rounded-md"/>
          <p className="mt-4">No model selected or architecture unavailable.</p>
        </CardContent>
      </Card>
    );
  }

  const { layers, inputs, outputs } = model.architecture;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Network className="w-6 h-6 mr-2 text-primary" />
            <span>{model.name} - Architecture</span>
          </div>
          <TooltipProvider>
            <div className="flex space-x-1">
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" disabled><ZoomIn className="w-4 h-4"/></Button></TooltipTrigger>
                <TooltipContent><p>Zoom In (disabled)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" disabled><ZoomOut className="w-4 h-4"/></Button></TooltipTrigger>
                <TooltipContent><p>Zoom Out (disabled)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" disabled><Move className="w-4 h-4"/></Button></TooltipTrigger>
                <TooltipContent><p>Pan (disabled)</p></TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>A simplified view of the model layers and connections.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] p-1 pr-3"> {/* Adjust height as needed */}
          <div className="relative">
            {inputs.map(input => <IOPoint key={`input-${input.name}`} point={input} type="Input" />)}
            
            {layers.map((layer, index) => (
              <div key={layer.id} className="relative">
                {(index > 0 || inputs.length > 0) && ( // Show arrow if not the very first element overall
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <LayerCard layer={layer} isFirst={index === 0} isLast={index === layers.length - 1} />
              </div>
            ))}

            {layers.length > 0 && outputs.length > 0 && (
              <div className="flex justify-center my-1">
                 <ArrowDown className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            {outputs.map(output => <IOPoint key={`output-${output.name}`} point={output} type="Output" />)}
          </div>
        </ScrollArea>
        <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs">
          <p className="flex items-center"><Info className="w-4 h-4 mr-2 text-accent" />
            This is a conceptual representation. Actual model graphs can be much more complex.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
