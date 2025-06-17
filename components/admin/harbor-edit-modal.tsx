// components/admin/harbor-edit-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Upload, MapPin, Save, Plus, Trash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

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
  fi: [
    'Vierasvenesatama',
    'Kauppasatama', 
    'Kalastussatama',
    'Matkustajaterminaali',
    'Teollisuussatama',
    'Sisävesisatama',
    'Järvisatama',
    'Jokisatama',
    'Historiallinen',
    'Luontosatama',
    'Majakkasaari',
    'Linnoitussaari',
    'Perinteinen',
    'Kulttuurikohde',
    'Arktinen satama',
    'Kaivossaari',
    'Saariston portti',
    'Lauttasatama',
    'Öljysatama',
    'Rajasatama',
    'Rantakohde',
    'Kanavan portti'
  ],
  en: [
    'Guest Harbor',
    'Commercial Port',
    'Fishing Harbor', 
    'Ferry Terminal',
    'Industrial Port',
    'Inland Harbor',
    'Lake Harbor',
    'River Harbor',
    'Historical',
    'Natural Harbor',
    'Lighthouse Island',
    'Fortress Island',
    'Traditional',
    'Cultural Site',
    'Arctic Harbor',
    'Mining Island',
    'Archipelago Gateway',
    'Ferry Harbor',
    'Oil Harbor',
    'Border Harbor',
    'Beach Resort',
    'Canal Gateway'
  ],
  sv: [
    'Gästhamn',
    'Handelshamn',
    'Fiskehamn',
    'Färjeterminal', 
    'Industrihamn',
    'Inlandshamn',
    'Sjöhamn',
    'Flodhamn',
    'Historisk',
    'Naturhamn',
    'Fyrö',
    'Fästningsö',
    'Traditionell',
    'Kulturplats',
    'Arktisk hamn',
    'Gruvö',
    'Skärgårdsport',
    'Färjhamn',
    'Oljehamn',
    'Gränshamn',
    'Strandort',
    'Kanalport'
  ]
};

const REGIONS = {
  fi: [
    'Länsi-Uusimaa',
    'Saaristomeri',
    'Ulkosaaristomeri',
    'Sisäsaaristomeri',
    'Päijänne',
    'Saimaa',
    'Ahvenanmaan saaristo',
    'Lappi',
    'Läntinen Suomenlahti',
    'Helsingin seutu',
    'Varsinais-Suomi',
    'Kymenlaakso',
    'Uusimaa',
    'Pohjois-Pohjanmaa',
    'Satakunta',
    'Pohjanmaa',
    'Ahvenanmaa',
    'Itäinen Suomenlahti',
    'Pohjois-Savo',
    'Etelä-Savo',
    'Päijät-Häme',
    'Pohjois-Karjala',
    'Keski-Suomi',
    'Kanta-Häme',
    'Pirkanmaa',
    'Keski-Pohjanmaa',
    'Etelä-Karjala'
  ],
  en: [
    'Western Uusimaa',
    'Archipelago Sea',
    'Outer Archipelago',
    'Inner Archipelago',
    'Päijänne',
    'Saimaa',
    'Åland Archipelago',
    'Lapland',
    'Western Gulf of Finland',
    'Helsinki Region',
    'Southwest Finland',
    'Kymenlaakso',
    'Uusimaa',
    'Northern Ostrobothnia',
    'Satakunta',
    'Ostrobothnia',
    'Åland',
    'Eastern Gulf of Finland',
    'Northern Savo',
    'Southern Savo',
    'Päijät-Häme',
    'North Karelia',
    'Central Finland',
    'Kanta-Häme',
    'Pirkanmaa',
    'Central Ostrobothnia',
    'South Karelia'
  ],
  sv: [
    'Västra Nyland',
    'Skärgårdshavet',
    'Yttre skärgården',
    'Inre skärgården',
    'Päijänne',
    'Saimen',
    'Ålands skärgård',
    'Lappland',
    'Västra Finska viken',
    'Helsingforsregionen',
    'Egentliga Finland',
    'Kymmenedalen',
    'Nyland',
    'Norra Österbotten',
    'Satakunta',
    'Österbotten',
    'Åland',
    'Östra Finska viken',
    'Norra Savolax',
    'Södra Savolax',
    'Päijänne-Tavastland',
    'Norra Karelen',
    'Mellersta Finland',
    'Egentliga Tavastland',
    'Birkaland',
    'Mellersta Österbotten',
    'Södra Karelen'
  ]
};

// Cache service functions
const clearHarborCache = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/cache/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'harbors',
        adminToken: process.env.NEXT_PUBLIC_ADMIN_TOKEN
      })
    });

    const result = await response.json();
    console.log('✅ Harbor cache cleared:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to clear harbor cache:', error);
    throw error;
  }
};

