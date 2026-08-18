import SwiftUI

/// Équivalent de src/routes/premium.tsx.
struct PremiumView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var accountType: String?
    @State private var subscription: Subscription?
    @State private var isLoading = true
    @State private var busyPlanId: String?

    private var myId: String? { session.session?.user.id.uuidString }
    private var myPlanId: String { PremiumPlans.forAccountType(accountType) }
    private var isPremium: Bool { subscription?.isActive ?? false }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("PREMIUM").font(.pitchDisplay(40)).padding(.horizontal).padding(.top, 8)
                Text("Visibilité accrue pour les joueurs, filtres avancés, recherches illimitées et export des profils pour les clubs.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)

                if isPremium {
                    Text("VOTRE COMPTE EST PREMIUM")
                        .font(.system(size: 13, weight: .black))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.pitchVolt)
                        .foregroundStyle(Color.pitchGreen)
                        .padding(.horizontal)
                } else if subscription?.status == "pending" {
                    Text("Votre demande est enregistrée. Elle sera activée dès la mise en ligne du paiement en ligne.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .padding(12)
                        .overlay(Rectangle().strokeBorder(Color.pitchGreen.opacity(0.2)))
                        .padding(.horizontal)
                }

                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else {
                    VStack(spacing: 12) {
                        ForEach(PremiumPlans.all, id: \.id) { plan in
                            planCard(plan)
                        }
                    }
                    .padding(.horizontal)
                }

                Text("Le paiement en ligne sera activé prochainement. En attendant, votre demande est enregistrée et notre équipe active votre accès manuellement.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
            }
            .padding(.bottom, 24)
        }
        .frame(maxWidth: 700)
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    @ViewBuilder
    private func planCard(_ plan: PremiumPlan) -> some View {
        let mine = plan.id == myPlanId
        VStack(alignment: .leading, spacing: 10) {
            LabelXS(text: audienceLabel(plan.audience))
            Text(plan.name.uppercased()).font(.pitchDisplay(22))
            Text(plan.priceLabel).font(.pitchDisplay(26))

            VStack(alignment: .leading, spacing: 6) {
                ForEach(plan.features, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Color.pitchGreen)
                        Text(feature).font(.footnote)
                    }
                }
            }

            if isPremium && mine {
                Button {
                    Task { await cancel() }
                } label: {
                    if busyPlanId == "cancel" {
                        ProgressView().tint(Color.pitchGreen)
                    } else {
                        Text("Annuler l'abonnement")
                    }
                }
                .buttonStyle(PitchButtonStyle(filled: false))
                .disabled(busyPlanId != nil)
            } else {
                Button {
                    Task { await choose(plan) }
                } label: {
                    if busyPlanId == plan.id {
                        ProgressView().tint(Color.pitchVolt)
                    } else if myId == nil {
                        Text("Se connecter")
                    } else if !mine {
                        Text("Réservé aux \(audienceLabel(plan.audience).lowercased())")
                    } else {
                        Text("Choisir ce plan")
                    }
                }
                .buttonStyle(PitchButtonStyle())
                .disabled(busyPlanId != nil || (myId != nil && !mine))
            }
        }
        .padding(16)
        .overlay(
            Rectangle().strokeBorder(mine ? Color.pitchGreen : Color.secondary.opacity(0.15), lineWidth: mine ? 2 : 1)
        )
    }

    private func audienceLabel(_ audience: String) -> String {
        switch audience {
        case "player": return "Pour les joueurs"
        case "club": return "Pour les clubs"
        default: return "Pour les préparateurs"
        }
    }

    private func choose(_ plan: PremiumPlan) async {
        guard let myId, plan.id == myPlanId else { return }
        busyPlanId = plan.id
        try? await SubscriptionRepository.upsert(userId: myId, planId: plan.id, amountCents: plan.amountCents)
        await load()
        busyPlanId = nil
    }

    private func cancel() async {
        guard let myId else { return }
        busyPlanId = "cancel"
        try? await SubscriptionRepository.cancel(userId: myId)
        await load()
        busyPlanId = nil
    }

    private func load() async {
        isLoading = true
        if let myId {
            async let profileTask = ProfileRepository.fetchMine(userId: myId)
            async let subTask = SubscriptionRepository.fetchMine(userId: myId)
            accountType = (try? await profileTask)?.accountType
            subscription = try? await subTask
        }
        isLoading = false
    }
}
