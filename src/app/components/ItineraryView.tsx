import { useState, useEffect } from 'react';
import { projectId } from '/utils/supabase/info';
import logoImg from '../../assets/daily.png';
import headerImg from '../../assets/header.jpg';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, MapPin, Calendar, Users, UserPlus, Edit2, Check, X, Clock, DollarSign, Navigation, Info, Trash2, GripVertical, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ItineraryViewProps {
  session: any;
  itineraryId: string;
  onBack: () => void;
}

const formatDescription = (description: string) => {
  const sections = { address: '', hours: '', price: '', transit: '', tips: '', main: '' };
  const lines = description.split('.').map(s => s.trim()).filter(Boolean);
  let mainText: string[] = [];

  lines.forEach(line => {
    const l = line.toLowerCase();
    if (l.includes('open') || l.includes('closes') || l.includes('am') || l.includes('pm') || l.includes('hours')) {
      sections.hours += (sections.hours ? '. ' : '') + line;
    } else if (l.includes('¥') || l.includes('$') || l.includes('€') || l.includes('£') || l.includes('entry') || l.includes('admission') || l.includes('free')) {
      sections.price += (sections.price ? '. ' : '') + line;
    } else if (l.includes('walk') || l.includes('station') || l.includes('metro') || l.includes('subway') || l.includes('train') || l.includes('bus')) {
      sections.transit += (sections.transit ? '. ' : '') + line;
    } else if (l.includes('reservation') || l.includes('book') || l.includes('wait') || l.includes('best') || l.includes('arrive') || l.includes('avoid')) {
      sections.tips += (sections.tips ? '. ' : '') + line;
    } else {
      mainText.push(line);
    }
  });

  sections.main = mainText.join('. ');
  return sections;
};

interface SortableActivityProps {
  activity: any;
  dayIndex: number;
  editingActivity: string | null;
  editedActivity: any;
  onEdit: (dayIndex: number, activityId: string) => void;
  onDelete: (dayIndex: number, activityId: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditedChange: (updated: any) => void;
}

function SortableActivity({
  activity,
  dayIndex,
  editingActivity,
  editedActivity,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onEditedChange,
}: SortableActivityProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isEditing = editingActivity === activity.id;

  return (
    <div ref={setNodeRef} style={style} className="border-2 border-border rounded-xl bg-card shadow-sm hover:border-primary/30 transition-colors">
      {isEditing ? (
        <div className="p-5 space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={editedActivity.title}
              onChange={(e) => onEditedChange({ ...editedActivity, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editedActivity.description}
              onChange={(e) => onEditedChange({ ...editedActivity, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={editedActivity.notes}
              onChange={(e) => onEditedChange({ ...editedActivity, notes: e.target.value })}
              placeholder="Add your notes here..."
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave}>
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-start gap-2 mb-3">
            <button
              {...attributes}
              {...listeners}
              className="mt-1 p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-2 font-semibold">{activity.timeSlot}</Badge>
                <Badge className="bg-secondary text-white">{activity.type}</Badge>
              </div>
              <h4 className="font-bold text-lg text-foreground leading-tight">{activity.title}</h4>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(dayIndex, activity.id)}
                className="hover:bg-primary/10 hover:text-primary"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(dayIndex, activity.id)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {(() => {
            const formatted = formatDescription(activity.description);
            return (
              <div className="space-y-3 pl-6">
                {formatted.main && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{formatted.main}</p>
                )}
                <div className="grid grid-cols-1 gap-2">
                  {formatted.hours && (
                    <div className="flex items-start gap-2 text-xs text-foreground/70 bg-muted/50 p-2 rounded-md">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{formatted.hours}</span>
                    </div>
                  )}
                  {formatted.price && (
                    <div className="flex items-start gap-2 text-xs text-foreground/70 bg-muted/50 p-2 rounded-md">
                      <DollarSign className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
                      <span>{formatted.price}</span>
                    </div>
                  )}
                  {formatted.transit && (
                    <div className="flex items-start gap-2 text-xs text-foreground/70 bg-muted/50 p-2 rounded-md">
                      <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                      <span>{formatted.transit}</span>
                    </div>
                  )}
                  {formatted.tips && (
                    <div className="flex items-start gap-2 text-xs text-foreground/70 bg-primary/5 p-2 rounded-md border border-primary/20">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{formatted.tips}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-foreground/70">
                    {activity.duration}
                  </div>
                </div>
              </div>
            );
          })()}

          {activity.notes && (
            <div className="mt-3 ml-6 p-3 bg-primary/5 border-l-4 border-primary rounded-r text-sm text-foreground">
              <strong className="text-primary">Notes:</strong> {activity.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ItineraryView({ session, itineraryId, onBack }: ItineraryViewProps) {
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editedActivity, setEditedActivity] = useState<any>(null);
  const [addingToDayIndex, setAddingToDayIndex] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', timeSlot: '', type: 'Custom', duration: '', notes: '' });
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editedDayTitle, setEditedDayTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchItinerary();
  }, [itineraryId]);

  const fetchItinerary = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      const data = await response.json();
      if (response.ok) setItinerary(data.itinerary);
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (updatedPlan: any[]) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan: updatedPlan }),
        }
      );
      const data = await response.json();
      if (response.ok) setItinerary(data.itinerary);
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}/invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ username: inviteUsername }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setItinerary(data.itinerary);
        setInviteUsername('');
        setInviteDialogOpen(false);
      } else {
        alert(data.error || 'Failed to invite collaborator');
      }
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      alert('Failed to invite collaborator');
    }
  };

