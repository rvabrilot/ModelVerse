// src/components/features/model-comparison/ModelComparisonView.tsx
"use client";
import React, { useState } from 'react';
import type { AiModel, ModelOutput } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModelVisualizer } from '@/components/features/model-visualization/ModelVisualizer';
import { OutputDisplay } from '@/components/features/output-display/OutputDisplay';
import { GitCompareArrows, Info } from 'lucide-react';
import Image from 'next/image';

interface ModelComparisonViewProps {
  uploadedModels: AiModel[];
  // In a real app, you'd fetch or pass outputs for these models
  modelOutputs: Record<string, ModelOutput | null>; // modelId -> output
  className?: string;
}

export function ModelComparisonView({ uploadedModels, modelOutputs, className }: ModelComparisonViewProps) {
  const [selectedModelId1, setSelectedModelId1] = useState<string | null>(null);
  const [selectedModelId2, setSelectedModelId2] = useState<string | null>(null);

  const model1 = uploadedModels.find(m => m.id === selectedModelId1);
  const model2 = uploadedModels.find(m => m.id === selectedModelId2);

  const output1 = selectedModelId1 ? modelOutputs[selectedModelId1] : null;
  const output2 = selectedModelId2 ? modelOutputs[selectedModelId2] : null;

  if (uploadedModels.length < 2) {
     return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center"><GitCompareArrows className="w-6 h-6 mr-2 text-primary" /> Model Comparison</CardTitle>
          <CardDescription>Upload at least two models to compare them.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Image src="https://placehold.co/300x200.png" alt="Placeholder comparison" width={300} height={200} data-ai-hint="side by side charts" className="opacity-30 rounded-md"/>
          <p className="mt-4">Please upload more models to enable comparison.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center"><GitCompareArrows className="w-6 h-6 mr-2 text-primary" /> Model Comparison</CardTitle>
        <CardDescription>Select two models to compare their architectures and outputs side-by-side.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label htmlFor="select-model-1" className="block text-sm font-medium mb-1">Select Model 1</label>
            <Select onValueChange={setSelectedModelId1} value={selectedModelId1 || undefined}>
              <SelectTrigger id="select-model-1" aria-label="Select first model for comparison">
                <SelectValue placeholder="Choose Model 1" />
              </SelectTrigger>
              <SelectContent>
                {uploadedModels.filter(m => m.id !== selectedModelId2).map(model => (
                  <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="select-model-2" className="block text-sm font-medium mb-1">Select Model 2</label>
            <Select onValueChange={setSelectedModelId2} value={selectedModelId2 || undefined}>
              <SelectTrigger id="select-model-2" aria-label="Select second model for comparison">
                <SelectValue placeholder="Choose Model 2" />
              </SelectTrigger>
              <SelectContent>
                {uploadedModels.filter(m => m.id !== selectedModelId1).map(model => (
                  <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(model1 || model2) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">{model1?.name || "Model 1 Details"}</h3>
              {model1 ? <ModelVisualizer model={model1} className="h-auto"/> : <div className="p-4 border rounded-md text-center text-muted-foreground">Select Model 1 to see details.</div>}
              {model1 && <OutputDisplay output={output1} modelName={model1.name} className="h-auto"/>}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">{model2?.name || "Model 2 Details"}</h3>
              {model2 ? <ModelVisualizer model={model2} className="h-auto"/> : <div className="p-4 border rounded-md text-center text-muted-foreground">Select Model 2 to see details.</div>}
              {model2 && <OutputDisplay output={output2} modelName={model2.name} className="h-auto"/>}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>Please select two models from the dropdowns above to start comparison.</p>
          </div>
        )}
        <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs">
          <p className="flex items-center"><Info className="w-4 h-4 mr-2 text-accent" />
            Outputs displayed are mock data. Comparison helps identify architectural differences and potential for ensembling.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
