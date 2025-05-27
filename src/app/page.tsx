
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
import { InferenceSession } from 'onnxruntime-web';

// Mock function to generate architecture for non-ONNX files
const generateMockArchitecture = (modelName: string, fileType: string): ModelArchitecture => {
  const idSuffix = modelName.replace(/\W/g, '').toLowerCase();
  const numLayers = Math.floor(Math.random() * 4) + 2; // 2-5 layers for simplicity
  const layers: ModelLayer[] = [];

  const inputDim1 = Math.random() > 0.5 ? 'batch' : '1';
  const inputDimH = Math.floor(Math.random() * 100) + 128; // e.g., 128-227
  const inputDimW = Math.floor(Math.random() * 100) + 128; // e.g., 128-227
  const inputChannels = Math.random() > 0.3 ? '3' : '1';

  const commonInputShape = [inputDim1, inputChannels, `${inputDimH}`, `${inputDimW}`];
  // Example output: classification (10-1000 classes) or feature vector (e.g., 512)
  const outputDim = Math.random() > 0.5 ? `${Math.floor(Math.random() * 991) + 10}` : `${Math.pow(2, Math.floor(Math.random()*4)+7)}`; // 128, 256, 512, 1024
  const commonOutputShape = [inputDim1, outputDim]; 

  const dtypes = ['float32', 'float16', 'int32', 'uint8'];
  const inputDtype = dtypes[Math.floor(Math.random() * dtypes.length)];
  const outputDtype = dtypes[Math.floor(Math.random() * dtypes.length)];


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
    const layerTypes = ['Conv2D', 'ReLU', 'MaxPool2D', 'Linear', 'BatchNorm', 'Dropout', 'Attention', 'TransformerBlock'];
    const type = layerTypes[Math.floor(Math.random() * layerTypes.length)];
    const currentLayer: ModelLayer = {
      id: `${type.toLowerCase().replace('2d','').replace('block','')}--${i}-${idSuffix}`,
      name: `${type} ${i + 1}`,
      type: type,
      params: { info: `Mock parameters for ${type}`, units: Math.pow(2, Math.floor(Math.random()*5)+5) }, // e.g. 32 to 512 units
      inputShape: prevLayer.outputShape,
      outputShape: (type === 'Linear' && i === numLayers -1 ) ? commonOutputShape : [`batch`, `features_${i+1}` , `${Math.floor(Math.random()*100)+50}`, `${Math.floor(Math.random()*100)+50}`]
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
    inputs: [{ name: `input_tensor_${Math.floor(Math.random()*10)}`, shape: commonInputShape.join(','), dtype: inputDtype }],
    outputs: [{ name: `output_tensor_${Math.floor(Math.random()*10)}`, shape: commonOutputShape.join(','), dtype: outputDtype }],
  };
};

// Helper function to map ONNX tensor type strings to simplified dtype strings
const onnxTypeToDtype = (onnxType: string): string => {
  if (!onnxType || !onnxType.startsWith('tensor(') || !onnxType.endsWith(')')) {
    return 'unknown';
  }
  const type = onnxType.substring(7, onnxType.length - 1);
  switch (type) {
    case 'float': return 'float32'; // Common assumption for "float"
    case 'double': return 'float64';
    case 'int8': return 'int8';
    case 'uint8': return 'uint8';
    case 'int16': return 'int16';
    case 'uint16': return 'uint16';
    case 'int32': return 'int32';
    case 'uint32': return 'uint32';
    case 'int64': return 'int64';
    case 'uint64': return 'uint64';
    case 'bool': return 'bool';
    default: return type; // Return the type itself if not a standard mapping
  }
};

// Helper function to format ONNX dimensions array into a string
const formatOnnxDimensions = (dims: (number | null)[]): string => {
  if (!dims) return "N/A";
  return dims.map(d => d === null ? 'batch' : (d < 0 ? 'dynamic' : d.toString())).join(',');
};


