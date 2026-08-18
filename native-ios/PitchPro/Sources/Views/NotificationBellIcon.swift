import SwiftUI

/// Icône cloche + badge non-lus, affichée en haut à droite des écrans de liste
/// (voir AsyncListView) — équivalent du bell du header sur le site.
struct NotificationBellIcon: View {
    @State private var unread = 0

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Image(systemName: "bell")
                .font(.system(size: 17))
                .foregroundStyle(Color.primary)
            if unread > 0 {
                Text(unread > 9 ? "9+" : "\(unread)")
                    .font(.system(size: 9, weight: .black))
                    .foregroundStyle(Color.pitchGreen)
                    .padding(3)
                    .frame(minWidth: 16, minHeight: 16)
                    .background(Color.pitchVolt)
                    .clipShape(Circle())
                    .offset(x: 9, y: -9)
            }
        }
        .task { unread = (try? await NotificationsRepository.unreadCount()) ?? 0 }
    }
}
