// components/admin/admin-dashboard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Settings, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import StatsOverview from "@/components/admin/stats-overview";
import HarborManagement from "@/components/admin/harbor-management";
import TriviaManagement from "@/components/admin/trivia-management";
import HarborEditModal from "@/components/admin/harbor-edit-modal";
import TriviaEditModal from "@/components/admin/trivia-edit-modal";
import HarborViewModal from "@/components/admin/harbor-view-modal";
import CacheManagement from "@/components/admin/cache-management";

interface AdminDashboardProps {
  initialUser: any;
}

export default function AdminDashboard({ initialUser }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalHarbors: 0,
    totalTrivia: 0,
    totalUsers: 0,
    totalGames: 0
  });
  const [harbors, setHarbors] = useState([]);
  const [trivia, setTrivia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHarborId, setEditingHarborId] = useState<number | null>(null);
  const [harborModalOpen, setHarborModalOpen] = useState(false);
  const [editingTriviaId, setEditingTriviaId] = useState<number | null>(null);
  const [triviaModalOpen, setTriviaModalOpen] = useState(false);
  const [viewingHarborId, setViewingHarborId] = useState<number | null>(null);
  const [harborViewModalOpen, setHarborViewModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load stats in parallel (excluding users for now - requires service role)
      const [harborsData, triviaData, gamesData] = await Promise.allSettled([
        supabase.from("harbors").select("*", { count: "exact", head: true }),
        supabase.from("trivia_questions").select("*", { count: "exact", head: true }),
        supabase.from("game_scores").select("*", { count: "exact", head: true })
      ]);

      // Load actual data for management - get all languages
      const [harborsList, triviaList] = await Promise.allSettled([
        supabase.from("harbors").select("*").order("id"),
        supabase.from("trivia_questions").select("*").order("id")
      ]);

      // Group harbors by ID (so all translations are together)
      let groupedHarbors = [];
      if (harborsList.status === 'fulfilled' && harborsList.value.data) {
        const harborMap = new Map();
        
        harborsList.value.data.forEach(harbor => {
          if (!harborMap.has(harbor.id)) {
            harborMap.set(harbor.id, {
              id: harbor.id,
              translations: {},
              primaryData: null
            });
          }
          
          const group = harborMap.get(harbor.id);
          group.translations[harbor.language] = harbor;
          
          // Use Finnish as primary, then English, then whatever we have
          if (harbor.language === 'fi' || 
              (!group.primaryData && harbor.language === 'en') ||
              (!group.primaryData)) {
            group.primaryData = harbor;
          }
        });
        
        groupedHarbors = Array.from(harborMap.values()).sort((a, b) => a.id - b.id);
      }

      // Group trivia by ID (so all translations are together)
      let groupedTrivia = [];
      if (triviaList.status === 'fulfilled' && triviaList.value.data) {
        const triviaMap = new Map();
        
        triviaList.value.data.forEach(question => {
          if (!triviaMap.has(question.id)) {
            triviaMap.set(question.id, {
              id: question.id,
              translations: {},
              primaryData: null
            });
          }
          
          const group = triviaMap.get(question.id);
          group.translations[question.language] = question;
          
          // Use Finnish as primary, then English, then whatever we have
          if (question.language === 'fi' || 
              (!group.primaryData && question.language === 'en') ||
              (!group.primaryData)) {
            group.primaryData = question;
          }
        });
        
        groupedTrivia = Array.from(triviaMap.values()).sort((a, b) => a.id - b.id);
      }

      setStats({
        totalHarbors: harborsData.status === 'fulfilled' ? harborsData.value.count || 0 : 0,
        totalTrivia: triviaData.status === 'fulfilled' ? triviaData.value.count || 0 : 0,
        totalUsers: 0, // TODO: Implement with service role key
        totalGames: gamesData.status === 'fulfilled' ? gamesData.value.count || 0 : 0
      });

      setHarbors(groupedHarbors);
      setTrivia(groupedTrivia);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Harbor management handlers
  const handleAddHarbor = () => {
    setEditingHarborId(null);
    setHarborModalOpen(true);
  };

  const handleViewHarbor = (harborId: number) => {
    setViewingHarborId(harborId);
    setHarborViewModalOpen(true);
  };

  const handleEditHarbor = (harborId: number) => {
    setEditingHarborId(harborId);
    setHarborModalOpen(true);
  };

  const handleDeleteHarbor = (harborId: number) => {
    console.log("Delete harbor:", harborId);
    // TODO: Show confirmation dialog
  };

  const handleHarborSaved = () => {
    // Reload dashboard data after saving
    loadDashboardData();
  };

  // Trivia management handlers
  const handleAddQuestion = () => {
    setEditingTriviaId(null);
    setTriviaModalOpen(true);
  };

  const handleViewQuestion = (questionId: number) => {
    console.log("View question:", questionId);
    // TODO: Open question view modal
  };

  const handleEditQuestion = (questionId: number) => {
    setEditingTriviaId(questionId);
    setTriviaModalOpen(true);
  };

  const handleDeleteQuestion = (questionId: number) => {
    console.log("Delete question:", questionId);
    // TODO: Show confirmation dialog
  };

  const handleTriviaSaved = () => {
    // Reload dashboard data after saving
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome, {initialUser?.user_metadata?.username || initialUser?.email}
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={stats} />

          {/* Management Tabs */}
          <Tabs defaultValue="harbors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="harbors">Harbors</TabsTrigger>
              <TabsTrigger value="trivia">Trivia</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="cache">Cache</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="harbors">
              <HarborManagement
                harbors={harbors}
                onAddHarbor={handleAddHarbor}
                onViewHarbor={handleViewHarbor}
                onEditHarbor={handleEditHarbor}
                onDeleteHarbor={handleDeleteHarbor}
              />
            </TabsContent>

            <TabsContent value="trivia">
              <TriviaManagement
                trivia={trivia}
                onAddQuestion={handleAddQuestion}
                onViewQuestion={handleViewQuestion}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
              />
            </TabsContent>

            <TabsContent value="users">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    User management features coming soon. Currently you can manage roles directly in Supabase.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="cache">
              <CacheManagement />
            </TabsContent>

            <TabsContent value="settings">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    System settings panel coming soon. This will include analytics, user management, and more.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Harbor Edit Modal */}
        <HarborEditModal
          harborId={editingHarborId}
          isOpen={harborModalOpen}
          onClose={() => setHarborModalOpen(false)}
          onSave={handleHarborSaved}
        />

        {/* Harbor View Modal */}
        <HarborViewModal
          harborId={viewingHarborId}
          isOpen={harborViewModalOpen}
          onClose={() => setHarborViewModalOpen(false)}
          onEdit={handleEditHarbor}
        />

        {/* Trivia Edit Modal */}
        <TriviaEditModal
          triviaId={editingTriviaId}
          isOpen={triviaModalOpen}
          onClose={() => setTriviaModalOpen(false)}
          onSave={handleTriviaSaved}
        />
      </div>
    </div>
  );
}