  const handleEditActivity = (dayIndex: number, activityId: string) => {
    const activity = itinerary.plan[dayIndex].activities.find((a: any) => a.id === activityId);
    setEditedActivity({ ...activity, dayIndex });
    setEditingActivity(activityId);
  };

  const handleSaveActivity = async () => {
    if (!editedActivity) return;
    const updatedPlan = [...itinerary.plan];
    const dayIndex = editedActivity.dayIndex;
    const activityIndex = updatedPlan[dayIndex].activities.findIndex((a: any) => a.id === editedActivity.id);
    updatedPlan[dayIndex].activities[activityIndex] = {
      id: editedActivity.id,
      timeSlot: editedActivity.timeSlot,
      type: editedActivity.type,
      title: editedActivity.title,
      description: editedActivity.description,
      duration: editedActivity.duration,
      notes: editedActivity.notes,
    };
    await savePlan(updatedPlan);
    setEditingActivity(null);
    setEditedActivity(null);
  };

  const handleDeleteActivity = async (dayIndex: number, activityId: string) => {
    if (!confirm('Remove this activity from your itinerary?')) return;
    const updatedPlan = itinerary.plan.map((day: any, i: number) => {
      if (i !== dayIndex) return day;
      return { ...day, activities: day.activities.filter((a: any) => a.id !== activityId) };
    });
    setItinerary({ ...itinerary, plan: updatedPlan });
    await savePlan(updatedPlan);
  };

  const handleAddActivity = async () => {
    if (addingToDayIndex === null || !newActivity.title) return;
    const activity = {
      id: `custom-${Date.now()}`,
      timeSlot: newActivity.timeSlot || 'Flexible',
      type: newActivity.type || 'Custom',
      title: newActivity.title,
      description: newActivity.description,
      duration: newActivity.duration || 'Self-paced',
      notes: newActivity.notes,
    };
    const updatedPlan = itinerary.plan.map((day: any, i: number) =>
      i !== addingToDayIndex ? day : { ...day, activities: [...day.activities, activity] }
    );
    setItinerary({ ...itinerary, plan: updatedPlan });
    setAddingToDayIndex(null);
    setNewActivity({ title: '', description: '', timeSlot: '', type: 'Custom', duration: '', notes: '' });
    await savePlan(updatedPlan);
  };

  const handleSaveDayTitle = async () => {
    if (editingDayIndex === null) return;
    const updatedPlan = itinerary.plan.map((day: any, i: number) =>
      i !== editingDayIndex ? day : { ...day, title: editedDayTitle.trim() || `Day ${day.day}` }
    );
    setItinerary({ ...itinerary, plan: updatedPlan });
    setEditingDayIndex(null);
    await savePlan(updatedPlan);
  };

  const handleDeleteDay = async (dayIndex: number) => {
    if (!confirm('Remove this entire day from your itinerary?')) return;
    const filtered = itinerary.plan.filter((_: any, i: number) => i !== dayIndex);
    const renumbered = filtered.map((day: any, i: number) => ({ ...day, day: i + 1 }));
    setItinerary({ ...itinerary, plan: renumbered });
    await savePlan(renumbered);
  };

