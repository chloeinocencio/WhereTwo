import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, MapPin, Calendar, Users, UserPlus, Edit2, Check, X, Clock, DollarSign, Navigation, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface ItineraryViewProps {
  session: any;
  itineraryId: string;
  onBack: () => void;
}

const formatDescription = (description: string) => {
  const sections = {
    address: '',
    hours: '',
    price: '',
    transit: '',
    tips: '',
    main: ''
  };

  const lines = description.split('.').map(s => s.trim()).filter(Boolean);
  let mainText: string[] = [];

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes('open') || lowerLine.includes('closes') || lowerLine.includes('am') || lowerLine.includes('pm') || lowerLine.includes('hours')) {
      sections.hours += (sections.hours ? '. ' : '') + line;
    } else if (lowerLine.includes('¥') || lowerLine.includes('$') || lowerLine.includes('€') || lowerLine.includes('£') || lowerLine.includes('entry') || lowerLine.includes('admission') || lowerLine.includes('free')) {
      sections.price += (sections.price ? '. ' : '') + line;
    } else if (lowerLine.includes('walk') || lowerLine.includes('station') || lowerLine.includes('metro') || lowerLine.includes('subway') || lowerLine.includes('train') || lowerLine.includes('bus')) {
      sections.transit += (sections.transit ? '. ' : '') + line;
    } else if (lowerLine.includes('reservation') || lowerLine.includes('book') || lowerLine.includes('wait') || lowerLine.includes('best') || lowerLine.includes('arrive') || lowerLine.includes('avoid')) {
      sections.tips += (sections.tips ? '. ' : '') + line;
    } else {
      mainText.push(line);
    }
  });

  sections.main = mainText.join('. ');

  return sections;
};

export function ItineraryView({ session, itineraryId, onBack }: ItineraryViewProps) {
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editedActivity, setEditedActivity] = useState<any>(null);

  useEffect(() => {
    fetchItinerary();
  }, [itineraryId]);

  const fetchItinerary = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setItinerary(data.itinerary);
      }
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
    } finally {
      setLoading(false);
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
    const day = itinerary.plan[dayIndex];
    const activity = day.activities.find((a: any) => a.id === activityId);
    setEditedActivity({ ...activity, dayIndex });
    setEditingActivity(activityId);
  };

  const handleSaveActivity = async () => {
    if (!editedActivity) return;

    const updatedPlan = [...itinerary.plan];
    const dayIndex = editedActivity.dayIndex;
    const activityIndex = updatedPlan[dayIndex].activities.findIndex(
      (a: any) => a.id === editedActivity.id
    );

    updatedPlan[dayIndex].activities[activityIndex] = {
      id: editedActivity.id,
      timeSlot: editedActivity.timeSlot,
      type: editedActivity.type,
      title: editedActivity.title,
      description: editedActivity.description,
      duration: editedActivity.duration,
      notes: editedActivity.notes,
    };

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

      if (response.ok) {
        setItinerary(data.itinerary);
        setEditingActivity(null);
        setEditedActivity(null);
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setEditedActivity(null);
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
      <header className="bg-gradient-to-r from-primary via-primary/90 to-accent border-b border-white/10 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
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
                  <div className="mt-1.5 text-xs text-white/70">
                    Staying in {itinerary.base}
                  </div>
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
                    <DialogDescription>
                      Enter the username of the person you want to invite.
                    </DialogDescription>
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
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 flex-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            <h3 className="text-2xl font-bold text-foreground">Your Journey</h3>
            <div className="h-1 flex-1 bg-gradient-to-l from-primary to-accent rounded-full"></div>
          </div>
          {itinerary.plan.map((day: any, dayIndex: number) => (
            <Card key={day.day} className="border-2 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <CardTitle className="text-2xl font-bold text-foreground">Day {day.day}</CardTitle>
                <CardDescription className="text-base mt-1">{day.date}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {day.activities.map((activity: any) => (
                    <div key={activity.id} className="border-2 border-border rounded-xl p-5 hover:border-primary/30 transition-colors bg-card shadow-sm">
                      {editingActivity === activity.id ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={editedActivity.title}
                              onChange={(e) => setEditedActivity({ ...editedActivity, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={editedActivity.description}
                              onChange={(e) => setEditedActivity({ ...editedActivity, description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              value={editedActivity.notes}
                              onChange={(e) => setEditedActivity({ ...editedActivity, notes: e.target.value })}
                              placeholder="Add your notes here..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveActivity}>
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-2 font-semibold">{activity.timeSlot}</Badge>
                                <Badge className="bg-secondary text-white">{activity.type}</Badge>
                              </div>
                              <h4 className="font-bold text-lg text-foreground leading-tight">{activity.title}</h4>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditActivity(dayIndex, activity.id)}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {(() => {
                            const formatted = formatDescription(activity.description);
                            return (
                              <div className="space-y-3">
                                {formatted.main && (
                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                    {formatted.main}
                                  </p>
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
                            <div className="mt-3 p-3 bg-primary/5 border-l-4 border-primary rounded-r text-sm text-foreground">
                              <strong className="text-primary">Notes:</strong> {activity.notes}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}