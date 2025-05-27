// src/components/features/model-upload/ModelUploadArea.tsx
"use client";
import React from 'react';
import type { AiModel } from '@/types';
import { FileUploadZone } from '@/components/shared/FileUploadZone';
import { ModelCard } from '@/components/shared/ModelCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModelUploadAreaProps {
  uploadedModels: AiModel[];
  onModelsUploaded: (files: File[]) => void;
  onRemoveModel: (modelId: string) => void;
  onSelectModel: (modelId: string) => void;
  selectedModelId?: string | null;
}

export function ModelUploadArea({
  uploadedModels,
  onModelsUploaded,
  onRemoveModel,
  onSelectModel,
  selectedModelId,
}: ModelUploadAreaProps) {
  return (
    <div className="space-y-6">
      <FileUploadZone
        onFilesAccepted={onModelsUploaded}
        acceptedFileTypes=".pt,.onnx,.tf,.pb,.h5"
        label="Upload AI Model Files"
        description="Supported formats: PyTorch (.pt), ONNX (.onnx), TensorFlow (.pb, .h5, .tf saved model directory - zip directory before upload)"
        maxFiles={10} // Allow uploading multiple models
      />
      {uploadedModels.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Uploaded Models</h3>
          <ScrollArea className="h-[calc(100vh-400px)] sm:h-[300px] pr-3"> {/* Adjust height as needed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onRemove={onRemoveModel}
                  onSelect={onSelectModel}
                  isSelected={model.id === selectedModelId}
                />
              ))}
            </div>
          </ScrollArea>
           {uploadedModels.length > 1 && (
            <p className="text-xs text-muted-foreground mt-2">Select a model to visualize its architecture or configure inputs.</p>
          )}
           {uploadedModels.length === 1 && !selectedModelId && (
            <p className="text-xs text-muted-foreground mt-2">Click the model card to visualize its architecture or configure inputs.</p>
          )}
        </div>
      )}
    </div>
  );
}
