// components/admin/trivia-management.tsx
"use client";

import { HelpCircle, Plus, Eye, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TriviaGroup {
  id: number;
  translations: Record<string, any>;
  primaryData: any;
}

interface TriviaManagementProps {
  trivia: TriviaGroup[];
  onAddQuestion: () => void;
  onViewQuestion: (questionId: number) => void;
  onEditQuestion: (questionId: number) => void;
  onDeleteQuestion: (questionId: number) => void;
}

export default function TriviaManagement({ 
  trivia, 
  onAddQuestion, 
  onViewQuestion, 
  onEditQuestion, 
  onDeleteQuestion 
}: TriviaManagementProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Trivia Management</CardTitle>
            <CardDescription>Manage trivia questions and answers</CardDescription>
          </div>
          <Button onClick={onAddQuestion} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trivia.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No trivia questions found. Add your first question to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trivia.slice(0, 5).map((triviaGroup) => {
                const question = triviaGroup.primaryData;
                const languages = Object.keys(triviaGroup.translations);
                const totalViews = Object.values(triviaGroup.translations)
                  .reduce((sum, q: any) => sum + (q.view_count || 0), 0);
                
                return (
                  <div key={question.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{question.question}</h3>
                      <p className="text-sm text-gray-500">
                        Languages: {languages.join(', ').toUpperCase()} • Total Views: {totalViews}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {languages.map(lang => (
                          <span key={lang} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            {lang.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onViewQuestion(question.id)}
                        title="View Question"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEditQuestion(question.id)}
                        title="Edit Question"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDeleteQuestion(question.id)}
                        title="Delete Question"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {trivia.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline">View All Questions ({trivia.length})</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}