import SwiftUI

/// Brand colors, matching the web app's trip page. Defined in code so the widget
/// extension can use them too.
enum Theme {
    static let navy = Color(red: 0x18 / 255, green: 0x30 / 255, blue: 0x59 / 255)
    static let blue = Color(red: 0x27 / 255, green: 0x6F / 255, blue: 0xBF / 255)
    static let sky = Color(red: 0x5B / 255, green: 0x9B / 255, blue: 0xE0 / 255)
    static let cream = Color(red: 0xF6 / 255, green: 0xF4 / 255, blue: 0xF3 / 255)

    // The app icon's gradient: deep navy at the top into periwinkle.
    static let iconTop = Color(red: 0x00 / 255, green: 0x1F / 255, blue: 0x65 / 255)
    static let iconMid = Color(red: 0x1F / 255, green: 0x3F / 255, blue: 0x97 / 255)
    static let iconBottom = Color(red: 0x68 / 255, green: 0x95 / 255, blue: 0xFD / 255)

    /// Text and selected states on the trip page.
    static let ink = Color(red: 0x0E / 255, green: 0x1F / 255, blue: 0x4D / 255)
    /// Secondary text on the trip page.
    static let slate = Color(red: 0x5B / 255, green: 0x6B / 255, blue: 0x8C / 255)
    /// Route lines and tile outlines.
    static let mist = Color(red: 0xDD / 255, green: 0xE4 / 255, blue: 0xF3 / 255)
    /// "Today" marker.
    static let today = Color(red: 0xF5 / 255, green: 0xA5 / 255, blue: 0x24 / 255)

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

extension PlanItem.Kind {
    var tint: Color {
        switch self {
        case .sightseeing: return Color(red: 0x3D / 255, green: 0x63 / 255, blue: 0xDD / 255)
        case .dining: return Color(red: 0xD9 / 255, green: 0x67 / 255, blue: 0x2E / 255)
        case .shopping: return Color(red: 0x8E / 255, green: 0x54 / 255, blue: 0xD6 / 255)
        case .culture: return Color(red: 0xC2 / 255, green: 0x47 / 255, blue: 0x7E / 255)
        case .nature: return Color(red: 0x24 / 255, green: 0x93 / 255, blue: 0x6A / 255)
        case .entertainment: return Color(red: 0x6A / 255, green: 0x4C / 255, blue: 0xC9 / 255)
        case .relaxation: return Color(red: 0x23 / 255, green: 0x92 / 255, blue: 0x9C / 255)
        case .other: return Theme.slate
        }
    }
}
