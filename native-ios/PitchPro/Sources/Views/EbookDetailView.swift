import SwiftUI

struct EbookDetailView: View {
    let ebook: Ebook
    @EnvironmentObject private var session: SessionStore

    @State private var owned = false
    @State private var checkingOwnership = true
    @State private var unlocking = false
    @State private var unlockError: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                AsyncImage(url: ebook.coverURL.flatMap(URL.init)) { image in
                    image.resizable().scaledToFit()
                } placeholder: {
                    Color.secondary.opacity(0.1)
                }
                .frame(height: 220)
                .frame(maxWidth: .infinity)
                .background(Color.secondary.opacity(0.05))

                VStack(alignment: .leading, spacing: 16) {
                    LabelXS(text: ebook.category, color: Color.pitchGreen)
                    Text(ebook.title.uppercased()).font(.pitchDisplay(32))
                    Text(ebook.priceLabel)
                        .font(.pitchDisplay(22))
                        .foregroundStyle(Color.pitchGreen)

                    Text(ebook.summary).font(.body).foregroundStyle(.secondary)

                    if let preview = ebook.previewText, !preview.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("APERÇU").font(.pitchDisplay(18))
                            Text(preview).font(.callout).foregroundStyle(.secondary)
                        }
                    }

                    unlockSection
                }
                .padding()
            }
        }
        .frame(maxWidth: 700)
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await checkOwnership() }
    }

    @ViewBuilder
    private var unlockSection: some View {
        if checkingOwnership {
            ProgressView()
        } else if owned {
            VStack(alignment: .leading, spacing: 10) {
                Text("Ce guide est dans votre bibliothèque.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if let contentURL = ebook.contentURL, let url = URL(string: contentURL) {
                    Link(destination: url) {
                        Text("Télécharger")
                    }
                    .buttonStyle(PitchButtonStyle())
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 8) {
                if let unlockError {
                    Text(unlockError).font(.footnote).foregroundStyle(.red)
                }
                Button {
                    Task { await unlock() }
                } label: {
                    if unlocking {
                        ProgressView().tint(Color.pitchVolt)
                    } else {
                        Text(ebook.isFree ? "Ajouter à ma bibliothèque" : "Débloquer ce guide")
                    }
                }
                .buttonStyle(PitchButtonStyle())
                .disabled(unlocking)
            }
        }
    }

    private func checkOwnership() async {
        checkingOwnership = true
        if let userId = session.session?.user.id {
            owned = (try? await EbookPurchasesRepository.isOwned(
                ebookId: ebook.id,
                userId: userId.uuidString
            )) ?? false
        }
        checkingOwnership = false
    }

    private func unlock() async {
        guard let userId = session.session?.user.id else { return }
        unlocking = true
        unlockError = nil
        do {
            try await EbookPurchasesRepository.unlock(
                ebookId: ebook.id,
                userId: userId.uuidString,
                amountCents: ebook.priceCents
            )
            owned = true
        } catch {
            unlockError = "Déblocage impossible pour le moment."
        }
        unlocking = false
    }
}
