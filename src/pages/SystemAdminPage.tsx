import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import {
  Database,
  RefreshCw,
  Download,
  TestTube,
  Shield,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

export function SystemAdminPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isImporting, setIsImporting] = useState(false);
  const [syncWeek, setSyncWeek] = useState("1");
  const [isResyncing, setIsResyncing] = useState(false);
  const [isCreatingTestLeague, setIsCreatingTestLeague] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showResyncDialog, setShowResyncDialog] = useState(false);

  const importTeams = useMutation(api.nflData.importTeams);
  const manualResync = useMutation(api.nflData.manualResync);
  const createTestLeague = useMutation(api.testLeague.createTestLeague);

  // Show loading state while currentUser is undefined
  if (currentUser === undefined) {
    return null; // or a loading spinner if preferred
  }

  // Check if user is superuser
  if (!currentUser?.isSuperuser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-4">
          System Admin Access Required
        </h1>
        <p className="text-muted-foreground">
          You must be a system administrator to access this page.
        </p>
      </div>
    );
  }

  const handleImportTeams = async () => {
    setIsImporting(true);
    try {
      const result = await importTeams({
        seasonYear: 2025, // Current season
      });
      toast.success(`Imported ${result.imported} NFL teams for all leagues`);
      setShowImportDialog(false);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualResync = async () => {
    const weekNumber = parseInt(syncWeek, 10);
    if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 18) {
      toast.error("Week must be a valid number between 1 and 18");
      return;
    }

    setIsResyncing(true);
    try {
      await manualResync({ week: weekNumber });
      toast.success(`Resynced week ${weekNumber} game data for all leagues`);
      setShowResyncDialog(false);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsResyncing(false);
    }
  };

  const handleCreateTestLeague = async () => {
    setIsCreatingTestLeague(true);
    try {
      const result = await createTestLeague({});
      toast.success(result.message);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsCreatingTestLeague(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Database className="h-8 w-8" />
          System Administration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage global data and system-wide operations
        </p>
      </div>

      <div className="space-y-6">
        {/* Global NFL Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Global NFL Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Global Operations Warning</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    These operations affect ALL leagues in the system. Use with caution.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isImporting}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isImporting ? "Importing..." : "Import NFL Teams (2025)"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import NFL Teams - Global Operation</DialogTitle>
                    <DialogDescription>
                      This will replace ALL NFL team data for the 2025 season across the entire system. 
                      This affects every league using the 2025 season and cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImportTeams} disabled={isImporting}>
                      {isImporting ? "Importing..." : "Import Teams"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <p className="text-sm text-muted-foreground mt-1">
                Replace all NFL teams for the 2025 season (affects all leagues)
              </p>
            </div>

            <Separator />

            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="sync-week">Week to Resync</Label>
                <Select value={syncWeek} onValueChange={setSyncWeek}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 18 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showResyncDialog} onOpenChange={setShowResyncDialog}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isResyncing}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isResyncing ? "Resyncing..." : "Manual Resync"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manual Resync - Global Operation</DialogTitle>
                    <DialogDescription>
                      This will update game results for week {syncWeek} across ALL leagues in the system. 
                      This affects scoring for every league and cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowResyncDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleManualResync} disabled={isResyncing}>
                      {isResyncing ? "Resyncing..." : `Resync Week ${syncWeek}`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground">
              Manually sync game results for a specific week (affects all leagues)
            </p>
          </CardContent>
        </Card>

        {/* Development Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Development Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button
                onClick={handleCreateTestLeague}
                disabled={isCreatingTestLeague}
                variant="outline"
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isCreatingTestLeague ? "Creating..." : "Create Test League"}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Generate a complete test league with 8 participants and finished draft
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}