export default function HarborEditModal({ harborId, isOpen, onClose, onSave }: HarborEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [harborData, setHarborData] = useState<Record<string, HarborData>>({});
  const [activeLanguage, setActiveLanguage] = useState('fi');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hints, setHints] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen && harborId) {
      loadHarborData();
    } else if (isOpen && !harborId) {
      // Initialize empty data for new harbor
      initializeEmptyData();
    }
  }, [isOpen, harborId]);

  const initializeEmptyData = () => {
    const emptyData: HarborData = {
      id: 0,
      name: '',
      coordinates: { lat: 0, lng: 0 },
      region: '',
      type: [],
      notable_feature: '',
      description: '',
      language: 'fi'
    };
    
    setHarborData({
      fi: { ...emptyData, language: 'fi' },
      en: { ...emptyData, language: 'en' },
      sv: { ...emptyData, language: 'sv' }
    });
    setHints({ fi: [], en: [], sv: [] });
  };

  const loadHarborData = async () => {
    if (!harborId) return;
    
    try {
      setLoading(true);
      
      // Load all translations for this harbor
      const { data, error } = await supabase
        .from('harbors')
        .select('*')
        .eq('id', harborId);

      if (error) throw error;

      // Load hints for all languages
      const { data: hintsData, error: hintsError } = await supabase
        .from('harbor_hints')
        .select('*')
        .eq('harbor_id', harborId)
        .order('hint_order');

      if (hintsError) throw hintsError;

      // Organize data by language
      const dataByLanguage: Record<string, HarborData> = {};
      const hintsByLanguage: Record<string, string[]> = {};

      data?.forEach(harbor => {
        dataByLanguage[harbor.language] = harbor;
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

    } catch (error) {
      console.error('Error loading harbor data:', error);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get next ID if creating new harbor
      let savedHarborId = harborId;
      if (!savedHarborId) {
        const { data: maxIdData } = await supabase
          .from('harbors')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);
        
        savedHarborId = (maxIdData?.[0]?.id || 0) + 1;
      }
      
      // Save harbor data for each language that has content
      for (const [lang, data] of Object.entries(harborData)) {
        if (data && data.name.trim()) {
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
              view_count: data.view_count || 0
            });

          if (error) throw error;
        }
      }

      // Save hints for each language
      for (const [lang, langHints] of Object.entries(hints)) {
        if (langHints?.length > 0) {
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

            if (error) throw error;
          }
        }
      }

      // 🚀 CLEAR CACHE AUTOMATICALLY AFTER SAVING
      try {
        setClearingCache(true);
        await clearHarborCache();
        console.log('✅ Harbor cache cleared successfully');
      } catch (cacheError) {
        console.error('⚠️ Failed to clear cache:', cacheError);
        // Don't fail the save operation if cache clearing fails
      } finally {
        setClearingCache(false);
      }

      onSave();
      onClose();
      
    } catch (error) {
      console.error('Error saving harbor:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentData = harborData[activeLanguage] || {};
  const currentHints = hints[activeLanguage] || [];
  const availableLanguages = Object.keys(harborData).filter(
    lang => harborData[lang]?.name?.trim()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Cache Status Alert */}
            {(saving || clearingCache) && (
              <Alert>
                <RefreshCw className={`h-4 w-4 ${clearingCache ? 'animate-spin' : ''}`} />
                <AlertDescription>
                  {saving && !clearingCache && "Saving harbor data..."}
                  {clearingCache && "Clearing cache to update live site..."}
                  {!saving && !clearingCache && "Harbor saved and cache cleared!"}
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

            {/* Image Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Harbor Image</CardTitle>
                <CardDescription>
                  Upload one image that will be used for all language versions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Harbor preview" className="max-h-48 mx-auto rounded" />
                      <Button variant="outline" onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}>
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <Button variant="outline" asChild>
                            <span>Choose Image</span>
                          </Button>
                        </label>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Harbor Content Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Harbor Name</Label>
                  <Input
                    id="name"
                    value={currentData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter harbor name"
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
                  <Label htmlFor="coordinates">Coordinates (lat, lng)</Label>
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

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the harbor..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Harbor Type</Label>
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Button variant="outline" onClick={onClose} disabled={saving || clearingCache}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || clearingCache}>
                {saving || clearingCache ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    {saving && !clearingCache && 'Saving Harbor...'}
                    {clearingCache && 'Updating Cache...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Harbor
                  </>
                )}
              </Button>
            </div>
            
            {/* Cache Info */}
            <div className="text-xs text-gray-500 text-center">
              💡 Changes will be visible immediately after saving (cache auto-clears)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}