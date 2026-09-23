"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, MapPin, Sparkles, MoreVertical, Trash2 } from "lucide-react";

export type ApplicationStage = "APPLIED" | "SCREENING" | "TECHNICAL" | "OFFER" | "REJECTED";

export interface Contact {
  id: string;
  name: string;
  title?: string;
  email?: string;
}

export interface ApplicationNote {
  id: string;
  text: string;
  date: string;
}

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  stage: ApplicationStage;
  salaryRange?: string;
  matchScore?: number;
  updatedAt: string;
  dateApplied?: string;
  description?: string;
  contacts?: Contact[];
  notes?: ApplicationNote[];
  lastFollowedUpAt?: string;
}

const STAGES: { id: ApplicationStage; label: string; color: string }[] = [
  { id: "APPLIED", label: "Applied", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { id: "SCREENING", label: "Screening", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { id: "TECHNICAL", label: "Technical", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { id: "OFFER", label: "Offer", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { id: "REJECTED", label: "Rejected", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
];

interface BoardProps {
  applications: JobApplication[];
  onApplicationsChange: (applications: JobApplication[]) => void;
  onApplicationSelect: (app: JobApplication) => void;
  onStageChange: (appId: string, newStage: ApplicationStage, previousStage: ApplicationStage) => void;
  onDeleteRequest: (app: JobApplication) => void;
}

export function KanbanBoard({
  applications,
  onApplicationsChange,
  onApplicationSelect,
  onStageChange,
  onDeleteRequest,
}: BoardProps) {
  const [activeApp, setActiveApp] = useState<JobApplication | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a.id === event.active.id);
    if (app) setActiveApp(app);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = applications.find((a) => a.id === activeId);
    if (!activeItem) return;

    // Check if dropping over a column container or another item
    const isOverAColumn = STAGES.some((s) => s.id === overId);
    let targetStage: ApplicationStage | null = null;

    if (isOverAColumn) {
      targetStage = overId as ApplicationStage;
    } else {
      const overItem = applications.find((a) => a.id === overId);
      if (overItem) targetStage = overItem.stage;
    }

    if (targetStage && activeItem.stage !== targetStage) {
      onApplicationsChange(
        applications.map((app) => (app.id === activeId ? { ...app, stage: targetStage! } : app))
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const activeItem = applications.find((a) => a.id === active.id);
    // activeApp was captured at drag start and never mutated during the
    // drag (only handleDragOver's optimistic update touches `applications`),
    // so its .stage is still the pre-drag value — lets the parent tell a
    // real stage transition apart from a same-column reorder.
    if (activeItem && activeApp) {
      onStageChange(activeItem.id, activeItem.stage, activeApp.stage);
    }
    setActiveApp(null);
  };

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;

    const intersections = rectIntersection(args);
    if (intersections.length > 0) return intersections;

    return closestCorners(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid w-full grid-cols-1 items-start gap-3 overflow-x-auto p-2 bg-card text-card-foreground sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {STAGES.map((stage) => {
          const stageApps = applications.filter((app) => app.stage === stage.id);
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              applications={stageApps}
              onSelect={onApplicationSelect}
              onDeleteRequest={onDeleteRequest}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeApp ? <KanbanCard application={activeApp} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  stage,
  applications,
  onSelect,
  onDeleteRequest,
}: {
  stage: { id: ApplicationStage; label: string; color: string };
  applications: JobApplication[];
  onSelect: (app: JobApplication) => void;
  onDeleteRequest: (app: JobApplication) => void;
}) {
  const { setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div ref={setNodeRef} className="flex flex-col rounded-xl bg-card border border-border p-3 w-full min-w-0 max-h-[45vh] sm:max-h-[55vh] lg:max-h-[65vh]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 ">
          <span className="font-semibold text-sm text-card-foreground">{stage.label}</span>
          <Badge variant="outline" className={stage.color}>
            {applications.length}
          </Badge>
        </div>
      </div>

      <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
          {applications.map((app) => (
            <SortableCard key={app.id} application={app} onSelect={onSelect} onDeleteRequest={onDeleteRequest} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableCard({
  application,
  onSelect,
  onDeleteRequest,
}: {
  application: JobApplication;
  onSelect: (app: JobApplication) => void;
  onDeleteRequest: (app: JobApplication) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard application={application} onClick={() => onSelect(application)} onDeleteRequest={onDeleteRequest} />
    </div>
  );
}

function KanbanCard({
  application,
  isDragging,
  onClick,
  onDeleteRequest,
}: {
  application: JobApplication;
  isDragging?: boolean;
  onClick?: () => void;
  onDeleteRequest?: (app: JobApplication) => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-accent/40 hover:shadow-md ${
        isDragging ? "scale-105 border-primary/50 shadow-lg" : ""
      }`}
    >
      <CardContent className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-card-foreground text-sm leading-snug">{application.jobTitle}</h4>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{application.companyName}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {application.matchScore && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1 px-1.5 py-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                {application.matchScore}%
              </Badge>
            )}
            {onDeleteRequest && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Application actions"
                    />
                  }
                >
                  <MoreVertical className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem variant="destructive" onClick={() => onDeleteRequest(application)}>
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
          {application.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{application.location}</span>
            </div>
          )}
          {application.salaryRange && (
            <span className="font-medium text-muted-foreground">{application.salaryRange}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}