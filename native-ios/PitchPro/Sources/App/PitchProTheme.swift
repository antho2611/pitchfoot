import SwiftUI

/// Traduction native des tokens du site web (src/styles.css) : Bebas Neue pour
/// les titres, coins nets, cartes bordées plutôt que le style "iOS par défaut".
extension Font {
    /// Titre display façon site (font-display uppercase). Le texte doit être
    /// mis en majuscules par l'appelant (Bebas Neue n'a pas de bas de casse distinctif).
    static func pitchDisplay(_ size: CGFloat) -> Font {
        .custom("BebasNeue-Regular", size: size)
    }
}

/// Étiquette façon "label-xs" du site : petite, grasse, majuscules, espacée.
struct LabelXS: View {
    let text: String
    var color: Color = .secondary

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 10, weight: .bold))
            .tracking(1.2)
            .foregroundStyle(color)
    }
}

/// Carte bordée à coins nets — équivalent de `border border-pitch/5 bg-card p-4` sur le web.
struct PitchCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground))
            .overlay(
                Rectangle().strokeBorder(Color.pitchGreen.opacity(0.08), lineWidth: 1)
            )
    }
}

/// Bouton plein "bg-pitch text-volt uppercase" du site.
struct PitchButtonStyle: ButtonStyle {
    var filled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.pitchDisplay(20))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .foregroundStyle(filled ? Color.pitchVolt : Color.pitchGreen)
            .background(filled ? Color.pitchGreen : Color.clear)
            .overlay(
                Rectangle().strokeBorder(Color.pitchGreen, lineWidth: filled ? 0 : 2)
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}
