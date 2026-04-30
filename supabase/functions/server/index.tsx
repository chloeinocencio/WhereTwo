import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { generateRandomUsername } from "./username-generator.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to get authenticated user
const getAuthUser = async (authHeader: string | null) => {
  if (!authHeader) return null;
  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) return null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  return error ? null : user;
};

// Health check endpoint - UPDATED
async function sendEmail(to: string, subject: string, html: string) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WhereTwo <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`Email send error: ${JSON.stringify(data)}`);
      return { success: false, error: data };
    }

    console.log(`Email sent successfully to ${to}`);
    return { success: true, data };
  } catch (error) {
    console.log(`Email send exception: ${error}`);
    return { success: false, error };
  }
}

app.get("/make-server-9b7ec865/health", (c) => {
  return c.json({ status: "ok", version: "3.0-gemini-flash" });
});

// Generate random username endpoint
app.get("/make-server-9b7ec865/generate-username", (c) => {
  return c.json({ username: generateRandomUsername() });
});

// Auth endpoints
app.post("/make-server-9b7ec865/signup", async (c) => {
  try {
    const { email, password, username } = await c.req.json();

    if (!email || !password || !username) {
      return c.json({ error: "Email, password, and username are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check if username already exists
    const existingUsername = await kv.get(`username:${username}`);
    if (existingUsername) {
      return c.json({ error: "Username already taken" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Sign up error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store username mapping
    await kv.set(`username:${username}`, { userId: data.user.id });
    await kv.set(`user:${data.user.id}:username`, username);

    // Send welcome email
    await sendEmail(
      email,
      'Welcome to WhereTwo!',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #276fbf;">Welcome to WhereTwo!</h1>
          <p>Hi <strong>@${username}</strong>,</p>
          <p>Your account has been successfully created. You can now start planning your travel itineraries with AI-powered recommendations!</p>
          <h2 style="color: #276fbf;">What you can do:</h2>
          <ul>
            <li>Create personalized travel itineraries</li>
            <li>Get AI-generated activity recommendations</li>
            <li>Invite collaborators to plan trips together</li>
            <li>Edit and customize your plans</li>
          </ul>
          <p>Happy travels!</p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            This is an automated email from WhereTwo. Please do not reply to this email.
          </p>
        </div>
      `
    );

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Sign up error during request processing: ${error}`);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// Itinerary endpoints
app.post("/make-server-9b7ec865/itineraries", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { location, area, base, days, title, interests, travelStyle, pace, startDate, endDate } = await c.req.json();

    if (!location || !days || !title || !base) {
      return c.json({ error: "Location, base, days, and title are required" }, 400);
    }

    const ownerUsername = await kv.get(`user:${user.id}:username`) || user.user_metadata?.username || 'unknown';

    const itineraryId = crypto.randomUUID();
    const itinerary = {
      id: itineraryId,
      title,
      location,
      area: area || "",
      base,
      days: parseInt(days),
      startDate: startDate || null,
      endDate: endDate || null,
      interests: interests || [],
      travelStyle: travelStyle || 'balanced',
      pace: pace || 'moderate',
      ownerId: user.id,
      ownerUsername,
      collaborators: [],
      plan: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`itinerary:${itineraryId}`, itinerary);
    await kv.set(`user:${user.id}:itinerary:${itineraryId}`, { id: itineraryId });

    return c.json({ itinerary });
  } catch (error) {
    console.log(`Create itinerary error: ${error}`);
    return c.json({ error: "Failed to create itinerary" }, 500);
  }
});

app.get("/make-server-9b7ec865/itineraries", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userItineraries = await kv.getByPrefix(`user:${user.id}:itinerary:`);
    const itineraryIds = userItineraries.map((item: any) => item.id);

    const itineraries = await Promise.all(
      itineraryIds.map((id: string) => kv.get(`itinerary:${id}`))
    );

    return c.json({ itineraries: itineraries.filter(Boolean) });
  } catch (error) {
    console.log(`Get itineraries error: ${error}`);
    return c.json({ error: "Failed to fetch itineraries" }, 500);
  }
});

app.get("/make-server-9b7ec865/itineraries/:id", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const itineraryId = c.req.param('id');
    const itinerary = await kv.get(`itinerary:${itineraryId}`);

    if (!itinerary) {
      return c.json({ error: "Itinerary not found" }, 404);
    }

    const isOwner = itinerary.ownerId === user.id;
    const isCollaborator = itinerary.collaborators.some((collab: any) => collab.userId === user.id);

    if (!isOwner && !isCollaborator) {
      return c.json({ error: "Access denied" }, 403);
    }

    return c.json({ itinerary });
  } catch (error) {
    console.log(`Get itinerary error: ${error}`);
    return c.json({ error: "Failed to fetch itinerary" }, 500);
  }
});

app.put("/make-server-9b7ec865/itineraries/:id", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const itineraryId = c.req.param('id');
    const itinerary = await kv.get(`itinerary:${itineraryId}`);

    if (!itinerary) {
      return c.json({ error: "Itinerary not found" }, 404);
    }

    const isOwner = itinerary.ownerId === user.id;
    const isCollaborator = itinerary.collaborators.some((collab: any) => collab.userId === user.id);

    if (!isOwner && !isCollaborator) {
      return c.json({ error: "Access denied" }, 403);
    }

    const updates = await c.req.json();
    const updatedItinerary = {
      ...itinerary,
      ...updates,
      id: itineraryId,
      ownerId: itinerary.ownerId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`itinerary:${itineraryId}`, updatedItinerary);

    return c.json({ itinerary: updatedItinerary });
  } catch (error) {
    console.log(`Update itinerary error: ${error}`);
    return c.json({ error: "Failed to update itinerary" }, 500);
  }
});

app.delete("/make-server-9b7ec865/itineraries/:id", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const itineraryId = c.req.param('id');
    const itinerary = await kv.get(`itinerary:${itineraryId}`);

    if (!itinerary) {
      return c.json({ error: "Itinerary not found" }, 404);
    }

    if (itinerary.ownerId !== user.id) {
      return c.json({ error: "Only the owner can delete this itinerary" }, 403);
    }

    // Delete itinerary
    await kv.del(`itinerary:${itineraryId}`);

    // Delete owner's reference
    await kv.del(`user:${user.id}:itinerary:${itineraryId}`);

    // Delete all collaborators' references
    for (const collab of itinerary.collaborators) {
      await kv.del(`user:${collab.userId}:itinerary:${itineraryId}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete itinerary error: ${error}`);
    return c.json({ error: "Failed to delete itinerary" }, 500);
  }
});

