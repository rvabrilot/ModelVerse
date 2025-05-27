// src/components/features/output-display/OutputDisplay.tsx
"use client";
import type { AiModel, ModelOutput } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChartHorizontalBig, FileText, ImageIcon, Code, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OutputDisplayProps {
  output?: ModelOutput | null;
  modelName?: string;
  className?: string;
}

export function OutputDisplay({ output, modelName, className }: OutputDisplayProps) {
  const renderOutputData = () => {
    if (!output || !output.data) {
      return <p className="text-sm text-muted-foreground">No output data to display. Run the model with configured inputs.</p>;
    }

    switch (output.type) {
      case 'text':
        return (
          <ScrollArea className="h-48 p-2 border rounded-md bg-background">
            <pre className="text-sm whitespace-pre-wrap">{String(output.data)}</pre>
          </ScrollArea>
        );
      case 'image':
        return (
          <div className="relative w-full max-w-md aspect-video border rounded-md overflow-hidden mx-auto">
            <Image 
              src={output.data as string} // Assuming data is a URL for placeholder
              alt="Model Output Image" 
              layout="fill" 
              objectFit="contain"
              data-ai-hint="abstract visualization"
            />
          </div>
        );
      case 'vector':
        return (
          <ScrollArea className="h-48 p-2 border rounded-md bg-background">
            <p className="text-sm font-semibold mb-1">Vector (first 10 elements):</p>
            <pre className="text-sm">
              {Array.isArray(output.data) ? `[${output.data.slice(0, 10).join(', ')}${output.data.length > 10 ? ', ...' : ''}]` : String(output.data)}
            </pre>
            {Array.isArray(output.data) && <p className="text-xs mt-1">Total elements: {output.data.length}</p>}
          </ScrollArea>
        );
      case 'json':
        return (
          <ScrollArea className="h-48 p-2 border rounded-md bg-background">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(output.data, null, 2)}
            </pre>
          </ScrollArea>
        );
      default:
        return (
          <div className="flex items-center text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Unsupported output type or data format.
            <pre className="text-xs whitespace-pre-wrap mt-2 p-2 border rounded bg-destructive/10">
              {JSON.stringify(output.data, null, 2).substring(0, 200)}...
            </pre>
          </div>
        );
    }
  };

  const getIconForOutputType = () => {
    if (!output) return <BarChartHorizontalBig className="w-6 h-6 mr-2 text-primary" />;
    switch (output.type) {
      case 'text': return <FileText className="w-6 h-6 mr-2 text-primary" />;
      case 'image': return <ImageIcon className="w-6 h-6 mr-2 text-primary" />;
      case 'vector': return <BarChartHorizontalBig className="w-6 h-6 mr-2 text-primary" />;
      case 'json': return <Code className="w-6 h-6 mr-2 text-primary" />;
      default: return <AlertTriangle className="w-6 h-6 mr-2 text-destructive" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {getIconForOutputType()}
          Model Output {modelName && `for ${modelName}`}
        </CardTitle>
        <CardDescription>
          {output ? `Displaying output of type: ${output.type}` : "Outputs will appear here after model execution."}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[200px]">
        {renderOutputData()}
      </CardContent>
    </Card>
  );
}
