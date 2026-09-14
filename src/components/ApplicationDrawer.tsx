"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Calendar, DollarSign, Mail, MapPin, User, Send, Plus, Trash2 } from "lucide-react";
import { JobApplication, Contact, ApplicationNote } from "@/components/kanban/board";

interface ApplicationDrawerProps {
  application: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateApplication: (application: JobApplication) => void;
  onDeleteRequest: (application: JobApplication) => void;
}

export function ApplicationDetailDrawer({
  application,
  isOpen,
  onClose,
  onUpdateApplication,
  onDeleteRequest,
}: ApplicationDrawerProps) {
  const [newNote, setNewNote] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", title: "", email: "" });

  if (!application) return null;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: ApplicationNote = {
      id: crypto.randomUUID(),
      text: newNote.trim(),
      date: new Date().toISOString().split("T")[0],
    };
    onUpdateApplication({ ...application, notes: [...(application.notes ?? []), note] });
    setNewNote("");
  };

  const handleAddContact = () => {
    if (!contactForm.name.trim()) return;
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: contactForm.name.trim(),
      title: contactForm.title.trim() || undefined,
      email: contactForm.email.trim() || undefined,
    };
    onUpdateApplication({ ...application, contacts: [...(application.contacts ?? []), contact] });
    setContactForm({ name: "", title: "", email: "" });
    setIsAddingContact(false);
  };

  const contacts = application.contacts ?? [];
  const notes = application.notes ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl bg-card border-border text-card-foreground overflow-y-auto p-6">
        <SheetHeader className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs uppercase tracking-wider">
              {application.stage}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Updated {application.updatedAt}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDeleteRequest(application)}
                aria-label="Delete application"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
          <SheetTitle className="text-xl text-card-foreground">{application.jobTitle}</SheetTitle>
          <SheetDescription className="text-muted-foreground flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" /> {application.companyName}
            </span>
            {application.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {application.location}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts{contacts.length > 0 ? ` (${contacts.length})` : ""}</TabsTrigger>
            <TabsTrigger value="notes">Notes & Logs{notes.length > 0 ? ` (${notes.length})` : ""}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-card rounded-lg border border-border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Salary Target
                </span>
                <p className="text-sm font-medium text-card-foreground">
                  {application.salaryRange || "Not specified"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Applied On
                </span>
                <p className="text-sm font-medium text-card-foreground">{application.updatedAt}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-card-foreground">Job Description</h4>
              <div className="p-3 bg-card rounded-lg border border-border text-xs text-muted-foreground leading-relaxed max-h-60 overflow-y-auto">
                <p>{application.description || "No description added."}</p>
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-3 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-card-foreground">Interview Contacts</h4>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setIsAddingContact((v) => !v)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Contact
              </Button>
            </div>

            {isAddingContact && (
              <div className="p-3 bg-card rounded-lg border border-border space-y-2">
                <Input
                  placeholder="Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  placeholder="Title (optional)"
                  value={contactForm.title}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={handleAddContact}>
                    Save Contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setIsAddingContact(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {contacts.length === 0 && !isAddingContact && (
              <p className="text-xs text-muted-foreground">No contacts added yet.</p>
            )}

            {contacts.map((contact) => (
              <div key={contact.id} className="p-3 bg-card rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{contact.name}</p>
                      {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                    </div>
                  </div>
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-muted-foreground hover:text-blue-400"
                      aria-label={`Email ${contact.name}`}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add meeting notes, questions, or updates..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                className="text-sm"
              />
              <Button size="sm" onClick={handleAddNote}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>

            {notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}

            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-card rounded-lg border border-border space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Note Log</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.text}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
