package de.erfassungsbogen.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Eigenes Plugin für das APK-Selbst-Update registrieren (vor super.onCreate).
        registerPlugin(AppUpdate.class);
        super.onCreate(savedInstanceState);
    }
}