app.put("/make-server-9b7ec865/account/username", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { username } = await c.req.json();

    if (!username) {
      return c.json({ error: "Username is required" }, 400);
    }

    const oldUsername = await kv.get(`user:${user.id}:username`);

    // Check if new username is already taken
    const existingUsername = await kv.get(`username:${username}`);
    if (existingUsername && existingUsername.userId !== user.id) {
      return c.json({ error: "Username already taken" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Update user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { username } }
    );

    if (updateError) {
      return c.json({ error: updateError.message }, 400);
    }

    // Update username mappings
    if (oldUsername) {
      await kv.del(`username:${oldUsername}`);
    }
    await kv.set(`username:${username}`, { userId: user.id });
    await kv.set(`user:${user.id}:username`, username);

    // Update username in all itineraries where user is owner
    const userItineraries = await kv.getByPrefix(`user:${user.id}:itinerary:`);
    for (const item of userItineraries) {
      const itinerary = await kv.get(`itinerary:${item.id}`);
      if (itinerary && itinerary.ownerId === user.id) {
        itinerary.ownerUsername = username;
        await kv.set(`itinerary:${item.id}`, itinerary);
      }
    }

    return c.json({ success: true, username });
  } catch (error) {
    console.log(`Update username error: ${error}`);
    return c.json({ error: "Failed to update username" }, 500);
  }
});

