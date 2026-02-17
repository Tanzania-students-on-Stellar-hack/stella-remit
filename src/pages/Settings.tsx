import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, User, Wallet, Copy, CheckCircle, RefreshCw, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(50, "Display name must be under 50 characters"),
});

const Settings = () => {
  const { profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ display_name: displayName });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: parsed.data.display_name })
        .eq("user_id", profile?.user_id || "");
      if (error) throw error;
      toast.success("Profile updated!");
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
    setSaving(false);
  };

  const copyAddress = () => {
    if (profile?.stellar_public_key) {
      navigator.clipboard.writeText(profile.stellar_public_key);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-serif">Settings</h1>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <User className="h-5 w-5 text-accent" /> Profile
            </CardTitle>
            <CardDescription>Update your display name and account info</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Wallet Details */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" /> Wallet Details
            </CardTitle>
            <CardDescription>Your Stellar wallet information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.stellar_public_key ? (
              <>
                <div className="space-y-2">
                  <Label>Public Address</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded break-all">
                      {profile.stellar_public_key}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyAddress}
                      className="shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Network</Label>
                  <p className="text-sm text-muted-foreground">Stellar Mainnet (Public)</p>
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No wallet created yet. Go to Dashboard to create one.
              </p>
            )}
          </CardContent>
        </Card>
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />} Appearance
            </CardTitle>
            <CardDescription>Toggle between light and dark mode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Dark theme is active" : "Light theme is active"}
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
