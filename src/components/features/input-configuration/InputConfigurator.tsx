// src/components/features/input-configuration/InputConfigurator.tsx
"use client";
import React, { useState, useEffect } from 'react';
import type { AiModel, ConfiguredInput, ModelInputOutput } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploadZone } from '@/components/shared/FileUploadZone';
import { SlidersHorizontal, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface InputConfiguratorProps {
  model?: AiModel | null;
  onInputsConfigured: (config: ConfiguredInput[]) => void;
  className?: string;
}

const inputConfigSchema = z.object({
  shape: z.string().min(1, "Shape is required (e.g., 1,3,224,224)"),
  dtype: z.string().min(1, "Data type is required (e.g., float32)"),
  rangeMin: z.string().optional(), // Use string to handle empty input
  rangeMax: z.string().optional(),
  sampleDataFile: z.custom<File | null>(() => true).optional(), // For file object
});

type InputConfigFormData = z.infer<typeof inputConfigSchema>;

export function InputConfigurator({ model, onInputsConfigured, className }: InputConfiguratorProps) {
  const { toast } = useToast();
  // Map to store form instances for each input tensor
  const [formHooks, setFormHooks] = useState<Record<string, ReturnType<typeof useForm<InputConfigFormData>>>>({});
  const [sampleDataFiles, setSampleDataFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    if (model?.architecture?.inputs) {
      const newFormHooks: Record<string, ReturnType<typeof useForm<InputConfigFormData>>> = {};
      model.architecture.inputs.forEach(input => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        newFormHooks[input.name] = useForm<InputConfigFormData>({
          resolver: zodResolver(inputConfigSchema),
          defaultValues: {
            shape: input.shape || '',
            dtype: input.dtype || 'float32',
            rangeMin: '',
            rangeMax: '',
            sampleDataFile: null,
          },
        });
      });
      setFormHooks(newFormHooks);
      setSampleDataFiles({}); // Reset sample data files when model changes
    } else {
      setFormHooks({});
      setSampleDataFiles({});
    }
  }, [model]);


  if (!model || !model.architecture?.inputs || model.architecture.inputs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center"><SlidersHorizontal className="w-6 h-6 mr-2 text-primary" /> Configure Inputs</CardTitle>
          <CardDescription>Select a model with defined inputs to configure them.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
           <Image src="https://placehold.co/300x200.png" alt="Placeholder configuration" width={300} height={200} data-ai-hint="settings sliders" className="opacity-30 rounded-md"/>
          <p className="mt-4">No model selected or model has no defined inputs.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmitAll = async () => {
    if (!model) return;
    const allConfiguredInputs: ConfiguredInput[] = [];
    let allValid = true;

    for (const inputTensor of model.architecture?.inputs || []) {
      const form = formHooks[inputTensor.name];
      if (!form) continue;

      const isValid = await form.trigger();
      if (!isValid) {
        allValid = false;
        toast({ title: `Error in ${inputTensor.name}`, description: "Please correct the errors.", variant: "destructive" });
        continue;
      }
      
      const values = form.getValues();
      const configuredInput: ConfiguredInput = {
        modelId: model.id,
        inputName: inputTensor.name,
        shape: values.shape,
        dtype: values.dtype,
        rangeMin: values.rangeMin ? parseFloat(values.rangeMin) : undefined,
        rangeMax: values.rangeMax ? parseFloat(values.rangeMax) : undefined,
        sampleDataFileName: sampleDataFiles[inputTensor.name]?.name,
        // sampleDataUrl: In a real app, upload file and set URL here
      };
      allConfiguredInputs.push(configuredInput);
    }
    
    if (allValid && allConfiguredInputs.length > 0) {
      onInputsConfigured(allConfiguredInputs);
      toast({ title: "Inputs Configured", description: `Configuration for ${model.name} submitted.` });
    } else if (allConfiguredInputs.length === 0 && model.architecture?.inputs?.length > 0) {
       toast({ title: "Configuration Incomplete", description: "Please configure inputs for the model.", variant: "destructive" });
    }
  };

  const handleSampleDataUpload = (inputName: string) => (files: File[]) => {
    if (files.length > 0) {
      setSampleDataFiles(prev => ({...prev, [inputName]: files[0]}));
      // In a real app, you might want to immediately upload this file
      // and store its URL or reference.
      toast({ title: "Sample Data Added", description: `File ${files[0].name} selected for input ${inputName}.`});
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center"><SlidersHorizontal className="w-6 h-6 mr-2 text-primary" /> Configure Inputs for {model.name}</CardTitle>
        <CardDescription>Specify shapes, data types, ranges, or upload sample data for each input tensor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {model.architecture.inputs.map((inputTensor) => {
          const form = formHooks[inputTensor.name];
          if (!form) return null; // Should not happen if useEffect is correct

          return (
            <Card key={inputTensor.name} className="p-4 bg-card/50">
              <CardTitle className="text-md mb-3">Input: {inputTensor.name}</CardTitle>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`shape-${inputTensor.name}`}>Shape (e.g., 1,3,224,224)</Label>
                    <Controller
                      name="shape"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <>
                          <Input id={`shape-${inputTensor.name}`} {...field} placeholder={inputTensor.shape || "e.g., 1,3,224,224"} />
                          {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`dtype-${inputTensor.name}`}>Data Type</Label>
                    <Controller
                      name="dtype"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <>
                        <Select onValueChange={field.onChange} defaultValue={field.value || inputTensor.dtype}>
                          <SelectTrigger id={`dtype-${inputTensor.name}`}>
                            <SelectValue placeholder="Select data type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="float32">float32</SelectItem>
                            <SelectItem value="float16">float16</SelectItem>
                            <SelectItem value="int32">int32</SelectItem>
                            <SelectItem value="int64">int64</SelectItem>
                            <SelectItem value="uint8">uint8</SelectItem>
                            <SelectItem value="bool">bool</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`rangeMin-${inputTensor.name}`}>Range Min (optional)</Label>
                     <Controller
                      name="rangeMin"
                      control={form.control}
                      render={({ field }) => <Input id={`rangeMin-${inputTensor.name}`} type="number" step="any" {...field} placeholder="e.g., 0" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rangeMax-${inputTensor.name}`}>Range Max (optional)</Label>
                    <Controller
                      name="rangeMax"
                      control={form.control}
                      render={({ field }) => <Input id={`rangeMax-${inputTensor.name}`} type="number" step="any" {...field} placeholder="e.g., 1" />}
                    />
                  </div>
                </div>
                <div>
                  <Label>Upload Sample Data (optional)</Label>
                  <FileUploadZone
                    onFilesAccepted={handleSampleDataUpload(inputTensor.name)}
                    acceptedFileTypes="image/*,.csv,.txt,.json,.npy" // Common data file types
                    maxFiles={1}
                    label="Upload sample data file"
                    description={sampleDataFiles[inputTensor.name] ? `Selected: ${sampleDataFiles[inputTensor.name]?.name}` : "e.g., an image, CSV, or NPY file"}
                    className="p-4 text-sm"
                    id={`sample-data-${inputTensor.name}`}
                  />
                </div>
              </form>
            </Card>
          );
        })}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmitAll} size="lg">Apply Configuration</Button>
        </div>
         <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs">
          <p className="flex items-center"><Info className="w-4 h-4 mr-2 text-accent" />
            Configured inputs will be used to generate mock outputs. In a real system, this would run the model.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
