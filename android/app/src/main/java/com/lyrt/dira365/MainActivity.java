package com.lyrt.dira365;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

/**
 * Android's system back currently finishes the activity. Walk the in-app UI
 * first: close an open dialog or menu, step to the previous tab, then the
 * previous screen. Leave the app only when that history is empty.
 */
public class MainActivity extends BridgeActivity {

    private static final String BACK_JS =
        "(function(){"
            + "function visible(el){return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);}"
            + "var overlay=document.querySelector("
            + "'[role=\"dialog\"][data-state=\"open\"],"
            + "[role=\"alertdialog\"][data-state=\"open\"],"
            + "[role=\"menu\"][data-state=\"open\"],"
            + "[role=\"listbox\"][data-state=\"open\"]');"
            + "if(overlay){"
            + "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true,cancelable:true}));"
            + "return 'overlay';"
            + "}"
            + "var lists=[].slice.call(document.querySelectorAll('[role=\"tablist\"]')).filter(visible);"
            + "for(var i=lists.length-1;i>=0;i--){"
            + "var tabs=[].slice.call(lists[i].querySelectorAll('[role=\"tab\"]'));"
            + "var active=-1;"
            + "for(var j=0;j<tabs.length;j++){"
            + "if(tabs[j].getAttribute('data-state')==='active'||tabs[j].getAttribute('aria-selected')==='true'){active=j;break;}"
            + "}"
            + "if(active>0){tabs[active-1].click();return 'tab';}"
            + "}"
            + "return 'history';"
            + "})()";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView == null) {
                    moveTaskToBack(true);
                    return;
                }

                webView.evaluateJavascript(BACK_JS, value -> runOnUiThread(() -> {
                    if ("\"overlay\"".equals(value) || "\"tab\"".equals(value)) {
                        return;
                    }
                    if (webView.canGoBack()) {
                        webView.goBack();
                        return;
                    }
                    moveTaskToBack(true);
                }));
            }
        });
    }
}
