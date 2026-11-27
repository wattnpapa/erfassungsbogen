package de.erfassungsbogen.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Eigenes Plugin für das APK-Selbst-Update registrieren (vor super.onCreate).
        registerPlugin(AppUpdate.class);
        // Screenshot-Sperre (FLAG_SECURE), ab Werk an; die App kann sie abschalten.
        registerPlugin(Bildschirmschutz.class);
        super.onCreate(savedInstanceState);
        // Vor dem ersten Bild setzen: Schon der Start zeigt Entwürfe mit Namen.
        Bildschirmschutz.anwenden(this, true);
    }
}
