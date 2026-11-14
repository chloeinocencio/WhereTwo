import Foundation

enum Config {
    // Same Supabase project as the web app. The anon key is a public client key (it's also
    // in utils/supabase/info.tsx); the Gemini and service-role keys stay on the server.
    static let supabaseProjectId = "ohgumjbsjbcbbtbwpnfz"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZ3VtamJzamJjYmJ0YndwbmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTU0OTMsImV4cCI6MjA5Mjc5MTQ5M30.MqJJAT0HtE_IqfGurtvwhMwIDMWUIp_bTGGad-x4B5I"

    static let supabaseURL = URL(string: "https://\(supabaseProjectId).supabase.co")!
    static let apiBase = supabaseURL.appendingPathComponent("functions/v1/make-server-9b7ec865")

    /// Served by the web app on GitHub Pages (public/privacy.html). App Store Connect needs this URL too.
    static let privacyPolicyURL = URL(string: "https://chloeinocencio.github.io/WhereTwo/privacy.html")!
    static let supportEmail = "chloeinocencio.contact@gmail.com"
}
