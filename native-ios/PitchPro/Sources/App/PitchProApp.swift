import SwiftUI
import CoreText

@main
struct PitchProApp: App {
    @StateObject private var session = SessionStore()

    init() {
        FontRegistrar.registerBundledFonts()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                // Le site web ne s'adapte pas au mode sombre : on force le même
                // rendu clair ici pour garder un design identique en toutes circonstances.
                .preferredColorScheme(.light)
        }
    }
}

/// Enregistre la police Bebas Neue explicitement au lancement, en plus de la
/// déclaration UIAppFonts dans Info.plist — sécurité si le plist généré par
/// XcodeGen ne suffit pas à faire charger la police par le système.
enum FontRegistrar {
    static func registerBundledFonts() {
        guard let url = Bundle.main.url(forResource: "BebasNeue-Regular", withExtension: "ttf") else {
            print("⚠️ BebasNeue-Regular.ttf introuvable dans le bundle de l'app.")
            return
        }
        var error: Unmanaged<CFError>?
        let ok = CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error)
        if !ok, let error {
            print("⚠️ Échec d'enregistrement de la police : \(error.takeUnretainedValue())")
        }
    }
}
