import SwiftUI
import WidgetKit

@main
struct WhereTwoWidgetsBundle: WidgetBundle {
    var body: some Widget {
        TodayWidget()
        TripLiveActivity()
    }
}
