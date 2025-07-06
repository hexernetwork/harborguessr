// components/admin/image-upload.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, Image as ImageIcon, Loader2, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CacheService } from "@/lib/cache-service";

interface ImageUploadProps {
  harborId?: string;
  currentImageUrl?: string | null;
  onImageUploaded?: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  onDataChanged?: () => void; // New callback to notify parent
}

// Direct upload function to the worker
const uploadImageToWorker = async (file: File) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('supabaseToken', session.access_token);
  formData.append('userId', session.user.id);

  console.log('📤 Uploading to worker:', process.env.NEXT_PUBLIC_WORKER_URL);
  const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/upload-image`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Worker upload error:', errorData);
    throw new Error(errorData || `HTTP ${response.status}`);
  }

  return await response.json();
};

// Delete image from worker
const deleteImageFromWorker = async (imageUrl: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  console.log('🗑️ Deleting image from worker:', imageUrl);

  const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/delete-image`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      supabaseToken: session.access_token,
      userId: session.user.id
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Worker delete error:', errorData);
    throw new Error(errorData || `HTTP ${response.status}`);
  }

  return await response.json();
};

export default function ImageUpload({ 
  harborId, 
  currentImageUrl, 
  onImageUploaded, 
  onImageRemoved,
  onDataChanged 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview URL when currentImageUrl changes
  useEffect(() => {
    console.log('🖼️ ImageUpload: currentImageUrl changed to:', currentImageUrl);
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);

    // Auto-upload
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      console.log('🚀 Starting image upload:', { 
        name: file.name, 
        size: file.size, 
        type: file.type,
        harborId: harborId
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 70) {
            clearInterval(progressInterval);
            return 70;
          }
          return prev + 10;
        });
      }, 100);

      // Upload to worker
      const result = await uploadImageToWorker(file);
      
      clearInterval(progressInterval);
      setUploadProgress(90);

      console.log('✅ Image upload successful:', result);
      
      // Update the preview URL immediately
      setPreviewUrl(result.url);
      
      // Call callback to notify parent component
      if (onImageUploaded) {
        console.log('📢 Calling onImageUploaded callback with:', result.url);
        onImageUploaded(result.url);
      }

      // Refresh cache to match cache tab
      try {
        setUploadProgress(95);
        console.log('🔄 Triggering cache refresh...');
        await CacheService.refreshCache('harbors');
        console.log('✅ Cache refreshed successfully');
        setSuccess('Image uploaded and cache updated!');
        if (onDataChanged) {
          console.log('📡 Notifying parent of data change');
          onDataChanged(); // Notify parent to reload data
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache refresh failed (image still uploaded):', cacheError);
        setSuccess('Image uploaded successfully!');
      } finally {
        setUploadProgress(100);
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Image upload failed:', error);
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreviewUrl(currentImageUrl); // Revert to original
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleRemoveImage = async () => {
    console.log('🗑️ Removing image');
    setError(null);
    setSuccess(null);
    setDeleting(true);

    try {
      if (previewUrl) {
        console.log('🗑️ Attempting to delete image from R2:', previewUrl);
        await deleteImageFromWorker(previewUrl);
        
        // Refresh cache to match cache tab
        try {
          console.log('🔄 Triggering cache refresh after deletion...');
          await CacheService.refreshCache('harbors');
          console.log('✅ Cache refreshed successfully');
          setSuccess('Image deleted and cache updated!');
          if (onDataChanged) {
            console.log('📡 Notifying parent of data change');
            onDataChanged(); // Notify parent to reload data
          }
        } catch (cacheError) {
          console.warn('⚠️ Cache refresh failed (image still deleted):', cacheError);
          setSuccess('Image deleted successfully!');
        }
      }

      setPreviewUrl(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onImageRemoved) {
        console.log('📢 Calling onImageRemoved callback');
        onImageRemoved();
      }

    } catch (error) {
      console.error('❌ Image deletion failed:', error);
      setError(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreviewUrl(currentImageUrl); // Revert to original
    } finally {
      setDeleting(false);
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Harbor Image
          {harborId && (
            <span className="text-sm font-normal text-muted-foreground">
              (ID: {harborId})
            </span>
          )}
          {(uploading || deleting) && (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Image Preview */}
        {previewUrl && (
          <div className="relative">
            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <img
                src={previewUrl}
                alt="Harbor image preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('Failed to load image preview:', previewUrl);
                  setError('Failed to load image preview');
                  setPreviewUrl(null);
                }}
                onLoad={() => {
                  console.log('✅ Image preview loaded successfully:', previewUrl);
                }}
              />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
              disabled={uploading || deleting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div className="space-y-3">
          <Label htmlFor="harbor-image">Upload New Image</Label>
          
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${(uploading || deleting) ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${error ? 'border-red-300 bg-red-50' : ''}
            `}
            onClick={triggerFileInput}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading || deleting}
            />
            
            <div className="flex flex-col items-center gap-2">
              {(uploading || deleting) ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-600">
                    {uploading && `Uploading... ${uploadProgress}%`}
                    {deleting && 'Deleting image...'}
                  </p>
                  {uploading && (
                    <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={triggerFileInput}
              disabled={uploading || deleting}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            
            {previewUrl && (
              <Button
                variant="outline"
                onClick={handleRemoveImage}
                disabled={uploading || deleting}
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-700 underline"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Image Guidelines */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Image Guidelines:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>High-quality photos of the harbor or marina</li>
            <li>Good lighting and clear visibility</li>
            <li>Landscape orientation preferred (16:9 aspect ratio)</li>
            <li>Shows distinctive features mentioned in hints</li>
            <li>Appropriate for all audiences</li>
            <li>Images stored in R2 and cached globally</li>
            <li>✨ Cache auto-updates for instant visibility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}