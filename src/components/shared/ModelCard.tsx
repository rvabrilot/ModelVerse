import type { AiModel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XIcon, FileText, Database, BrainCircuit } from 'lucide-react';

interface ModelCardProps {
  model: AiModel;
  onRemove?: (modelId: string) => void;
  onSelect?: (modelId: string) => void;
  isSelected?: boolean;
  className?: string;
}

function getFileIcon(fileType: string) {
  if (fileType.includes('onnx')) return <BrainCircuit className="w-5 h-5 text-accent" />;
  if (fileType.includes('pt') || fileType.includes('pth')) return <FileText className="w-5 h-5 text-accent" />;
  if (fileType.includes('tf') || fileType.includes('pb') || fileType.includes('h5')) return <Database className="w-5 h-5 text-accent" />;
  return <FileText className="w-5 h-5 text-muted-foreground" />;
}

export function ModelCard({ model, onRemove, onSelect, isSelected, className }: ModelCardProps) {
  return (
    <Card 
      className={cn(
        "relative transition-all duration-200 ease-in-out shadow-md hover:shadow-lg", 
        isSelected ? "ring-2 ring-primary border-primary" : "border-border",
        onSelect ? "cursor-pointer" : "",
        className
      )}
      onClick={onSelect ? () => onSelect(model.id) : undefined}
      onKeyDown={onSelect ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect(model.id) : undefined}
      tabIndex={onSelect ? 0 : -1}
      aria-label={`Model: ${model.name}`}
    >
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card selection if remove is clicked
            onRemove(model.id);
          }}
          aria-label={`Remove model ${model.name}`}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      )}
      <CardHeader className="pb-2 pt-4 pr-10"> {/* Adjust padding for remove button */}
        <div className="flex items-center space-x-3">
          {getFileIcon(model.fileType)}
          <CardTitle className="text-lg truncate" title={model.name}>{model.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1 pt-0 pb-4">
        <p>Type: <span className="font-medium text-foreground">{model.fileType.toUpperCase()}</span></p>
        {model.size && <p>Size: <span className="font-medium text-foreground">{model.size}</span></p>}
        {model.architecture && (
          <p>Layers: <span className="font-medium text-foreground">{model.architecture.layers.length}</span></p>
        )}
      </CardContent>
    </Card>
  );
}
