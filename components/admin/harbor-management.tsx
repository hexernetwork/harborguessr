// components/admin/harbor-management.tsx
"use client";

import { useState } from "react";
import { MapPin, Plus, Eye, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HarborGroup {
  id: number;
  translations: Record<string, any>;
  primaryData: any;
}

interface HarborManagementProps {
  harbors: HarborGroup[];
  onAddHarbor: () => void;
  onViewHarbor: (harborId: number) => void;
  onEditHarbor: (harborId: number) => void;
  onDeleteHarbor: (harborId: number) => void;
}

export default function HarborManagement({ 
  harbors, 
  onAddHarbor, 
  onViewHarbor, 
  onEditHarbor, 
  onDeleteHarbor 
}: HarborManagementProps) {
  const [showCount, setShowCount] = useState(5);

  const displayedHarbors = harbors.slice(0, showCount);
  const hasMore = harbors.length > showCount;

  const handleShowMore = () => {
    setShowCount(prev => Math.min(prev + 10, harbors.length));
  };

  const handleShowLess = () => {
    setShowCount(5);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Harbor Management</CardTitle>
            <CardDescription>Add, edit, and manage harbor locations</CardDescription>
          </div>
          <Button onClick={onAddHarbor} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Harbor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {harbors.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No harbors found. Add your first harbor to get started.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {displayedHarbors.map((harborGroup) => {
                  const harbor = harborGroup.primaryData;
                  const languages = Object.keys(harborGroup.translations);
                  const totalViews = Object.values(harborGroup.translations)
                    .reduce((sum, h: any) => sum + (h.view_count || 0), 0);
                  
                  return (
                    <div key={harbor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{harbor.name}</h3>
                        <p className="text-sm text-gray-500">
                          {harbor.region} • Languages: {languages.join(', ').toUpperCase()} • Total Views: {totalViews}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {languages.map(lang => (
                            <span key={lang} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onViewHarbor(harbor.id)}
                          title="View Harbor Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEditHarbor(harbor.id)}
                          title="Edit Harbor"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onDeleteHarbor(harbor.id)}
                          title="Delete Harbor"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simple pagination controls */}
              {(hasMore || showCount > 5) && (
                <div className="flex items-center justify-center gap-3 pt-4 border-t">
                  {hasMore && (
                    <Button variant="outline" onClick={handleShowMore}>
                      Show More ({harbors.length - showCount} remaining)
                    </Button>
                  )}
                  {showCount > 5 && (
                    <Button variant="ghost" onClick={handleShowLess} className="text-gray-500">
                      Show Less
                    </Button>
                  )}
                </div>
              )}

              <div className="text-center text-sm text-gray-500">
                Showing {displayedHarbors.length} of {harbors.length} harbors
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}