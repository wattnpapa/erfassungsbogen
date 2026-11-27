import UIKit
import Capacitor

/**
 * Bildschirmschutz der iOS-App. iOS kennt keine öffentliche Schnittstelle,
 * die Bildschirmfotos verhindert; hier steht, was offiziell geht:
 *
 *  - Während einer Bildschirmaufnahme, Spiegelung oder AirPlay-Übertragung
 *    deckt eine Fläche den Inhalt ab (iOS 17+: sceneCaptureState, davor
 *    UIScreen.isCaptured mit capturedDidChangeNotification).
 *  - Verlässt die App den Vordergrund, deckt dieselbe Fläche die Vorschau im
 *    App-Umschalter ab.
 *  - Ein Bildschirmfoto meldet iOS erst, wenn es schon gespeichert ist
 *    (userDidTakeScreenshotNotification). Das Plugin gibt das als Ereignis
 *    „bildschirmfoto“ an die Seite weiter, die einen Hinweis zeigt.
 *
 * Ab Werk an; die Seite schaltet über `setzen` ab (src/app/bildschirmschutz.ts).
 * Bewusst ohne den inoffiziellen Trick mit einem Secure-Textfeld-Layer.
 */
@objc(BildschirmschutzPlugin)
public class BildschirmschutzPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BildschirmschutzPlugin"
    public let jsName = "Bildschirmschutz"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setzen", returnType: CAPPluginReturnPromise)
    ]

    private var an = true
    private var imHintergrund = false
    private var abdeckung: UIView?
    private var abdeckungsText: UILabel?

    override public func load() {
        let zentrale = NotificationCenter.default
        zentrale.addObserver(self, selector: #selector(aufnahmeGeaendert),
                             name: UIScreen.capturedDidChangeNotification, object: nil)
        zentrale.addObserver(self, selector: #selector(verlaesstVordergrund),
                             name: UIApplication.willResignActiveNotification, object: nil)
        zentrale.addObserver(self, selector: #selector(zurueckImVordergrund),
                             name: UIApplication.didBecomeActiveNotification, object: nil)
        zentrale.addObserver(self, selector: #selector(bildschirmfoto),
                             name: UIApplication.userDidTakeScreenshotNotification, object: nil)
        if #available(iOS 17.0, *) {
            DispatchQueue.main.async { [weak self] in
                guard let self = self, let vc = self.bridge?.viewController else { return }
                vc.registerForTraitChanges([UITraitSceneCaptureState.self]) { [weak self] (_: UIViewController, _: UITraitCollection) in
                    self?.abgleichen()
                }
                self.abgleichen()
            }
        } else {
            DispatchQueue.main.async { [weak self] in self?.abgleichen() }
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc func setzen(_ call: CAPPluginCall) {
        let wert = call.getBool("an") ?? true
        DispatchQueue.main.async { [weak self] in
            self?.an = wert
            self?.abgleichen()
            call.resolve()
        }
    }

    /** Läuft gerade eine Aufnahme, Spiegelung oder Übertragung? */
    private func wirdAufgenommen() -> Bool {
        guard let vc = bridge?.viewController else { return false }
        if #available(iOS 17.0, *) {
            return vc.traitCollection.sceneCaptureState == .active
        }
        return (vc.view.window?.windowScene?.screen ?? UIScreen.main).isCaptured
    }

    private func abgleichen() {
        let aufnahme = wirdAufgenommen()
        if an && (imHintergrund || aufnahme) {
            abdecken()
            // In der App-Übersicht genügt die leere Fläche.
            abdeckungsText?.isHidden = !aufnahme
        } else {
            aufdecken()
        }
    }

    @objc private func aufnahmeGeaendert() {
        DispatchQueue.main.async { [weak self] in self?.abgleichen() }
    }

    @objc private func verlaesstVordergrund() {
        imHintergrund = true
        abgleichen()
    }

    @objc private func zurueckImVordergrund() {
        imHintergrund = false
        abgleichen()
    }

    @objc private func bildschirmfoto() {
        guard an else { return }
        notifyListeners("bildschirmfoto", data: [:])
    }

    private func abdecken() {
        guard abdeckung == nil, let ansicht = bridge?.viewController?.view else { return }
        let flaeche = UIView(frame: ansicht.bounds)
        flaeche.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        flaeche.backgroundColor = .systemBackground
        let text = UILabel()
        text.text = "Inhalt verborgen, solange der Bildschirm aufgenommen oder übertragen wird."
        text.textColor = .secondaryLabel
        text.font = UIFont.preferredFont(forTextStyle: .body)
        text.adjustsFontForContentSizeCategory = true
        text.numberOfLines = 0
        text.textAlignment = .center
        text.translatesAutoresizingMaskIntoConstraints = false
        flaeche.addSubview(text)
        NSLayoutConstraint.activate([
            text.centerYAnchor.constraint(equalTo: flaeche.centerYAnchor),
            text.leadingAnchor.constraint(equalTo: flaeche.layoutMarginsGuide.leadingAnchor),
            text.trailingAnchor.constraint(equalTo: flaeche.layoutMarginsGuide.trailingAnchor),
        ])
        flaeche.accessibilityViewIsModal = true
        ansicht.addSubview(flaeche)
        abdeckung = flaeche
        abdeckungsText = text
    }

    private func aufdecken() {
        abdeckung?.removeFromSuperview()
        abdeckung = nil
        abdeckungsText = nil
    }
}

/** Bridge-ViewController der App: registriert das eigene Plugin (Main.storyboard). */
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(BildschirmschutzPlugin())
    }
}
