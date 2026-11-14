# WhereTwo for iPhone

Native SwiftUI app for WhereTwo. It uses the **same Supabase backend** as the web app
(`supabase/functions/server`), so a trip planned on iPhone shows up on the web and vice versa.

## What's in v1

- Sign in / sign up (same accounts as the web app), account deletion, sign out
- Trip list, new trip form (destination, stay, dates, interests, style, pace)
- AI day-by-day plans from Gemini (generated server-side; no API key in the app)
- Day view with check-offs, directions in Apple Maps, and a numbered map of the day's stops
- Invite people by username; read-only flights added on the web
- **Offline:** trips, plans and map pins are cached on the device and open with no signal
- **Home Screen / Lock Screen widget:** today's next stops, or a countdown to the next trip
- **Live Activity:** today's plan on the Lock Screen and Dynamic Island, updated as you check things off

Check-offs are stored on the device only, so they don't sync to the people you travel with yet.

## First-time setup

1. **Install Xcode** from the Mac App Store and open it once so it installs its components.
2. **Install XcodeGen**, which builds the Xcode project from `project.yml`:
   ```sh
   brew install xcodegen
   ```
   (No Homebrew? Install it from https://brew.sh first.)
3. **Generate and open the project:**
   ```sh
   cd ios
   xcodegen generate
   open WhereTwo.xcodeproj
   ```
   Re-run `xcodegen generate` whenever files are added or `project.yml` changes.
4. **Set signing:** in Xcode, select the WhereTwo project → each target (WhereTwo and
   WhereTwoWidgets) → Signing & Capabilities → choose your Team. A free Apple ID works for
   running on your own iPhone; the App Store needs the paid Apple Developer Program.
   If Xcode says the App Group or bundle ID is taken, change the
   `com.chloeinocencio.wheretwo` prefix in `project.yml` and `Shared/SharedStore.swift`.
5. Pick an iPhone simulator or your phone and press **Run** (⌘R).

## Project layout

```
ios/
├── project.yml              XcodeGen spec (targets, capabilities, Info.plist keys)
├── Shared/                  Compiled into both the app and the widget extension
│   ├── Models.swift         Trip/plan models matching the edge function's JSON
│   ├── SharedStore.swift    App Group cache (offline trips, check-offs, map pins)
│   ├── TripActivityAttributes.swift   Live Activity data
│   └── Theme.swift          Brand colors
├── WhereTwo/                The app
│   ├── App/                 Entry point, root navigation, config
│   ├── Services/            Auth, API client, trip store, Live Activity, place lookup
│   ├── Features/            Auth, trip list, new trip, trip detail, settings
│   └── Assets.xcassets      App icon, colors, wordmark
└── WhereTwoWidgets/         Today widget + Live Activity UI
```

## Before submitting to the App Store

- **Privacy policy URL:** `https://chloeinocencio.github.io/WhereTwo/privacy.html`
  (the page is in `public/privacy.html`; it goes live the next time you run `npm run deploy`).
- **App Privacy answers** in App Store Connect: Email Address, User ID and Other User Content,
  all linked to the user, used for App Functionality, not used for tracking.
  `WhereTwo/PrivacyInfo.xcprivacy` declares the same.
- **Demo account for App Review:** create a test account with a trip that already has a plan,
  and put its email/password in App Review Information.
- **App icon:** `Assets.xcassets/AppIcon.appiconset/AppIcon.png` is a placeholder built from
  the logo; swap in a final 1024×1024 PNG (no transparency).
- **Invite emails:** the server sends from Resend's sandbox address, which only delivers to
  the Resend account owner. Verify a domain in Resend and update `sendEmail` in the edge
  function before launch, or people won't be emailed when they're invited.
