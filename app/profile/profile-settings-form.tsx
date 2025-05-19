"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Globe, Save, Upload, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

export default function ProfileSettingsForm({ user, profile }) {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [username, setUsername] = useState(profile?.username || user.user_metadata?.username || "");
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || language || "en");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const getInitials = () => (username ? username.substring(0, 2).toUpperCase() : user.email?.substring(0, 2).toUpperCase() || "U");

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarUrl(null);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    setUploading(true);
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, avatarFile);
    if (error) throw error;
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setUploading(false);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session; // Ensure session exists
      if (!session) throw new Error("No active session");
      let newAvatarUrl = avatarUrl;
      if (avatarFile) newAvatarUrl = await uploadAvatar();
      const { error: updateError } = await supabase.from("profiles").update({ username, preferred_language: preferredLanguage, avatar_url: newAvatarUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (updateError) throw updateError;
      const { error: metadataError } = await supabase.auth.updateUser({ data: { username, preferred_language: preferredLanguage, avatar_url: newAvatarUrl } });
      if (metadataError) throw metadataError;
      if (preferredLanguage !== language) setLanguage(preferredLanguage);
      setSuccess(true);
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Update your profile details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-6 bg-green-100 dark:bg-green-900/30"><AlertDescription className="text-green-700 dark:text-green-300">Profile updated!</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32 border-2 border-gray-200 dark:border-gray-700">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : <AvatarFallback className="text-4xl bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">{getInitials()}</AvatarFallback>}
            </Avatar>
            <div className="flex gap-2">
              <label htmlFor="avatar-upload" className="cursor-pointer"><Button variant="secondary" size="sm"><Upload className="h-4 w-4 mr-2" />Upload</Button><input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label>
              {avatarUrl && <Button variant="destructive" size="sm" onClick={handleRemoveAvatar}><Trash className="h-4 w-4 mr-2" />Remove</Button>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Click to change your avatar</p>
          </div>
          <div className="space-y-4">
            <div className="relative"><Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 mt-1 w-full border-gray-300 dark:border-gray-600 rounded-md" required /><User className="absolute left-3 top-9 h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
            <div className="relative"><Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label><Input id="email" value={user.email || ""} disabled className="pl-10 mt-1 w-full border-gray-300 dark:border-gray-600 rounded-md opacity-70" /><Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400 dark:text-gray-500" /><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact support to change.</p></div>
            <div className="relative"><Label htmlFor="language" className="text-gray-700 dark:text-gray-300">Language</Label><Select value={preferredLanguage} onValueChange={setPreferredLanguage} className="mt-1 w-full"><SelectTrigger className="pl-10 w-full border-gray-300 dark:border-gray-600 rounded-md"><SelectValue placeholder="Select language" /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="fi">Finnish</SelectItem><SelectItem value="sv">Swedish</SelectItem></SelectContent></Select><Globe className="absolute left-3 top-9 h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md" disabled={loading || uploading}>{loading || uploading ? <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/></svg>Saving...</span> : <span className="flex items-center"><Save className="h-5 w-5 mr-2" />Save Changes</span>}</Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <Button variant="outline" onClick={() => router.push("/profile")} className="text-gray-700 dark:text-gray-300">Cancel</Button>
        <Button variant="destructive" onClick={() => router.push("/profile")} className="text-red-700 dark:text-red-400">Delete Account</Button>
      </CardFooter>
    </Card>
  );
}