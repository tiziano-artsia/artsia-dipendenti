import Foundation
import Capacitor

class CustomBridgeViewController: CAPBridgeViewController {
    override func loadView() {
        super.loadView()

        // ✅ Abilita gesture swipe back/forward
        self.webView?.allowsBackForwardNavigationGestures = true

        print("✅ iOS: Gesture back/forward abilitate")
    }
}

