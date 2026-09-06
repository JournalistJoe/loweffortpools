import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage } from "@/utils/errors";
import { GripVertical, ListOrdered, Settings, Sparkles, Star, Trash2, X } from "lucide-react";

interface DraftPreferenceManagerProps {
  leagueId: Id<"leagues">;
}

type BoardTeam = {
  _id: Id<"nflTeams">;
  abbrev: string;
  name: string;
  fullName: string;
  logoUrl: string | undefined;
  lastSeason: { wins: number; losses: number; ties: number } | null;
};

function formatRecord(r: BoardTeam["lastSeason"]) {
  if (!r) return "";
  return r.ties ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

function recordScore(r: BoardTeam["lastSeason"]) {
  if (!r) return -1;
  const games = r.wins + r.losses + r.ties;
  return games === 0 ? -1 : r.wins + (r.wins + r.ties / 2) / games;
}

function TeamLogo({ team, size = "w-8 h-8" }: { team: BoardTeam; size?: string }) {
  const [broken, setBroken] = useState(false);
  if (team.logoUrl && !broken) {
    return (
      <img
        src={team.logoUrl}
        alt=""
        className={`${size} object-contain shrink-0`}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className={`${size} flex items-center justify-center font-bold text-xs shrink-0`}>
      {team.abbrev}
    </div>
  );
}

function SortableRow({
  team,
  index,
  onRemove,
}: {
  team: BoardTeam;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: team._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border bg-card ${
        isDragging ? "border-primary shadow-lg opacity-90 z-10" : "border-border"
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag to reorder ${team.fullName}`}
        className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Badge variant="secondary" className="min-w-[2rem] justify-center font-mono">
        {index + 1}
      </Badge>
      {index === 0 && <Star className="h-4 w-4 text-yellow-500 shrink-0" />}
      <TeamLogo team={team} size="w-6 h-6" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{team.fullName}</div>
        <div className="text-xs text-muted-foreground">
          {team.lastSeason ? `Last season ${formatRecord(team.lastSeason)}` : team.abbrev}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Remove ${team.fullName} from your list`}
        className="h-7 w-7 p-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function DraftPreferenceManager({ leagueId }: DraftPreferenceManagerProps) {
  const league = useQuery(api.leagues.getLeague, { leagueId });
  const board = useQuery(api.draft.getRankingBoard, { leagueId });
  const preferences = useQuery(api.draft.getDraftPreferences, { leagueId });
  const setDraftPreferences = useMutation(api.draft.setDraftPreferences);

  const [ranked, setRanked] = useState<Id<"nflTeams">[]>([]);
  const [enableAutoDraft, setEnableAutoDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const teamById = useMemo(
    () => new Map((board?.teams ?? []).map((t) => [t._id, t])),
    [board],
  );

  // Load the saved list once both queries have settled; keep the user's edits if they've started.
  useEffect(() => {
    if (!board || preferences === undefined || hasUnsavedChanges) return;
    if (preferences) {
      setRanked(preferences.rankings.filter((id) => teamById.has(id)));
      setEnableAutoDraft(preferences.enableAutoDraft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, preferences, hasUnsavedChanges]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const touch = (next: Id<"nflTeams">[]) => {
    setRanked(next);
    setHasUnsavedChanges(true);
  };

  const add = (id: Id<"nflTeams">) => touch([...ranked, id]);
  const remove = (id: Id<"nflTeams">) => touch(ranked.filter((t) => t !== id));
  const clear = () => touch([]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ranked.indexOf(active.id as Id<"nflTeams">);
    const to = ranked.indexOf(over.id as Id<"nflTeams">);
    if (from < 0 || to < 0) return;
    touch(arrayMove(ranked, from, to));
  };

  const autoFill = () => {
    if (!board) return;
    const rankedSet = new Set(ranked);
    const rest = board.teams
      .filter((t) => !rankedSet.has(t._id))
      .sort((a, b) => recordScore(b.lastSeason) - recordScore(a.lastSeason) || a.fullName.localeCompare(b.fullName))
      .map((t) => t._id);
    touch([...ranked, ...rest]);
  };

  const save = async () => {
    if (ranked.length === 0) {
      toast.error("Add at least one team to your list");
      return;
    }
    setSaving(true);
    try {
      await setDraftPreferences({ leagueId, rankings: ranked, enableAutoDraft });
      setHasUnsavedChanges(false);
      toast.success(
        ranked.length === (board?.teams.length ?? 32)
          ? "Full rankings saved"
          : `Saved ${ranked.length} ranked ${ranked.length === 1 ? "team" : "teams"}`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!league || !board || preferences === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner />
      </div>
    );
  }

  if (league.status !== "setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Draft Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Draft preferences can only be set before the draft starts.</p>
        </CardContent>
      </Card>
    );
  }

  const rankedTeams = ranked.map((id) => teamById.get(id)).filter((t): t is BoardTeam => !!t);
  const rankedSet = new Set(ranked);
  const remaining = board.teams.filter((t) => !rankedSet.has(t._id));
  const saveBar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => void save()} disabled={saving || !hasUnsavedChanges || ranked.length === 0}>
        {saving ? "Saving..." : hasUnsavedChanges ? "Save list" : "Saved"}
      </Button>
      {remaining.length > 0 && (
        <Button variant="outline" onClick={autoFill} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Auto-fill the rest by last season
        </Button>
      )}
      {ranked.length > 0 && (
        <Button variant="ghost" onClick={clear} className="gap-2 text-muted-foreground">
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Draft Preferences
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Whenever the app picks for you, it goes down your list and takes the first team still
            available. Past the end of your list it takes the best remaining team by last season&apos;s
            record. You don&apos;t have to rank all {board.teams.length}; a short list of the teams you
            care about is enough.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Switch
              id="auto-draft"
              checked={enableAutoDraft}
              onCheckedChange={(checked) => {
                setEnableAutoDraft(checked);
                setHasUnsavedChanges(true);
              }}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="auto-draft">Draft for me automatically</Label>
              <p className="text-sm text-muted-foreground">
                {enableAutoDraft
                  ? "On: the moment your turn starts, your top available team is picked. No waiting."
                  : "Off: we wait for you each turn. If the pick timer runs out, we pick from your list."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Your list
            <Badge variant="secondary">{ranked.length}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tap teams on the right to add them in order. Drag the handle to reorder.
          </p>
        </CardHeader>
        <CardContent>
          {saveBar}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div>
              {rankedTeams.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No teams yet. Start with your favorite.
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={ranked} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {rankedTeams.map((team, index) => (
                        <SortableRow key={team._id} team={team} index={index} onRemove={() => remove(team._id)} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">
                  Available <span className="text-muted-foreground">({remaining.length})</span>
                </h3>
                <span className="text-xs text-muted-foreground">Records from {board.lastSeasonYear}</span>
              </div>
              {remaining.length === 0 ? (
                <p className="text-sm text-muted-foreground">Every team is on your list.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                  {remaining.map((team) => (
                    <Button
                      key={team._id}
                      variant="outline"
                      onClick={() => add(team._id)}
                      className="h-auto p-2 text-left justify-start gap-2"
                    >
                      <TeamLogo team={team} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium leading-tight">{team.abbrev}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {team.lastSeason ? formatRecord(team.lastSeason) : team.name}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {ranked.length > 0 && <div className="mt-4 lg:hidden">{saveBar}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
