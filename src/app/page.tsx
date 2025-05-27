// src/app/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import type { AiModel, ModelOutput, ModelLayer, ConfiguredInput } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelUploadArea } from "@/components/features/model-upload/ModelUploadArea";
import { ModelVisualizer } from "@/components/features/model-visualization/ModelVisualizer";
import { InputConfigurator } from "@/components/features/input-configuration/InputConfigurator";
import { OutputDisplay } from "@/components/features/output-display/OutputDisplay";
import { ModelComparisonView } from "@/components/features/model-comparison/ModelComparisonView";
import { UploadCloud, BrainCircuit, SlidersHorizontal, BarChartHorizontalBig, GitCompareArrows } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Mock function to generate architecture
const generateMockArchitecture = (modelName: string, fileType: string): AiModel['architecture'] => {
  const idSuffix = modelName.replace(/\W/g, '').toLowerCase();
  const numLayers = Math.floor(Math.random() * 4) + 2; // 2-5 layers for simplicity
  const layers: ModelLayer[] = [];

  const commonInputShape = ['batch', '3', '224', '224'];
  const commonOutputShape = ['batch', '1000']; // Example for classification

  const inputLayer: ModelLayer = { 
    id: `input-${idSuffix}`, 
    name: 'Input Data', 
    type: 'InputLayer', 
    inputShape: commonInputShape, 
    outputShape: commonInputShape 
  };
  layers.push(inputLayer);

  let prevLayer = inputLayer;
  for (let i = 0; i < numLayers; i++) {
    const layerTypes = ['Conv2D', 'ReLU', 'MaxPool2D', 'Linear', 'BatchNorm', 'Dropout', 'Attention'];
    const type = layerTypes[Math.floor(Math.random() * layerTypes.length)];
    const currentLayer: ModelLayer = {
      id: `${type.toLowerCase().replace('2d','')}-${i}-${idSuffix}`,
      name: `${type} ${i + 1}`,
      type: type,
      params: { info: `Mock parameters for ${type}`, units: Math.pow(2, Math.floor(Math.random()*5)+5) }, // e.g. 32 to 512 units
      inputShape: prevLayer.outputShape,
      outputShape: (type === 'Linear' && i === numLayers -1 ) ? commonOutputShape : [`batch`, `features_${i+1}` , `${Math.floor(Math.random()*100)+100}`, `${Math.floor(Math.random()*100)+100}`]
    };
    layers.push(currentLayer);
    prevLayer = currentLayer;
  }
  
  // Simplified connections: linear chain
  const connections = layers.slice(0, -1).map((layer, i) => ({
    fromLayerId: layer.id,
    toLayerId: layers[i+1].id,
  }));

  return {
    layers,
    connections,
    inputs: [{ name: 'input_tensor_1', shape: commonInputShape.join(','), dtype: 'float32' }],
    outputs: [{ name: 'output_tensor_1', shape: commonOutputShape.join(','), dtype: 'float32' }],
  };
};

// Mock function to generate output
const generateMockOutput = (modelId: string, inputs?: ConfiguredInput[]): ModelOutput => {
  const outputTypes: ModelOutput['type'][] = ['text', 'image', 'vector', 'json'];
  const randomType = outputTypes[Math.floor(Math.random() * outputTypes.length)];
  let data: any;
  switch (randomType) {
    case 'text': data = `Mock text output for model ${modelId.substring(0,5)} with inputs: ${inputs ? inputs.map(i=>i.inputName).join(', ') : 'N/A'}. Lorem ipsum dolor sit amet.`; break;
    case 'image': data = `https://placehold.co/600x400.png?text=Output+${modelId.substring(0,5)}`; break;
    case 'vector': data = Array.from({ length: Math.floor(Math.random() * 5) + 3 }, () => parseFloat(Math.random().toFixed(4))); break; // 3-7 elements
    case 'json': data = { prediction: Math.random().toFixed(4), confidence: Math.random().toFixed(2), class: `class_${Math.floor(Math.random()*10)}`}; break;
    default: data = "Unknown output type";
  }
  return { type: randomType, data, modelId };
};


