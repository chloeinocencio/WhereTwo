import SwiftUI

/// Brand colors, matching the web app's trip page. Defined in code so the widget
/// extension can use them too.
enum Theme {
    static let navy = Color(red: 0x18 / 255, green: 0x30 / 255, blue: 0x59 / 255)
    static let blue = Color(red: 0x0B / 255, green: 0x6B / 255, blue: 0xCB / 255)
    static let sky = Color(red: 0x5B / 255, green: 0x9B / 255, blue: 0xE0 / 255)
    static let cream = Color(red: 0xF6 / 255, green: 0xF4 / 255, blue: 0xF3 / 255)

    // The app icon's gradient: deep navy at the top into periwinkle.
    static let iconTop = Color(red: 0x00 / 255, green: 0x1F / 255, blue: 0x65 / 255)
    static let iconMid = Color(red: 0x1F / 255, green: 0x3F / 255, blue: 0x97 / 255)
    static let iconBottom = Color(red: 0x68 / 255, green: 0x95 / 255, blue: 0xFD / 255)

    /// Text and selected states on the trip page.
    static let ink = Color(red: 0x1B / 255, green: 0x1F / 255, blue: 0x27 / 255)
    /// Secondary text on the trip page.
    static let slate = Color(red: 0x5F / 255, green: 0x67 / 255, blue: 0x76 / 255)
    /// Route lines and tile outlines.
    static let mist = Color(red: 0xE3 / 255, green: 0xE6 / 255, blue: 0xEB / 255)
    /// "Today" marker.
    static let today = Color(red: 0x0B / 255, green: 0x6B / 255, blue: 0xCB / 255)

    static let headerGradient = LinearGradient(
        colors: [iconTop, iconMid, iconBottom],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Rounded display type for titles and day numbers.
    static func display(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
    }
}
