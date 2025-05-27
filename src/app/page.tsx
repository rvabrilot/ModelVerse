// src/app/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import type { AiModel, ModelOutput, ModelLayer, ConfiguredInput, ModelArchitecture, ModelInputOutput } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelUploadArea } from "@/components/features/model-upload/ModelUploadArea";
import { ModelVisualizer } from "@/components/features/model-visualization/ModelVisualizer";
import { InputConfigurator } from "@/components/features/input-configuration/InputConfigurator";
import { OutputDisplay } from "@/components/features/output-display/OutputDisplay";
import { ModelComparisonView } from "@/components/features/model-comparison/ModelComparisonView";
import { UploadCloud, BrainCircuit, SlidersHorizontal, BarChartHorizontalBig, GitCompareArrows } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { InferenceSession, Tensor } from 'onnxruntime-web';

// Mock function to generate architecture for non-ONNX files
const generateMockArchitecture = (modelName: string, fileType: string): ModelArchitecture => {
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

// Function to parse ONNX model (simplified)
const parseOnnxModel = async (file: File): Promise<ModelArchitecture> => {
  try {
    const buffer = await file.arrayBuffer();
    // It's good practice to specify wasm paths for onnxruntime-web
    // You might need to copy wasm files to your public directory
    // For now, we'll rely on the default CDN behavior or hope it's bundled.
    // ort.env.wasm.wasmPaths = '/ort-wasm-files/'; // Example path

    const session = await InferenceSession.create(buffer);
    
    const inputs: ModelInputOutput[] = session.inputNames.map(name => ({
      name,
      // Shape and dtype are harder to get accurately without running or more detailed parsing.
      // onnxruntime-web session object doesn't directly expose detailed type/shape info easily for all inputs.
      shape: "N/A (Inspect model for details)", 
      dtype: "N/A"
    }));

    const outputs: ModelInputOutput[] = session.outputNames.map(name => ({
      name,
      shape: "N/A (Inspect model for details)",
      dtype: "N/A"
    }));

    // Attempt to get some notion of graph size, very simplified.
    // This part is speculative as direct node list access from session isn't a standard public API feature.
    // If session.handler or session.graph is not available or doesn't have nodes, this will be 'Unknown'.
    // For a production scenario, a more robust ONNX parsing library (perhaps server-side) would be needed for details.
    // @ts-ignore // Accessing internal properties for node count estimation
    const nodeCount = session.handler_?.graph?.node?.length || 'Unknown';


    const layers: ModelLayer[] = [
      {
        id: 'onnx-graph-summary',
        name: 'ONNX Model Graph',
        type: 'ONNXGraph',
        params: { 
          inputs: session.inputNames.join(', '), 
          outputs: session.outputNames.join(', '),
          nodes: nodeCount 
        },
        inputShape: session.inputNames,
        outputShape: session.outputNames,
      }
    ];

    return {
      layers,
      connections: [], // Simplified, no detailed connections from this basic parsing
      inputs,
      outputs,
    };
  } catch (error) {
    console.error("Error parsing ONNX model:", error);
    throw new Error(`Failed to parse ONNX model: ${(error as Error).message}`);
  }
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

  const handleModelsUploaded = async (files: File[]) => {
    const newModelsPromises = files.map(async (file) => {
      const id = `${file.name}-${Date.now()}`;
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      let architecture: ModelArchitecture;
      let processingMessage = "";

      if (fileType === 'onnx') {
        try {
          architecture = await parseOnnxModel(file);
          processingMessage = `Successfully parsed ONNX model: ${file.name}. Basic input/output info extracted.`;
        } catch (e) {
          toast({ title: "ONNX Parsing Error", description: (e as Error).message, variant: "destructive" });
          architecture = generateMockArchitecture(file.name, fileType); // Fallback to mock
          processingMessage = `Failed to parse ONNX model ${file.name}. Using mock architecture. Error: ${(e as Error).message}`;
        }
      } else {
        architecture = generateMockArchitecture(file.name, fileType);
        processingMessage = `Generated mock architecture for ${file.name}.`;
      }
      
      return {
        id,
        name: file.name,
        fileType,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        architecture,
        // rawFile: file, // Store if needed for actual processing
      };
    });

    try {
      const newModels = await Promise.all(newModelsPromises);
      setUploadedModels(prev => [...prev, ...newModels]);

      if (newModels.length > 0 && !selectedModelId) {
        setSelectedModelId(newModels[0].id); // Auto-select first uploaded model
      }
      toast({ title: "Models Processed", description: `${newModels.length} model(s) processed. Check details for parsing status.` });
      if (newModels.length > 0) setActiveTab("visualize"); // Switch to visualize tab
    } catch (error) {
      toast({ title: "Error Processing Models", description: (error as Error).message, variant: "destructive" });
    }
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
    setActiveTab("visualize"); 
  };
  
  const handleInputsConfigured = (configs: ConfiguredInput[]) => {
    if (!selectedModel) {
      toast({ title: "Error", description: "No model selected to configure inputs for.", variant: "destructive" });
      return;
    }
    setCurrentInputs(configs);
    const newOutput = generateMockOutput(selectedModel.id, configs);
    setModelOutputs(prev => ({ ...prev, [selectedModel.id!]: newOutput }));
    toast({ title: "Inputs Applied", description: `Inputs configured for ${selectedModel.name}. Mock output generated.` });
    setActiveTab("output");
  };

  const handleRunModel = () => {
    if (!selectedModel) {
      toast({ title: "No Model Selected", description: "Please select a model to run.", variant: "destructive" });
      return;
    }
    if (!currentInputs || currentInputs.length === 0) {
      // For ONNX models, inputs might be auto-detected, but we still rely on configuration for mock run
      const isConfigNeeded = !selectedModel.architecture?.inputs?.every(inp => inp.shape !== "N/A (Inspect model for details)");
      if (isConfigNeeded) {
        toast({ title: "Inputs Not Configured", description: `Please configure inputs for ${selectedModel.name} first.`, variant: "destructive" });
        setActiveTab("configure");
        return;
      }
    }
    const newOutput = generateMockOutput(selectedModel.id, currentInputs || []);
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
        {selectedModel && (currentInputs || selectedModel.fileType === 'onnx') && ( // Allow re-run for ONNX even if inputs were auto-detected
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