export default function ModelVersePage() {
  const [uploadedModels, setUploadedModels] = useState<AiModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [currentInputs, setCurrentInputs] = useState<ConfiguredInput[] | null>(null);
  const [modelOutputs, setModelOutputs] = useState<Record<string, ModelOutput | null>>({}); // modelId -> output
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { toast } = useToast();

  const selectedModel = useMemo(() => {
    return uploadedModels.find(m => m.id === selectedModelId) || null;
  }, [uploadedModels, selectedModelId]);

  const handleModelsUploaded = (files: File[]) => {
    const newModels: AiModel[] = files.map(file => {
      const id = `${file.name}-${Date.now()}`;
      return {
        id,
        name: file.name,
        fileType: file.name.split('.').pop() || 'unknown',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        architecture: generateMockArchitecture(file.name, file.type),
        // rawFile: file, // Store if needed for actual processing
      };
    });
    setUploadedModels(prev => [...prev, ...newModels]);
    if (newModels.length > 0 && !selectedModelId) {
      setSelectedModelId(newModels[0].id); // Auto-select first uploaded model
    }
    toast({ title: "Models Processed", description: `${newModels.length} model(s) added with mock architectures.` });
    if (newModels.length > 0) setActiveTab("visualize"); // Switch to visualize tab
  };

  const handleRemoveModel = (modelIdToRemove: string) => {
    setUploadedModels(prev => prev.filter(m => m.id !== modelIdToRemove));
    if (selectedModelId === modelIdToRemove) {
      setSelectedModelId(null);
      setCurrentInputs(null);
      setModelOutputs(prev => ({...prev, [modelIdToRemove]: null}));
    }
    toast({ title: "Model Removed", description: `Model with ID ${modelIdToRemove.substring(0,8)} removed.` });
  };

  const handleSelectModel = (modelIdToSelect: string) => {
    setSelectedModelId(modelIdToSelect);
    setCurrentInputs(null); // Reset inputs when model changes
    // Don't reset output for this model, it might already be there
    setActiveTab("visualize"); // Switch to visualize tab
  };
  
  const handleInputsConfigured = (configs: ConfiguredInput[]) => {
    if (!selectedModel) {
      toast({ title: "Error", description: "No model selected to configure inputs for.", variant: "destructive" });
      return;
    }
    setCurrentInputs(configs); // Store all configs, even if for multiple inputs
    
    // Generate mock output for the selected model based on these new inputs
    const newOutput = generateMockOutput(selectedModel.id, configs);
    setModelOutputs(prev => ({ ...prev, [selectedModel.id!]: newOutput }));
    
    toast({ title: "Inputs Applied", description: `Inputs configured for ${selectedModel.name}. Mock output generated.` });
    setActiveTab("output"); // Switch to output tab
  };

  const handleRunModel = () => {
    if (!selectedModel) {
      toast({ title: "No Model Selected", description: "Please select a model to run.", variant: "destructive" });
      return;
    }
    if (!currentInputs || currentInputs.length === 0) {
      toast({ title: "Inputs Not Configured", description: `Please configure inputs for ${selectedModel.name} first.`, variant: "destructive" });
      setActiveTab("configure");
      return;
    }
    // Re-generate mock output
    const newOutput = generateMockOutput(selectedModel.id, currentInputs);
    setModelOutputs(prev => ({ ...prev, [selectedModel.id!]: newOutput }));
    toast({ title: "Model Simulation Run", description: `Mock output generated for ${selectedModel.name}.` });
    setActiveTab("output");
  };

  const tabsConfig = [
    { value: "upload", label: "Upload", icon: UploadCloud, content: (
      <ModelUploadArea
        uploadedModels={uploadedModels}
        onModelsUploaded={handleModelsUploaded}
        onRemoveModel={handleRemoveModel}
        onSelectModel={handleSelectModel}
        selectedModelId={selectedModelId}
      />
    )},
    { value: "visualize", label: "Visualize", icon: BrainCircuit, content: (
      <ModelVisualizer model={selectedModel} />
    ), disabled: !selectedModel },
    { value: "configure", label: "Configure Inputs", icon: SlidersHorizontal, content: (
      <InputConfigurator model={selectedModel} onInputsConfigured={handleInputsConfigured} />
    ), disabled: !selectedModel },
    { value: "output", label: "View Output", icon: BarChartHorizontalBig, content: (
      <>
        {selectedModel && currentInputs && (
           <Button onClick={handleRunModel} className="mb-4">Re-run Simulation with Current Inputs</Button>
        )}
        <OutputDisplay output={selectedModel ? modelOutputs[selectedModel.id] : null} modelName={selectedModel?.name} />
      </>
    ), disabled: !selectedModel },
    { value: "compare", label: "Compare Models", icon: GitCompareArrows, content: (
      <ModelComparisonView uploadedModels={uploadedModels} modelOutputs={modelOutputs} />
    ), disabled: uploadedModels.length < 2 },
  ];

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
          {tabsConfig.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabsConfig.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
