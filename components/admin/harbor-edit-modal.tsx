// components/admin/harbor-edit-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Save, Plus, Trash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import ImageUpload from "@/components/admin/image-upload";

interface HarborData {
  id: number;
  name: string;
  coordinates: { lat: number; lng: number };
  region: string;
  type: string[];
  notable_feature: string;
  description: string;
  language: string;
  hints?: string[];
  image_url?: string | null;
}

interface HarborEditModalProps {
  harborId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const LANGUAGES = [
  { code: 'fi', name: 'Finnish' },
  { code: 'en', name: 'English' },
  { code: 'sv', name: 'Swedish' }
];

const HARBOR_TYPES = {
  fi: ['Vierasvenesatama', 'Kauppasatama', 'Kalastussatama', 'Matkustajaterminaali', 'Teollisuussatama'],
  en: ['Guest Harbor', 'Commercial Port', 'Fishing Harbor', 'Ferry Terminal', 'Industrial Port'],
  sv: ['Gästhamn', 'Handelshamn', 'Fiskehamn', 'Färjeterminal', 'Industrihamn']
};

const REGIONS = {
  fi: ['Länsi-Uusimaa', 'Saaristomeri', 'Päijänne', 'Saimaa', 'Ahvenanmaan saaristo'],
  en: ['Western Uusimaa', 'Archipelago Sea', 'Päijänne', 'Saimaa', 'Åland Archipelago'],
  sv: ['Västra Nyland', 'Skärgårdshavet', 'Päijänne', 'Saimen', 'Ålands skärgård']
};

export default function HarborEditModal({ harborId, isOpen, onClose, onSave }: HarborEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [harborData, setHarborData] = useState<Record<string, HarborData>>({});
  const [activeLanguage, setActiveLanguage] = useState('fi');
  const [hints, setHints] = useState<Record<string, string[]>>({});
  const [sharedImageUrl, setSharedImageUrl] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('🔧 Harbor Edit Modal:', { harborId, isOpen });
  }, [harborId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (harborId) {
        console.log('🔄 Loading harbor data for ID:', harborId);
        loadHarborData();
      } else {
        console.log('➕ Initializing new harbor');
        initializeEmptyData();
      }
    } else {
      // Reset state when modal closes
      resetModalState();
    }
  }, [isOpen, harborId]);

  const resetModalState = () => {
    setHarborData({});
    setHints({});
    setSharedImageUrl(null);
    setActiveLanguage('fi');
    setLoading(false);
    setSaving(false);
  };

  const initializeEmptyData = () => {
    const emptyData: HarborData = {
      id: 0,
      name: '',
      coordinates: { lat: 60.1699, lng: 24.9384 }, // Default to Helsinki
      region: '',
      type: [],
      notable_feature: '',
      description: '',
      language: 'fi',
      image_url: null
    };
    
    setHarborData({
      fi: { ...emptyData, language: 'fi' },
      en: { ...emptyData, language: 'en' },
      sv: { ...emptyData, language: 'sv' }
    });
    setHints({ fi: [], en: [], sv: [] });
    setSharedImageUrl(null);
  };

  const loadHarborData = async () => {
    if (!harborId) return;
    
    try {
      setLoading(true);
      console.log('📡 Fetching harbor data for ID:', harborId);
      
      // Load all translations for this harbor
      const { data, error } = await supabase
        .from('harbors')
        .select('*')
        .eq('id', harborId);

      if (error) {
        console.error('❌ Error loading harbor data:', error);
        throw error;
      }

      console.log('✅ Harbor data loaded:', data);

      // Load hints for all languages
      const { data: hintsData, error: hintsError } = await supabase
        .from('harbor_hints')
        .select('*')
        .eq('harbor_id', harborId)
        .order('hint_order');

      if (hintsError) {
        console.error('❌ Error loading hints:', hintsError);
        throw hintsError;
      }

      console.log('✅ Hints data loaded:', hintsData);

      // Organize data by language
      const dataByLanguage: Record<string, HarborData> = {};
      const hintsByLanguage: Record<string, string[]> = {};

      data?.forEach(harbor => {
        dataByLanguage[harbor.language] = harbor;
        // Extract shared image URL from any language version
        if (harbor.image_url && !sharedImageUrl) {
          setSharedImageUrl(harbor.image_url);
        }
      });

      // Group hints by language
      hintsData?.forEach(hint => {
        if (!hintsByLanguage[hint.language]) {
          hintsByLanguage[hint.language] = [];
        }
        hintsByLanguage[hint.language][hint.hint_order - 1] = hint.hint_text;
      });

      setHarborData(dataByLanguage);
      setHints(hintsByLanguage);

      console.log('✅ Data organized by language:', Object.keys(dataByLanguage));

    } catch (error) {
      console.error('❌ Error loading harbor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setHarborData(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value
      }
    }));
  };

  const handleHintChange = (index: number, value: string) => {
    setHints(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [index]: value
      }
    }));
  };

  const addHint = () => {
    setHints(prev => ({
      ...prev,
      [activeLanguage]: [
        ...(prev[activeLanguage] || []),
        ''
      ]
    }));
  };

  const removeHint = (index: number) => {
    setHints(prev => ({
      ...prev,
      [activeLanguage]: prev[activeLanguage]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleImageUploaded = (imageUrl: string) => {
    console.log('🖼️ Harbor Edit Modal: Image uploaded callback received:', imageUrl);
    setSharedImageUrl(imageUrl);
    console.log('🖼️ Harbor Edit Modal: sharedImageUrl updated to:', imageUrl);
  };

  const handleImageRemoved = () => {
    console.log('🗑️ Harbor Edit Modal: Image removed callback received');
    setSharedImageUrl(null);
    console.log('🗑️ Harbor Edit Modal: sharedImageUrl set to null');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Starting save process...');
      console.log('🖼️ Current sharedImageUrl:', sharedImageUrl);
      
      // Get next ID if creating new harbor
      let savedHarborId = harborId;
      if (!savedHarborId) {
        const { data: maxIdData } = await supabase
          .from('harbors')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);
        
        savedHarborId = (maxIdData?.[0]?.id || 0) + 1;
        console.log('🆔 Generated new harbor ID:', savedHarborId);
      }
      
      // Save harbor data for each language that has content
      for (const [lang, data] of Object.entries(harborData)) {
        if (data && data.name.trim()) {
          console.log(`💾 Saving ${lang} translation with image_url:`, sharedImageUrl);
          
          const { error } = await supabase
            .from('harbors')
            .upsert({
              id: savedHarborId,
              language: lang,
              name: data.name,
              coordinates: data.coordinates,
              region: data.region,
              type: data.type,
              notable_feature: data.notable_feature,
              description: data.description,
              image_url: sharedImageUrl, // Set to null if image was removed
              view_count: data.view_count || 0
            });

          if (error) {
            console.error(`❌ Error saving ${lang} translation:`, error);
            throw error;
          } else {
            console.log(`✅ Successfully saved ${lang} translation`);
          }
        }
      }

      // Save hints for each language
      for (const [lang, langHints] of Object.entries(hints)) {
        if (langHints?.length > 0) {
          console.log(`💾 Saving ${lang} hints...`);
          
          // Delete existing hints for this language
          await supabase
            .from('harbor_hints')
            .delete()
            .eq('harbor_id', savedHarborId)
            .eq('language', lang);

          // Insert new hints
          const hintsToInsert = langHints
            .filter(hint => hint.trim())
            .map((hint, index) => ({
              harbor_id: savedHarborId,
              language: lang,
              hint_order: index + 1,
              hint_text: hint
            }));

          if (hintsToInsert.length > 0) {
            const { error } = await supabase
              .from('harbor_hints')
              .insert(hintsToInsert);

            if (error) {
              console.error(`❌ Error saving ${lang} hints:`, error);
              throw error;
            }
          }
        }
      }

      console.log('✅ Harbor saved successfully!');
      onSave();
      onClose();
      
    } catch (error) {
      console.error('❌ Error saving harbor:', error);
    } finally {
      setSaving(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const currentData = harborData[activeLanguage] || {};
  const currentHints = hints[activeLanguage] || [];
  const availableLanguages = Object.keys(harborData).filter(
    lang => harborData[lang]?.name?.trim()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">
                {harborId ? 'Edit Harbor' : 'Add Harbor'}
              </h2>
              <p className="text-gray-500">
                Manage all translations and content for this harbor
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3">Loading harbor data...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Status Alert */}
            {saving && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Saving harbor data...
                </AlertDescription>
              </Alert>
            )}

            {/* Language Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Editing Language</Label>
              <div className="flex gap-2">
                {LANGUAGES.map(lang => (
                  <Button
                    key={lang.code}
                    variant={activeLanguage === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLanguage(lang.code)}
                    className="relative"
                  >
                    {lang.name}
                    {availableLanguages.includes(lang.code) && (
                      <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-green-500" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image Upload Column */}
              <div className="lg:col-span-1">
                <ImageUpload
                  harborId={harborId?.toString()}
                  currentImageUrl={sharedImageUrl}
                  onImageUploaded={handleImageUploaded}
                  onImageRemoved={handleImageRemoved}
                />
              </div>

              {/* Form Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Harbor Name *</Label>
                    <Input
                      id="name"
                      value={currentData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter harbor name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Select 
                      value={currentData.region || ''} 
                      onValueChange={(value) => handleInputChange('region', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS[activeLanguage]?.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Coordinates (lat, lng) *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Latitude"
                        type="number"
                        step="any"
                        value={currentData.coordinates?.lat || ''}
                        onChange={(e) => handleInputChange('coordinates', {
                          ...currentData.coordinates,
                          lat: parseFloat(e.target.value) || 0
                        })}
                        required
                      />
                      <Input
                        placeholder="Longitude"
                        type="number"
                        step="any"
                        value={currentData.coordinates?.lng || ''}
                        onChange={(e) => handleInputChange('coordinates', {
                          ...currentData.coordinates,
                          lng: parseFloat(e.target.value) || 0
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notable_feature">Notable Feature</Label>
                    <Input
                      id="notable_feature"
                      value={currentData.notable_feature || ''}
                      onChange={(e) => handleInputChange('notable_feature', e.target.value)}
                      placeholder="What makes this harbor special?"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the harbor..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Harbor Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {HARBOR_TYPES[activeLanguage]?.map(type => (
                      <Button
                        key={type}
                        variant={currentData.type?.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const currentTypes = currentData.type || [];
                          const newTypes = currentTypes.includes(type)
                            ? currentTypes.filter(t => t !== type)
                            : [...currentTypes, type];
                          handleInputChange('type', newTypes);
                        }}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Hints Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Game Hints</CardTitle>
                        <CardDescription>
                          Add hints to help players find this harbor
                        </CardDescription>
                      </div>
                      <Button onClick={addHint} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Hint
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentHints.map((hint, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Hint ${index + 1}`}
                            value={hint}
                            onChange={(e) => handleHintChange(index, e.target.value)}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeHint(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {currentHints.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No hints added yet. Click "Add Hint" to get started.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || !currentData.name?.trim()}
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Harbor
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}