  const handleDragEnd = async (event: DragEndEvent, dayIndex: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activities = itinerary.plan[dayIndex].activities;
    const oldIndex = activities.findIndex((a: any) => a.id === active.id);
    const newIndex = activities.findIndex((a: any) => a.id === over.id);
    const reordered = arrayMove(activities, oldIndex, newIndex);
    const updatedPlan = itinerary.plan.map((day: any, i: number) =>
      i !== dayIndex ? day : { ...day, activities: reordered }
    );
    setItinerary({ ...itinerary, plan: updatedPlan });
    await savePlan(updatedPlan);
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-lg text-slate-600">Itinerary not found</div>
      </div>
    );
  }

  const isOwner = itinerary.ownerId === session.user.id;

  return (
    <div className="size-full overflow-auto bg-background">
      <header
        className="relative border-b border-white/10 shadow-lg sticky top-0 z-10 overflow-hidden"
        style={{ backgroundImage: `url(${headerImg})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
      >
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{itinerary.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/90">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{itinerary.location}</span>
                    {itinerary.area && ` - ${itinerary.area}`}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {itinerary.startDate && itinerary.endDate ? (
                      <span className="font-medium">
                        {format(new Date(itinerary.startDate), 'MMM d')} - {format(new Date(itinerary.endDate), 'MMM d, yyyy')} ({itinerary.days} days)
                      </span>
                    ) : (
                      <span className="font-medium">{itinerary.days} days</span>
                    )}
                  </div>
                </div>
                {itinerary.base && (
                  <div className="mt-1.5 text-xs text-white/70">Staying in {itinerary.base}</div>
                )}
              </div>
            </div>
            {isOwner && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-md">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Collaborator
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Collaborator</DialogTitle>
                    <DialogDescription>Enter the username of the person you want to invite.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteCollaborator} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-username">Username</Label>
                      <Input
                        id="invite-username"
                        type="text"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        required
                        placeholder="wheretwo-user-0"
                      />
                    </div>
                    <Button type="submit" className="w-full">Send Invitation</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="px-3 py-1.5 bg-primary text-white">
                @{itinerary.ownerUsername} (Owner)
              </Badge>
              {itinerary.collaborators.map((collab: any) => (
                <Badge key={collab.userId} variant="outline" className="px-3 py-1.5 border-2">
                  @{collab.username}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {itinerary.plan.map((day: any, dayIndex: number) => (
            <Card key={day.day} className="border-2 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-2">
                    {editingDayIndex === dayIndex ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedDayTitle}
                          onChange={(e) => setEditedDayTitle(e.target.value)}
                          className="text-xl font-bold h-9 max-w-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveDayTitle();
                            if (e.key === 'Escape') setEditingDayIndex(null);
                          }}
                        />
                        <Button size="icon" variant="ghost" onClick={handleSaveDayTitle} className="hover:bg-primary/10 hover:text-primary">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingDayIndex(null)} className="hover:bg-muted">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="text-2xl font-bold text-foreground">{day.title || `Day ${day.day}`}</CardTitle>
                    )}
                    <CardDescription className="text-base mt-1">{day.date}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { setEditingDayIndex(dayIndex); setEditedDayTitle(day.title || `Day ${day.day}`); }}
                      className="hover:bg-primary/10 hover:text-primary text-muted-foreground"
                      title="Edit day title"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteDay(dayIndex)}
                      className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                      title="Remove day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, dayIndex)}
                >
                  <SortableContext
                    items={day.activities.map((a: any) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {day.activities.map((activity: any) => (
                        <SortableActivity
                          key={activity.id}
                          activity={activity}
                          dayIndex={dayIndex}
                          editingActivity={editingActivity}
                          editedActivity={editedActivity}
                          onEdit={handleEditActivity}
                          onDelete={handleDeleteActivity}
                          onSave={handleSaveActivity}
                          onCancel={() => { setEditingActivity(null); setEditedActivity(null); }}
                          onEditedChange={setEditedActivity}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <button
                  onClick={() => {
                    setAddingToDayIndex(dayIndex);
                    setNewActivity({ title: '', description: '', timeSlot: '', type: 'Custom', duration: '', notes: '' });
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={addingToDayIndex !== null} onOpenChange={(open) => { if (!open) setAddingToDayIndex(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>Add a custom activity to Day {addingToDayIndex !== null ? addingToDayIndex + 1 : ''}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                placeholder="e.g. Visit the local market"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Input
                  value={newActivity.timeSlot}
                  onChange={(e) => setNewActivity({ ...newActivity, timeSlot: e.target.value })}
                  placeholder="e.g. 10:00 AM"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                  placeholder="e.g. 2 hours"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                placeholder="What's this activity about?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newActivity.notes}
                onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                placeholder="Any reminders or tips..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAddingToDayIndex(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAddActivity} disabled={!newActivity.title}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Activity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
