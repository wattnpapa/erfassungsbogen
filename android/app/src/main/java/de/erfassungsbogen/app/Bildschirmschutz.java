package de.erfassungsbogen.app;

import android.app.Activity;
import android.view.WindowManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Screenshot-Sperre der Android-App: FLAG_SECURE auf dem Fenster der
 * BridgeActivity. Bildschirmfotos und Bildschirmaufnahmen zeigen dann eine
 * schwarze Fläche, Übertragungen auf unsichere Anzeigen (Casting) bleiben
 * leer, und die Vorschau in der App-Übersicht zeigt keinen Inhalt.
 *
 * Ab Werk an: MainActivity setzt das Flag schon vor dem ersten Bild. Die
 * App schaltet es über {@link #setzen} ab, wenn es in der Fußzeile so
 * eingestellt ist (src/app/bildschirmschutz.ts).
 *
 * Grenzen: Das Flag gilt nur für dieses Fenster. Fremde Activities, die die
 * App aufruft (Kamera-Scanner, Teilen-Menü, Dateiauswahl), sind nicht
 * geschützt, und ein Foto des Bildschirms mit einem zweiten Gerät verhindert
 * es nicht.
 */
@CapacitorPlugin(name = "Bildschirmschutz")
public class Bildschirmschutz extends Plugin {

    static void anwenden(Activity activity, boolean an) {
        if (an) {
            activity.getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE);
        } else {
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
        }
    }

    @PluginMethod
    public void setzen(PluginCall call) {
        boolean an = call.getBoolean("an", true);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Kein Fenster");
            return;
        }
        // Plugin-Aufrufe kommen nicht auf dem UI-Thread an; Fensterflags schon.
        activity.runOnUiThread(() -> {
            anwenden(activity, an);
            call.resolve();
        });
    }
}