app.put("/make-server-9b7ec865/account/email", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const oldEmail = user.email;
    const username = await kv.get(`user:${user.id}:username`) || user.user_metadata?.username || 'user';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Update user email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email, email_confirm: true }
    );

    if (updateError) {
      return c.json({ error: updateError.message }, 400);
    }

    // Send notification to old email
    if (oldEmail) {
      await sendEmail(
        oldEmail,
        'Email Address Changed - WhereTwo',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #276fbf;">Email Address Changed</h1>
            <p>Hi <strong>@${username}</strong>,</p>
            <p>Your WhereTwo account email has been changed from <strong>${oldEmail}</strong> to <strong>${email}</strong>.</p>
            <p>If you did not make this change, please contact support immediately.</p>
            <div style="margin: 30px 0; padding: 15px; background: #f6f4f3; border-left: 4px solid #276fbf;">
              <strong>Previous email:</strong> ${oldEmail}<br>
              <strong>New email:</strong> ${email}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 40px;">
              This is an automated email from WhereTwo. Please do not reply to this email.
            </p>
          </div>
        `
      );
    }

    // Send notification to new email
    await sendEmail(
      email,
      'Email Address Updated - WhereTwo',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #276fbf;">Email Address Updated</h1>
          <p>Hi <strong>@${username}</strong>,</p>
          <p>Your WhereTwo account email has been successfully updated to <strong>${email}</strong>.</p>
          <p>You will now use this email address to sign in to your account.</p>
          <div style="margin: 30px 0; padding: 15px; background: #f6f4f3; border-left: 4px solid #276fbf;">
            <strong>Account username:</strong> @${username}<br>
            <strong>New email:</strong> ${email}
          </div>
          <p>If you did not make this change, please contact support immediately.</p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            This is an automated email from WhereTwo. Please do not reply to this email.
          </p>
        </div>
      `
    );

    return c.json({ success: true, email });
  } catch (error) {
    console.log(`Update email error: ${error}`);
    return c.json({ error: "Failed to update email" }, 500);
  }
});

