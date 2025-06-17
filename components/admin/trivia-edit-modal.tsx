// components/admin/trivia-edit-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, HelpCircle, Save, Plus, Trash, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface TriviaData {
  id: number;
  question: string;
  answers: string[];
  correct_answer: number;
  explanation: string;
  language: string;
  view_count?: number;
}

interface TriviaEditModalProps {
  triviaId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const LANGUAGES = [
  { code: 'fi', name: 'Finnish' },
  { code: 'en', name: 'English' },
  { code: 'sv', name: 'Swedish' }
];

// Cache service function
const clearTriviaCache = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/cache/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'trivia',
        adminToken: process.env.NEXT_PUBLIC_ADMIN_TOKEN
      })
    });

    const result = await response.json();
    console.log('✅ Trivia cache cleared:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to clear trivia cache:', error);
    throw error;
  }
};

export default function TriviaEditModal({ triviaId, isOpen, onClose, onSave }: TriviaEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [triviaData, setTriviaData] = useState<Record<string, TriviaData>>({});
  const [activeLanguage, setActiveLanguage] = useState('fi');

  useEffect(() => {
    if (isOpen && triviaId) {
      loadTriviaData();
    } else if (isOpen && !triviaId) {
      // Initialize empty data for new question
      initializeEmptyData();
    }
  }, [isOpen, triviaId]);

  const initializeEmptyData = () => {
    const emptyData: TriviaData = {
      id: 0,
      question: '',
      answers: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      language: 'fi'
    };
    
    setTriviaData({
      fi: { ...emptyData, language: 'fi' },
      en: { ...emptyData, language: 'en' },
      sv: { ...emptyData, language: 'sv' }
    });
  };

  const loadTriviaData = async () => {
    if (!triviaId) return;
    
    try {
      setLoading(true);
      
      // Load all translations for this trivia question
      const { data, error } = await supabase
        .from('trivia_questions')
        .select('*')
        .eq('id', triviaId);

      if (error) throw error;

      // Organize data by language
      const dataByLanguage: Record<string, TriviaData> = {};

      data?.forEach(question => {
        dataByLanguage[question.language] = question;
      });

      // Fill in missing languages with empty templates
      LANGUAGES.forEach(lang => {
        if (!dataByLanguage[lang.code]) {
          dataByLanguage[lang.code] = {
            id: triviaId,
            question: '',
            answers: ['', '', '', ''],
            correct_answer: 0,
            explanation: '',
            language: lang.code
          };
        }
      });

      setTriviaData(dataByLanguage);

    } catch (error) {
      console.error('Error loading trivia data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setTriviaData(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value
      }
    }));
  };

  const handleAnswerChange = (index: number, value: string) => {
    const currentData = triviaData[activeLanguage] || { answers: ['', '', '', ''] };
    const newAnswers = [...currentData.answers];
    newAnswers[index] = value;
    handleInputChange('answers', newAnswers);
  };

  const addAnswer = () => {
    const currentData = triviaData[activeLanguage] || { answers: [] };
    if (currentData.answers.length < 6) { // Max 6 answers
      const newAnswers = [...currentData.answers, ''];
      handleInputChange('answers', newAnswers);
    }
  };

  const removeAnswer = (index: number) => {
    const currentData = triviaData[activeLanguage] || { answers: [''] };
    if (currentData.answers.length > 2) { // Min 2 answers
      const newAnswers = currentData.answers.filter((_, i) => i !== index);
      // Adjust correct answer if needed
      let newCorrectAnswer = currentData.correct_answer || 0;
      if (newCorrectAnswer >= newAnswers.length) {
        newCorrectAnswer = newAnswers.length - 1;
      }
      handleInputChange('answers', newAnswers);
      handleInputChange('correct_answer', newCorrectAnswer);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get next ID if creating new question
      let questionId = triviaId;
      if (!questionId) {
        const { data: maxIdData } = await supabase
          .from('trivia_questions')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);
        
        questionId = (maxIdData?.[0]?.id || 0) + 1;
      }
      
      // Save trivia data for each language that has content
      for (const [lang, data] of Object.entries(triviaData)) {
        if (data && data.question.trim()) {
          const { error } = await supabase
            .from('trivia_questions')
            .upsert({
              id: questionId,
              language: lang,
              question: data.question,
              answers: data.answers.filter(a => a.trim()), // Remove empty answers
              correct_answer: data.correct_answer,
              explanation: data.explanation,
              view_count: data.view_count || 0
            });

          if (error) throw error;
        }
      }

      // 🚀 CLEAR CACHE AUTOMATICALLY AFTER SAVING
      try {
        setClearingCache(true);
        await clearTriviaCache();
        console.log('✅ Trivia cache cleared successfully');
      } catch (cacheError) {
        console.error('⚠️ Failed to clear cache:', cacheError);
        // Don't fail the save operation if cache clearing fails
      } finally {
        setClearingCache(false);
      }

      onSave();
      onClose();
      
    } catch (error) {
      console.error('Error saving trivia:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentData = triviaData[activeLanguage] || {
    question: '',
    answers: ['', '', '', ''],
    correct_answer: 0,
    explanation: ''
  };
  
  const availableLanguages = Object.keys(triviaData).filter(
    lang => triviaData[lang]?.question?.trim()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">
                {triviaId ? 'Edit Trivia Question' : 'Add Trivia Question'}
              </h2>
              <p className="text-gray-500">
                Manage all translations for this trivia question
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Cache Status Alert */}
            {(saving || clearingCache) && (
              <Alert>
                <RefreshCw className={`h-4 w-4 ${clearingCache ? 'animate-spin' : ''}`} />
                <AlertDescription>
                  {saving && !clearingCache && "Saving trivia question..."}
                  {clearingCache && "Clearing cache to update live site..."}
                  {!saving && !clearingCache && "Question saved and cache cleared!"}
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

            {/* Question Form */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={currentData.question || ''}
                  onChange={(e) => handleInputChange('question', e.target.value)}
                  placeholder="Enter your trivia question..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Answer Options */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Answer Options</CardTitle>
                      <CardDescription>
                        Add multiple choice answers and select the correct one
                      </CardDescription>
                    </div>
                    {currentData.answers.length < 6 && (
                      <Button onClick={addAnswer} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Answer
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <RadioGroup
                      value={currentData.correct_answer?.toString() || '0'}
                      onValueChange={(value) => handleInputChange('correct_answer', parseInt(value))}
                    >
                      {currentData.answers.map((answer, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`answer-${index}`} />
                            <Label
                              htmlFor={`answer-${index}`}
                              className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              {currentData.correct_answer === index && (
                                <Check className="h-4 w-4 text-green-600 inline mr-1" />
                              )}
                              {String.fromCharCode(65 + index)}
                            </Label>
                          </div>
                          <Input
                            placeholder={`Answer ${String.fromCharCode(65 + index)}`}
                            value={answer}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="flex-1"
                          />
                          {currentData.answers.length > 2 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeAnswer(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  {currentData.answers.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                        <Check className="h-4 w-4" />
                        <strong>Correct Answer:</strong> 
                        {currentData.answers[currentData.correct_answer] || 'Not selected'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Explanation */}
              <div>
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  value={currentData.explanation || ''}
                  onChange={(e) => handleInputChange('explanation', e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Button variant="outline" onClick={onClose} disabled={saving || clearingCache}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || clearingCache || !currentData.question?.trim()}>
                {saving || clearingCache ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    {saving && !clearingCache && 'Saving Question...'}
                    {clearingCache && 'Updating Cache...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Question
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