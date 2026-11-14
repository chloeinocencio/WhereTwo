import SwiftUI

/// Brand colors from the web app, defined in code so the widget extension can use them too.
enum Theme {
    static let navy = Color(red: 0x18 / 255, green: 0x30 / 255, blue: 0x59 / 255)
    static let blue = Color(red: 0x27 / 255, green: 0x6F / 255, blue: 0xBF / 255)
    static let sky = Color(red: 0x5B / 255, green: 0x9B / 255, blue: 0xE0 / 255)
    static let cream = Color(red: 0xF6 / 255, green: 0xF4 / 255, blue: 0xF3 / 255)

    static let headerGradient = LinearGradient(
        colors: [blue, navy],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