app.delete("/make-server-9b7ec865/account", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const username = await kv.get(`user:${user.id}:username`);

    // Get all itineraries where user is owner or collaborator
    const userItineraries = await kv.getByPrefix(`user:${user.id}:itinerary:`);
    const itineraryIds = userItineraries.map((item: any) => item.id);

    // Delete all owned itineraries and remove from collaborated ones
    for (const itineraryId of itineraryIds) {
      const itinerary = await kv.get(`itinerary:${itineraryId}`);
      if (!itinerary) continue;

      if (itinerary.ownerId === user.id) {
        // Delete itinerary owned by this user
        await kv.del(`itinerary:${itineraryId}`);

        // Delete references for all collaborators
        for (const collab of itinerary.collaborators) {
          await kv.del(`user:${collab.userId}:itinerary:${itineraryId}`);
        }
      } else {
        // Remove user as collaborator from others' itineraries
        itinerary.collaborators = itinerary.collaborators.filter(
          (collab: any) => collab.userId !== user.id
        );
        await kv.set(`itinerary:${itineraryId}`, itinerary);
      }

      // Delete user's reference to this itinerary
      await kv.del(`user:${user.id}:itinerary:${itineraryId}`);
    }

    // Delete username mapping
    if (username) {
      await kv.del(`username:${username}`);
    }
    await kv.del(`user:${user.id}:username`);

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.log(`Failed to delete user from auth: ${deleteError.message}`);
      return c.json({ error: "Failed to delete account" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete account error: ${error}`);
    return c.json({ error: "Failed to delete account" }, 500);
  }
});

app.post("/make-server-9b7ec865/itineraries/:id/invite", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const itineraryId = c.req.param('id');
    const { username } = await c.req.json();

    if (!username) {
      return c.json({ error: "Username is required" }, 400);
    }

    const itinerary = await kv.get(`itinerary:${itineraryId}`);

    if (!itinerary) {
      return c.json({ error: "Itinerary not found" }, 404);
    }

    if (itinerary.ownerId !== user.id) {
      return c.json({ error: "Only the owner can invite collaborators" }, 403);
    }

    const usernameData = await kv.get(`username:${username}`);
    if (!usernameData) {
      return c.json({ error: "Username not found" }, 404);
    }

    const invitedUserId = usernameData.userId;

    if (invitedUserId === user.id) {
      return c.json({ error: "You cannot invite yourself" }, 400);
    }

    const alreadyCollaborator = itinerary.collaborators.some(
      (collab: any) => collab.userId === invitedUserId
    );

    if (alreadyCollaborator) {
      return c.json({ error: "User is already a collaborator" }, 400);
    }

    const collaborator = {
      userId: invitedUserId,
      username,
      addedAt: new Date().toISOString(),
    };

    itinerary.collaborators.push(collaborator);
    itinerary.updatedAt = new Date().toISOString();

    await kv.set(`itinerary:${itineraryId}`, itinerary);
    await kv.set(`user:${invitedUserId}:itinerary:${itineraryId}`, { id: itineraryId });

    // Get invited user's email and send notification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: invitedUserData } = await supabase.auth.admin.getUserById(invitedUserId);
    const ownerUsername = await kv.get(`user:${user.id}:username`) || user.user_metadata?.username || 'Someone';

    if (invitedUserData?.user?.email) {
      await sendEmail(
        invitedUserData.user.email,
        `You've been invited to collaborate on a trip!`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #276fbf;">New Collaboration Invitation</h1>
            <p>Hi <strong>@${username}</strong>,</p>
            <p><strong>@${ownerUsername}</strong> has invited you to collaborate on their trip:</p>
            <div style="background: #f6f4f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #183059; margin-top: 0;">${itinerary.title}</h2>
              <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${itinerary.location}</p>
              <p style="margin: 10px 0;"><strong>📅 Duration:</strong> ${itinerary.days} days</p>
              ${itinerary.base ? `<p style="margin: 10px 0;"><strong>🏨 Base:</strong> ${itinerary.base}</p>` : ''}
            </div>
            <p>You can now view and edit this itinerary. Log in to WhereTwo to start collaborating!</p>
            <p>Happy planning!</p>
            <p style="color: #666; font-size: 12px; margin-top: 40px;">
              This is an automated email from WhereTwo. Please do not reply to this email.
            </p>
          </div>
        `
      );
    }

    return c.json({ itinerary, collaborator });
  } catch (error) {
    console.log(`Invite collaborator error: ${error}`);
    return c.json({ error: "Failed to invite collaborator" }, 500);
  }
});

app.post("/make-server-9b7ec865/itineraries/:id/generate", async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const itineraryId = c.req.param('id');
    const itinerary = await kv.get(`itinerary:${itineraryId}`);

    if (!itinerary) {
      return c.json({ error: "Itinerary not found" }, 404);
    }

    const isOwner = itinerary.ownerId === user.id;
    const isCollaborator = itinerary.collaborators.some((collab: any) => collab.userId === user.id);

    if (!isOwner && !isCollaborator) {
      return c.json({ error: "Access denied" }, 403);
    }

    const plan = await generateOptimalPlan(
      itinerary.location,
      itinerary.area,
      itinerary.base,
      itinerary.days,
      itinerary.interests || [],
      itinerary.travelStyle || 'balanced',
      itinerary.pace || 'moderate'
    );

    itinerary.plan = plan;
    itinerary.updatedAt = new Date().toISOString();

    await kv.set(`itinerary:${itineraryId}`, itinerary);

    return c.json({ itinerary });
  } catch (error) {
    console.log(`Generate plan error: ${error}`);
    return c.json({ error: "Failed to generate plan" }, 500);
  }
});

async function generateOptimalPlan(
  location: string,
  area: string,
  base: string,
  days: number,
  interests: string[] = [],
  travelStyle: string = 'balanced',
  pace: string = 'moderate'
) {
  console.log('=== START generateOptimalPlan ===');
  console.log(`Location: ${location}, Base: ${base}, Days: ${days}`);
  console.log(`Interests: ${interests.join(', ')}, Style: ${travelStyle}, Pace: ${pace}`);

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    console.log(`API Key exists: ${!!apiKey}`);
    console.log(`API Key length: ${apiKey?.length || 0}`);

    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY not found, using fallback plan generation');
      return generateFallbackPlan(location, area, days, interests, travelStyle, pace);
    }

    // Build personalization context
    const interestLabels: Record<string, string> = {
      'food': 'Food & Dining experiences',
      'museums': 'Museums & Art galleries',
      'history': 'Historical landmarks and cultural heritage',
      'nature': 'Nature, parks, and outdoor activities',
      'shopping': 'Shopping and local markets',
      'nightlife': 'Nightlife and entertainment',
      'adventure': 'Adventure and thrilling activities',
      'relaxation': 'Relaxation and wellness',
      'photography': 'Photography and scenic spots',
      'local': 'Local culture and authentic experiences'
    };

    const interestContext = interests.length > 0
      ? `\nTRAVELER INTERESTS: This traveler is particularly interested in ${interests.map(i => interestLabels[i] || i).join(', ')}. PRIORITIZE activities in these categories and ensure at least ${Math.min(interests.length, days)} activities per day align with these interests.`
      : '';

    const styleContext = {
      'budget': '\nTRAVEL STYLE: Budget-conscious traveler. Focus on FREE and low-cost activities (under $20). Include street food, free museums, public parks, walking tours, and affordable local experiences. Mention free days/times for paid attractions.',
      'balanced': '\nTRAVEL STYLE: Balanced budget. Mix of free activities and paid experiences ($20-$80 range). Include a variety of price points with emphasis on good value.',
      'luxury': '\nTRAVEL STYLE: Luxury traveler. Prioritize premium experiences, fine dining (Michelin-starred or highly-rated restaurants), exclusive tours, high-end shopping, and upscale accommodations. Price is not a primary concern.',
      'family': '\nTRAVEL STYLE: Family-friendly. All activities must be suitable for children. Include playgrounds, interactive museums, kid-friendly restaurants, and shorter activity durations. Avoid late-night venues and mention family facilities (restrooms, stroller access).'
    }[travelStyle] || '';

    const paceContext = {
      'relaxed': `\nPACE: Relaxed pace. Plan ONLY 1-2 major activities per day with LOTS of downtime. Include longer meal times, coffee breaks, and time to simply enjoy the atmosphere. Each activity should have 3-4 hours allocated. Leave afternoon/evening open for spontaneous exploration.`,
      'moderate': `\nPACE: Moderate pace. Plan 3 activities per day (morning, afternoon, evening) with reasonable breaks between. Balance sightseeing with meals and rest. This is a comfortable pace that doesn't feel rushed.`,
      'packed': `\nPACE: Packed schedule. Plan 4-5 activities per day to maximize sightseeing. Back-to-back experiences with minimal downtime. Quick meals between attractions. This traveler wants to see and do as much as possible.`
    }[pace] || '';

    const prompt = `Create a HIGHLY DETAILED ${days}-day travel itinerary for ${location}${area ? ` in the ${area} area` : ''}.
${interestContext}${styleContext}${paceContext}

CRITICAL RULES:
- The traveler is staying in the ${base} neighborhood. All activities must be optimized around this base location.
- NO DUPLICATE VENUES - Each location should appear only ONCE across all ${days} days
- NO REPEATED ACTIVITIES - Provide ${days * 3} completely unique experiences

MANDATORY REQUIREMENTS FOR EACH ACTIVITY:

1. **EXACT VENUE NAMES & ADDRESSES**
   ✅ CORRECT: "Tokyo National Museum (13-9 Ueno Park, Taito City, Tokyo 110-8712)"
   ❌ WRONG: "Visit a museum in Ueno"

2. **PRECISE WALKING/TRANSIT INFO**
   - Walking time from previous location OR from ${base}
   - Include station names if using metro
   ✅ CORRECT: "8-minute walk from Meiji Shrine, or take Yamanote Line from Harajuku to Shibuya (2 min, ¥140)"
   ❌ WRONG: "Nearby" or "Close by"

3. **COMPLETE TIMING DETAILS**
   - Opening hours (exact times: "9:00 AM - 6:00 PM")
   - Entry fees with currency (e.g., "¥1,000 entry" or "Free admission")
   - Best time to visit to avoid crowds
   ✅ CORRECT: "Opens 9:30 AM, ¥1,000 entry. Arrive by 10 AM before tour groups (11 AM-2 PM peak)."
   ❌ WRONG: "Opens in the morning"

4. **LOGICAL GEOGRAPHIC CLUSTERING**
   - Day 1 activities should all be in the same area/neighborhood
   - Minimize backtracking - plan routes in a circle or line, not zigzag
   - Group morning → afternoon → evening by proximity

5. **PRACTICAL TRAVEL DETAILS**
   - Reservation requirements ("Book 2 days ahead" or "Walk-ins welcome")
   - Special notes (closes Mondays, cash only, etc.)
   - Why it's recommended (historical significance, local favorite, Instagram-worthy, etc.)

EXAMPLE FORMAT (FOLLOW THIS EXACTLY):

{
  "day": 1,
  "activities": [
    {
      "timeSlot": "Morning",
      "type": "Sightseeing",
      "title": "Tokyo National Museum",
      "description": "Japan's oldest and largest museum at 13-9 Ueno Park, Taito City. Opens 9:30 AM, ¥1,000 entry. Features 110,000+ artworks including samurai armor and ukiyo-e prints. 15-minute walk from Ueno Station (Yamanote Line). Best visited early (9:30-11 AM) before tour groups arrive. Plan 2-3 hours to see main galleries. Worth it for authentic Japanese art history.",
      "duration": "2-3 hours"
    },
    {
      "timeSlot": "Afternoon",
      "type": "Dining",
      "title": "Ichiran Ramen Shibuya (1-22-7 Jinnan, Shibuya City)",
      "description": "Famous tonkotsu ramen chain with solo dining booths. 12-minute walk from Meiji Shrine via Omotesando Ave. Open 24 hours, ¥890-¥1,290 per bowl. No reservation needed but expect 15-30 min wait during lunch (12-2 PM). Order via vending machine, customizable spice/richness levels. Cash and credit accepted. Local favorite for authentic Hakata-style ramen.",
      "duration": "45 min - 1 hour"
    },
    {
      "timeSlot": "Evening",
      "type": "Shopping",
      "title": "Shibuya 109 (2-29-1 Dogenzaka, Shibuya)",
      "description": "Iconic 10-floor fashion mall for trendy clothing and accessories. 6-minute walk from Ichiran (straight up Dogenzaka). Open 10 AM - 9 PM, closes 10 PM on weekends. Free entry, shops range ¥1,000-¥10,000. Best after 6 PM when work crowds thin out. Top floor has panoramic city views. Quintessential Tokyo youth culture spot.",
      "duration": "1.5-2 hours"
    }
  ]
}

IMPORTANT RULES:
- Use real place names from ${location} with actual addresses
- Include specific prices in local currency
- Provide exact walking times between locations
- Mention transport options (metro lines, stations, costs)
- Note opening hours in 24-hour or AM/PM format
- Explain WHY each place is worth visiting
- Keep activities within 30 minutes of ${base} when possible

**CRITICAL JSON FORMATTING:**
- Return ONLY a valid JSON array - no markdown, no code blocks, no extra text
- All quotes in descriptions MUST be straight quotes ("), not curly quotes ("")
- Any quotes within text must be escaped properly or use single quotes
- Descriptions should be plain text without any special formatting
- Do not include line breaks within string values
- Ensure all property names and string values use proper JSON syntax

Return the JSON array now:`;

    console.log('📞 Calling Gemini API for itinerary generation...');
    console.log(`Prompt length: ${prompt.length} characters`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16000,
        }
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Gemini API error (${response.status}): ${errorText}`);
      console.log('❌ USING FALLBACK PLAN - API call failed');
      return generateFallbackPlan(location, area, days, interests, travelStyle, pace);
    }

    const data = await response.json();
    console.log('✅ Gemini API response received successfully');
    console.log('Response structure:', JSON.stringify(Object.keys(data)));

    if (!data.candidates || !data.candidates[0]) {
      console.log('❌ No candidates in response:', JSON.stringify(data));
      console.log('❌ USING FALLBACK PLAN - Invalid response structure');
      return generateFallbackPlan(location, area, days, interests, travelStyle, pace);
    }

    let content = data.candidates[0].content.parts[0].text;
    console.log('AI Response length:', content.length);
    console.log('AI Response preview:', content.substring(0, 500));

    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    console.log('🔍 Looking for JSON in response...');
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.log('❌ Failed to parse Gemini response - no JSON array found');
      console.log('Full response:', content);
      console.log('❌ USING FALLBACK PLAN - JSON parsing failed');
      return generateFallbackPlan(location, area, days, interests, travelStyle, pace);
    }

    console.log('✅ Found JSON array, length:', jsonMatch[0].length);
    console.log('✅ Parsing JSON...');

    let aiPlan;
    try {
      // Clean up common JSON issues
      let jsonString = jsonMatch[0];

      // Replace curly quotes with straight quotes
      jsonString = jsonString
        .replace(/[\u201C\u201D]/g, '"')  // curly double quotes
        .replace(/[\u2018\u2019]/g, "'")  // curly single quotes
        .replace(/\u2026/g, '...')         // ellipsis
        .replace(/[\u2013\u2014]/g, '-');  // en/em dashes

      // Log a snippet around the error position if it fails
      console.log('JSON preview (first 500 chars):', jsonString.substring(0, 500));
      console.log('JSON preview (last 500 chars):', jsonString.substring(jsonString.length - 500));

      aiPlan = JSON.parse(jsonString);
      console.log(`✅ Successfully parsed JSON with ${aiPlan.length} days`);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError);

      // Try to show the problematic area
      const errorMatch = parseError.message.match(/position (\d+)/);
      if (errorMatch) {
        const position = parseInt(errorMatch[1]);
        const start = Math.max(0, position - 100);
        const end = Math.min(jsonMatch[0].length, position + 100);
        console.log('❌ Problematic JSON area:', jsonMatch[0].substring(start, end));
        console.log('❌ Error at position:', position, 'Character:', jsonMatch[0][position]);
      }

      console.log('❌ USING FALLBACK PLAN - JSON parse exception');
      return generateFallbackPlan(location, area, days, interests, travelStyle, pace);
    }

    // Remove duplicate activities based on title
    const seenTitles = new Set<string>();
    const deduplicatedPlan = aiPlan.map((day: any) => ({
      day: day.day,
      date: new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      activities: day.activities.filter((activity: any) => {
        const normalizedTitle = activity.title.toLowerCase().trim();
        if (seenTitles.has(normalizedTitle)) {
          console.log(`Removing duplicate activity: ${activity.title}`);
          return false;
        }
        seenTitles.add(normalizedTitle);
        return true;
      }).map((activity: any) => ({
        id: crypto.randomUUID(),
        timeSlot: activity.timeSlot,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        duration: activity.duration,
        notes: '',
      })),
    }));

    const totalActivities = deduplicatedPlan.reduce((sum: number, day: any) => sum + day.activities.length, 0);
    console.log(`✅ Generated ${totalActivities} unique activities across ${days} days`);
    console.log('Sample activity from Day 1:', deduplicatedPlan[0]?.activities[0]?.title);
    console.log('=== END generateOptimalPlan (SUCCESS) ===');

    return deduplicatedPlan;

  } catch (error) {
    console.log(`❌ Gemini API generation error: ${error}`);
    console.log(`Error stack: ${error.stack}`);
    console.log('❌ USING FALLBACK PLAN - Exception caught');
    console.log('=== END generateOptimalPlan (FALLBACK) ===');
    return generateFallbackPlan(location, area, days);
  }
}

function generateFallbackPlan(
  location: string,
  area: string,
  days: number,
  interests: string[] = [],
  travelStyle: string = 'balanced',
  pace: string = 'moderate'
) {
  console.log('🔴 FALLBACK PLAN ACTIVATED');
  console.log(`Generating generic plan for ${location}, ${days} days`);
  console.log(`Preferences: ${interests.join(', ')}, ${travelStyle}, ${pace}`);

  const timeSlots = ['Morning', 'Afternoon', 'Evening'];
  const activityTypes = ['Sightseeing', 'Dining', 'Outdoor Activities', 'Museums', 'Shopping', 'Relaxation', 'Local Culture'];

  const plan = [];

  for (let day = 1; day <= days; day++) {
    const dayPlan = {
      day,
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      activities: [] as any[],
    };

    for (const timeSlot of timeSlots) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const activity = {
        id: crypto.randomUUID(),
        timeSlot,
        type: activityType,
        title: `${activityType} in ${area || location}`,
        description: `Explore ${activityType.toLowerCase()} activities in the ${area || location} area`,
        duration: '2-3 hours',
        notes: '',
      };

      dayPlan.activities.push(activity);
    }

    plan.push(dayPlan);
  }

  return plan;
}

Deno.serve(app.fetch);