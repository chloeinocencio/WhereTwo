import SwiftUI

/// Brand colors from the web app, defined in code so the widget extension can use them too.
enum Theme {
    static let navy = Color(red: 0x18 / 255, green: 0x30 / 255, blue: 0x59 / 255)
    static let blue = Color(red: 0x27 / 255, green: 0x6F / 255, blue: 0xBF / 255)
    static let sky = Color(red: 0x5B / 255, green: 0x9B / 255, blue: 0xE0 / 255)
    static let cream = Color(red: 0xF6 / 255, green: 0xF4 / 255, blue: 0xF3 / 255)

    // The app icon's gradient: deep navy at the top into periwinkle.
    static let iconTop = Color(red: 0x00 / 255, green: 0x1F / 255, blue: 0x65 / 255)
    static let iconBottom = Color(red: 0x68 / 255, green: 0x95 / 255, blue: 0xFD / 255)

    static let headerGradient = LinearGradient(
        colors: [iconTop, iconBottom],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
