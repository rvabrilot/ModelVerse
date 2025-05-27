export interface ModelLayer {
  id: string;
  name: string;
  type: string; // e.g., 'Conv2D', 'Linear', 'ReLU'
  params?: Record<string, any>; // e.g., { 'kernel_size': [3,3], 'stride': 1 }
  inputShape?: string[];
  outputShape?: string[];
}

export interface ModelConnection {
  fromLayerId: string;
  toLayerId: string;
}

export interface ModelInputOutput {
  name: string;
  shape: string; // e.g., "1,3,224,224"
  dtype: string; // e.g., "float32"
}

export interface ModelArchitecture {
  layers: ModelLayer[];
  connections: ModelConnection[];
  inputs: ModelInputOutput[];
  outputs: ModelInputOutput[];
}

export interface AiModel {
  id: string;
  name: string;
  fileType: string; // e.g., '.onnx', '.pb', '.pt'
  size?: string; // e.g., "10.5 MB"
  architecture?: ModelArchitecture; 
  // rawFile?: File; // The actual uploaded file - keep commented for now
}

export type OutputDataType = 'text' | 'image' | 'vector' | 'json' | 'unknown';

export interface ModelOutput {
  type: OutputDataType;
  data: any; // string for text, URL for image, number[] for vector, object for json
  modelId: string; // To link output to a specific model
}

export interface ConfiguredInput {
  modelId: string;
  inputName: string; // Corresponds to ModelInputOutput.name
  shape: string;
  dtype: string;
  rangeMin?: number;
  rangeMax?: number;
  sampleDataUrl?: string; // URL if sample data is uploaded and stored/mocked
  sampleDataFileName?: string;
}
