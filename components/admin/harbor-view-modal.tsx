// components/admin/harbor-view-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Globe, Calendar, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  view_count: number;
  last_viewed: string;
}

interface HarborViewModalProps {
  harborId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (harborId: number) => void;
}

const LANGUAGES = [
  { code: 'fi', name: 'Finnish' },
  { code: 'en', name: 'English' },
  { code: 'sv', name: 'Swedish' }
];

export default function HarborViewModal({ harborId, isOpen, onClose, onEdit }: HarborViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [harborData, setHarborData] = useState<Record<string, HarborData>>({});
  const [hints, setHints] = useState<Record<string, string[]>>({});
  const [activeLanguage, setActiveLanguage] = useState('fi');

  useEffect(() => {
    if (isOpen && harborId) {
      loadHarborData();
    }
  }, [isOpen, harborId]);

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

      // Set active language to first available language (prefer Finnish)
      const availableLanguages = Object.keys(dataByLanguage);
      if (availableLanguages.includes('fi')) {
        setActiveLanguage('fi');
      } else if (availableLanguages.length > 0) {
        setActiveLanguage(availableLanguages[0]);
      }

    } catch (error) {
      console.error('Error loading harbor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentData = harborData[activeLanguage] || {};
  const currentHints = hints[activeLanguage] || [];
  const availableLanguages = Object.keys(harborData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">
                {currentData.name || `Harbor ${harborId}`}
              </h2>
              <p className="text-gray-500">
                Harbor details and information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button 
                variant="outline" 
                onClick={() => {
                  onEdit(harborId!);
                  onClose();
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Harbor
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Language Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Available Languages</p>
                <div className="flex gap-2">
                  {LANGUAGES.map(lang => (
                    <Button
                      key={lang.code}
                      variant={activeLanguage === lang.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveLanguage(lang.code)}
                      disabled={!availableLanguages.includes(lang.code)}
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
            </div>

            {Object.keys(currentData).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No data available for {LANGUAGES.find(l => l.code === activeLanguage)?.name}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Harbor Name</p>
                        <p className="text-lg font-semibold">{currentData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Region</p>
                        <p>{currentData.region}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Coordinates</p>
                        <p className="font-mono text-sm">
                          {currentData.coordinates?.lat?.toFixed(4)}, {currentData.coordinates?.lng?.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notable Feature</p>
                        <p>{currentData.notable_feature}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Harbor Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {currentData.type?.map(type => (
                          <Badge key={type} variant="secondary">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Views</p>
                          <p className="text-lg font-semibold">{currentData.view_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Hints</p>
                          <p className="text-lg font-semibold">{currentHints.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed">{currentData.description}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Game Hints</CardTitle>
                      <CardDescription>
                        Hints shown to players during the game
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentHints.length > 0 ? (
                        <div className="space-y-3">
                          {currentHints.map((hint, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <Badge className="mt-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {index + 1}
                              </Badge>
                              <p className="text-sm">{hint}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No hints available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}