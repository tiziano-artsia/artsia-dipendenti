import Foundation
import Capacitor

class CustomBridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.webView?.allowsBackForwardNavigationGestures = true
        
        print("✅ iOS: Gesture back/forward abilitate")
        print("✅ WebView gesture enabled:", self.webView?.allowsBackForwardNavigationGestures ?? false)
    }
}
