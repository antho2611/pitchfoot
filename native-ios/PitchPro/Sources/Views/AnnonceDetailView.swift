import SwiftUI

struct AnnonceDetailView: View {
    let listingId: String
    @EnvironmentObject private var session: SessionStore

    @State private var listing: Listing?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var message = ""
    @State private var sending = false
    @State private var sent = false
    @State private var sendError: String?

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if let errorMessage {
                Text(errorMessage).foregroundStyle(.secondary).padding(.top, 60)
            } else if let listing {
                content(for: listing)
                    .frame(maxWidth: 700)
                    .frame(maxWidth: .infinity)
            }
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    @ViewBuilder
    private func content(for listing: Listing) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(listing.title.uppercased())
                .font(.pitchDisplay(36))

            let subtitle = [listing.level, listing.championship, listing.city].compactMap { $0 }.joined(separator: " · ")
            if !subtitle.isEmpty {
                LabelXS(text: subtitle)
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                infoBox("Poste", listing.position ?? "—")
                infoBox("Âge", "\(listing.minAge.map(String.init) ?? "—") - \(listing.maxAge.map(String.init) ?? "—")")
                infoBox("Saison", listing.season ?? "—")
                infoBox("Statut", listing.isOpen ? "Ouverte" : "Fermée")
            }

            Text(listing.description?.isEmpty == false ? listing.description! : "Aucune description fournie.")
                .font(.body)
                .foregroundStyle(.secondary)

            if listing.isOpen {
                VStack(alignment: .leading, spacing: 10) {
                    Text("POSTULER").font(.pitchDisplay(28))

                    if sent {
                        Text("Votre candidature a bien été transmise au club.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    } else {
                        TextEditor(text: $message)
                            .frame(height: 100)
                            .padding(6)
                            .overlay(RoundedRectangle(cornerRadius: 0).strokeBorder(Color.secondary.opacity(0.3)))
                            .overlay(alignment: .topLeading) {
                                if message.isEmpty {
                                    Text("Message de motivation (optionnel)")
                                        .foregroundStyle(.secondary)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 14)
                                        .allowsHitTesting(false)
                                }
                            }

                        if let sendError {
                            Text(sendError).font(.footnote).foregroundStyle(.red)
                        }

                        Button {
                            Task { await apply(listing: listing) }
                        } label: {
                            if sending {
                                ProgressView().tint(Color.pitchVolt)
                            } else {
                                Text("Envoyer ma candidature")
                            }
                        }
                        .buttonStyle(PitchButtonStyle())
                        .disabled(sending)
                    }
                }
                .padding()
                .overlay(Rectangle().strokeBorder(Color.pitchGreen.opacity(0.15)))
            }
        }
        .padding()
    }

    private func infoBox(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            LabelXS(text: label)
            Text(value.uppercased()).font(.pitchDisplay(18))
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(Rectangle().strokeBorder(Color.secondary.opacity(0.15)))
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            listing = try await ListingsRepository.fetchOne(id: listingId)
        } catch {
            errorMessage = "Annonce indisponible."
        }
        isLoading = false
    }

    private func apply(listing: Listing) async {
        guard let playerId = session.session?.user.id else { return }
        sending = true
        sendError = nil
        do {
            try await ApplicationsRepository.apply(
                listingId: listing.id,
                clubId: listing.clubId,
                playerId: playerId.uuidString,
                message: message
            )
            sent = true
        } catch {
            sendError = "Candidature impossible (déjà envoyée ?)."
        }
        sending = false
    }
}
