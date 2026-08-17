import SwiftUI

struct RootView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        Group {
            if session.isLoading {
                ProgressView()
            } else if session.isSignedIn {
                MainTabView()
            } else {
                AuthView()
            }
        }
    }
}
