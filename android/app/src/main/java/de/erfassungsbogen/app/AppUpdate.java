package de.erfassungsbogen.app;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Selbst-Update für die per Sideload verteilte APK (kein Play Store):
 * lädt die vom JS-Teil ermittelte Release-APK herunter und übergibt sie
 * dem System-Paketinstaller. Gegenstück zu electron-updater auf dem Desktop.
 *
 * Der Versionsvergleich (GitHub-Release vs. installierte Version) passiert
 * bewusst im JS-Teil (aktualisierung.tsx); nativ bleibt nur, was nur nativ
 * geht: eigene Version auslesen, Download, Installer-Intent.
 */
@CapacitorPlugin(name = "AppUpdate")
public class AppUpdate extends Plugin {

    /** Installierte Version (versionName aus dem APK-Manifest). */
    @PluginMethod
    public void getCurrentVersion(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager()
                    .getPackageInfo(getContext().getPackageName(), 0);
            JSObject ret = new JSObject();
            ret.put("versionName", info.versionName);
            long code = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    ? info.getLongVersionCode() : info.versionCode;
            ret.put("versionCode", code);
            call.resolve(ret);
        } catch (PackageManager.NameNotFoundException e) {
            call.reject("Version nicht ermittelbar", e);
        }
    }

    /** APK von {@code url} laden und Installation anstoßen. */
    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url fehlt");
            return;
        }
        // Netz-/IO im Hintergrund; nur der Installer-Intent muss auf den UI-Thread.
        new Thread(() -> {
            try {
                File apk = new File(getContext().getCacheDir(), "update.apk");
                ladeHerunter(url, apk);
                getActivity().runOnUiThread(() -> starteInstaller(apk, call));
            } catch (Exception e) {
                call.reject("Download fehlgeschlagen: " + e.getMessage(), e);
            }
        }).start();
    }

    private void ladeHerunter(String urlStr, File ziel) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setInstanceFollowRedirects(true);
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(30000);
        conn.connect();
        // GitHub liefert Assets per Redirect auf objects.githubusercontent.com.
        // setInstanceFollowRedirects folgt https→https automatisch; dieser Zweig
        // ist Absicherung, falls ein Redirect-Status doch durchkommt.
        int status = conn.getResponseCode();
        if (status == HttpURLConnection.HTTP_MOVED_PERM
                || status == HttpURLConnection.HTTP_MOVED_TEMP
                || status == 307 || status == 308) {
            String ziel2 = conn.getHeaderField("Location");
            conn.disconnect();
            conn = (HttpURLConnection) new URL(ziel2).openConnection();
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(30000);
            conn.connect();
        }
        int gesamt = conn.getContentLength();
        try (InputStream in = conn.getInputStream();
             OutputStream out = new FileOutputStream(ziel)) {
            byte[] puffer = new byte[8192];
            int gelesen;
            long summe = 0;
            int letzterProzent = -1;
            while ((gelesen = in.read(puffer)) != -1) {
                out.write(puffer, 0, gelesen);
                summe += gelesen;
                if (gesamt > 0) {
                    int prozent = (int) (summe * 100 / gesamt);
                    if (prozent != letzterProzent) {
                        letzterProzent = prozent;
                        JSObject ereignis = new JSObject();
                        ereignis.put("prozent", prozent);
                        notifyListeners("fortschritt", ereignis);
                    }
                }
            }
        }
        conn.disconnect();
    }

    private void starteInstaller(File apk, PluginCall call) {
        // Ab Android 8 muss der Nutzer der App erlauben, unbekannte Apps zu
        // installieren. Ist das nicht erteilt, zur passenden Einstellung führen.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent erlaubnis = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
            erlaubnis.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(erlaubnis);
            call.reject("Installation aus dieser Quelle bitte erlauben und erneut versuchen.");
            return;
        }
        Uri uri = FileProvider.getUriForFile(getContext(),
                getContext().getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
