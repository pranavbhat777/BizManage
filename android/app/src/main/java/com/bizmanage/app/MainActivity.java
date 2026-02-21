package com.bizmanage.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.PluginCall;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Handle app links and deep linking
        handleIntent(getIntent());
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }
    
    private void handleIntent(Intent intent) {
        Uri data = intent.getData();
        if (data != null) {
            // Handle deep link
            String scheme = data.getScheme();
            String host = data.getHost();
            String path = data.getPath();
            
            // Log the deep link for debugging
            System.out.println("Deep link received: " + data.toString());
            
            // You can handle specific deep links here
            if ("bizmanage".equals(scheme) && "app".equals(host)) {
                // Handle custom scheme deep links
                handleCustomDeepLink(path);
            } else if ("https".equals(scheme)) {
                // Handle HTTPS app links
                handleAppLink(path);
            }
        }
    }
    
    private void handleCustomDeepLink(String path) {
        // Handle custom scheme deep links (bizmanage://app/path)
        if (path != null) {
            // Send the deep link to the web app
            bridge.getWebView().post(() -> {
                bridge.getWebView().evaluateJavascript(
                    "window.handleDeepLink && window.handleDeepLink('" + path + "');",
                    null
                );
            });
        }
    }
    
    private void handleAppLink(String path) {
        // Handle HTTPS app links
        if (path != null) {
            bridge.getWebView().post(() -> {
                bridge.getWebView().evaluateJavascript(
                    "window.handleAppLink && window.handleAppLink('" + path + "');",
                    null
                );
            });
        }
    }
}