// Function to parse ONNX model
const parseOnnxModel = async (file: File): Promise<ModelArchitecture> => {
  try {
    const buffer = await file.arrayBuffer();
    // It's good practice to specify wasm paths for onnxruntime-web
    // You might need to copy wasm files to your public directory
    // For now, we'll rely on the default CDN behavior or hope it's bundled.
    // ort.env.wasm.wasmPaths = '/ort-wasm-files/'; // Example path

    const session = await InferenceSession.create(buffer);
    
    const inputs: ModelInputOutput[] = session.inputNames.map(name => {
      const meta = session.inputMetadata[name];
      return {
        name,
        shape: meta ? formatOnnxDimensions(meta.dimensions) : "N/A", 
        dtype: meta ? onnxTypeToDtype(meta.type) : "N/A"
      };
    });

    const outputs: ModelInputOutput[] = session.outputNames.map(name => {
      const meta = session.outputMetadata[name];
      return {
        name,
        shape: meta ? formatOnnxDimensions(meta.dimensions) : "N/A",
        dtype: meta ? onnxTypeToDtype(meta.type) : "N/A"
      };
    });
    
    // @ts-ignore // Accessing internal properties for node count estimation - this might be unstable
    const nodeCount = session.handler_?.graph?.node?.length || 'Unknown';


    const layers: ModelLayer[] = [
      {
        id: 'onnx-graph-summary',
        name: 'ONNX Model Graph',
        type: 'ONNXGraph', // This type can be used by ModelVisualizer for specific rendering if needed
        params: { 
          inputs: session.inputNames.join(', '), 
          outputs: session.outputNames.join(', '),
          nodes: nodeCount,
          provider: session.options.executionProviders?.join(', ') || 'default',
        },
        // For a summary layer, input/outputShape might be more conceptual (list of names)
        inputShape: inputs.map(inp => `${inp.name} (${inp.shape})`),
        outputShape: outputs.map(out => `${out.name} (${out.shape})`),
      }
    ];

    return {
      layers,
      connections: [], // No detailed inter-layer connections from this basic parsing
      inputs, // These are the detailed ModelInputOutput[]
      outputs, // These are the detailed ModelInputOutput[]
    };
  } catch (error) {
    console.error("Error parsing ONNX model:", error);
    // Provide a more user-friendly error message
    let message = `Failed to parse ONNX model: ${(error as Error).message}. `;
    if ((error as Error).message.includes("Unexpected token")) {
        message += "This might be due to an invalid or corrupted ONNX file, or a version incompatibility.";
    } else if ((error as Error).message.includes("Wasm")) {
        message += "There might be an issue loading WebAssembly components for ONNX runtime. Check your internet connection or browser console for more details.";
    }
    throw new Error(message);
  }
};


// Mock function to generate output
const generateMockOutput = (modelId: string, inputs?: ConfiguredInput[]): ModelOutput => {
  const outputTypes: ModelOutput['type'][] = ['text', 'image', 'vector', 'json'];
  const randomType = outputTypes[Math.floor(Math.random() * outputTypes.length)];
  let data: any;
  switch (randomType) {
    case 'text': data = `Mock text output for model ${modelId.substring(0,5)} with inputs: ${inputs ? inputs.map(i=>i.inputName).join(', ') : 'N/A'}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`; break;
    case 'image': data = `https://placehold.co/600x400.png?text=Output+${modelId.substring(0,5)}`; break;
    case 'vector': data = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, () => parseFloat(Math.random().toFixed(4))); break; // 3-10 elements
    case 'json': data = { prediction: Math.random().toFixed(4), confidence: Math.random().toFixed(2), class: `class_${Math.floor(Math.random()*20)}`, details: { info: "Mock JSON content", timestamp: Date.now()} }; break;
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
          processingMessage = `Successfully parsed ONNX model: ${file.name}. Input/output details extracted.`;
           toast({ title: "ONNX Model Processed", description: processingMessage });
        } catch (e) {
          const errorMessage = (e as Error).message;
          toast({ title: "ONNX Parsing Error", description: errorMessage, variant: "destructive", duration: 8000 });
          architecture = generateMockArchitecture(file.name, fileType); // Fallback to mock
          processingMessage = `Failed to parse ONNX model ${file.name}. Using mock architecture. Error: ${errorMessage}`;
        }
      } else {
        architecture = generateMockArchitecture(file.name, fileType);
        processingMessage = `Generated mock architecture for ${file.name} (format: ${fileType}). Detailed parsing for this format is not supported client-side.`;
         toast({ title: "Model Processed (Mock)", description: processingMessage, duration: 6000 });
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
      // General toast after all processing is done, specific toasts are shown per model above
      // toast({ title: "Models Processed", description: `${newModels.length} model(s) processed. Check individual notifications for details.` });
      if (newModels.length > 0) setActiveTab("visualize"); // Switch to visualize tab
    } catch (error) {
      // This catch might be redundant if individual promises handle their errors and provide fallbacks.
      // However, it can catch errors from Promise.all itself or unhandled rejections.
      toast({ title: "Error Processing Model Batch", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleRemoveModel = (modelIdToRemove: string) => {
    setUploadedModels(prev => prev.filter(m => m.id !== modelIdToRemove));
    if (selectedModelId === modelIdToRemove) {
      setSelectedModelId(null);
      setCurrentInputs(null);
      setModelOutputs(prev => ({...prev, [modelIdToRemove]: null}));
    }
    toast({ title: "Model Removed", description: `Model ${modelIdToRemove.substring(0,15)}... removed.` });
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
    // For ONNX, inputs might be auto-detected from metadata and might not need explicit configuration for a mock run.
    // For mock architecture, we rely on currentInputs.
    const isNonOnnxAndNoInputs = selectedModel.fileType !== 'onnx' && (!currentInputs || currentInputs.length === 0);
    // Check if ONNX model has inputs that still need configuration (e.g., "N/A" shape from a failed parse)
    const isUnconfiguredOnnx = selectedModel.fileType === 'onnx' && selectedModel.architecture?.inputs.some(inp => inp.shape === "N/A" || inp.dtype === "N/A");

    if (isNonOnnxAndNoInputs || isUnconfiguredOnnx) {
       toast({ title: "Inputs Not Fully Configured", description: `Please ensure inputs for ${selectedModel.name} are configured or resolved.`, variant: "destructive" });
       setActiveTab("configure");
       return;
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
        {selectedModel && (currentInputs || selectedModel.fileType === 'onnx') && ( 
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

    