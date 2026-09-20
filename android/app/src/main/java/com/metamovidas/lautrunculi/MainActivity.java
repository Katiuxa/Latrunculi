package com.metamovidas.lautrunculi;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Status bar may overlay the WebView. The Android navigation bar must not cover
 * the last on-screen content: the content view is padded by the nav inset
 * (including when the bar is temporarily hidden).
 *
 * AdMob banners cannot sit on top of the WebView surface. The WebView and the
 * banner live in a vertical LinearLayout so the ad has its own fixed row
 * pinned to the bottom of the safe area.
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "LatrunculiMain";
    private static final int NAV_BAR_COLOR = Color.parseColor("#2a0c12");
    private static final int BANNER_MIN_DP = 50;

    private String lastInsetJs = "";
    private FrameLayout bannerSlot;
    private LinearLayout rootColumn;
    private AdsManager ads;
    private boolean layoutWrapped;
    private boolean jsBridgeBound;
    private PlayBilling billing;
    private int bannerSlotPx;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(NAV_BAR_COLOR);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(true);
        }

        configureSystemBars();
        bindNavInsets();

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(NAV_BAR_COLOR);
        bindJsBridge();
        billing = new PlayBilling(this, "latrunculi_remove_ads", this::notifyJsPurchaseOk);
        billing.start();
        webView.postDelayed(this::primeAudioJs, 400);
        webView.postDelayed(this::primeAudioJs, 1200);
        setupNativeBanner();
        webView.post(this::setupNativeBanner);
        webView.postDelayed(this::setupNativeBanner, 600);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (lastInsetJs.length() > 0) {
                    getBridge().getWebView().evaluateJavascript(lastInsetJs, null);
                }
                getBridge().getWebView().evaluateJavascript(
                    "(function(){try{if(window.GameAds&&window.GameAds.consumeBack&&window.GameAds.consumeBack())return true;return window.latrunculiConsumeBack&&window.latrunculiConsumeBack()===true;}catch(e){return false;}})()",
                    value -> {
                        if (!"true".equals(value)) {
                            moveTaskToBack(true);
                        }
                    }
                );
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        configureSystemBars();
        if (ads != null) ads.resume();
        primeAudioJs();
        ensureBannerSlotVisible();
    }

    @Override
    public void onPause() {
        if (ads != null) ads.pause();
        super.onPause();
    }

    @Override
    public void onDestroy() {
        if (billing != null) billing.destroy();
        if (ads != null) ads.destroy();
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        configureSystemBars();
        View root = findViewById(android.R.id.content);
        if (root != null) ViewCompat.requestApplyInsets(root);
        if (getBridge() != null && getBridge().getWebView() != null && lastInsetJs.length() > 0) {
            getBridge().getWebView().evaluateJavascript(lastInsetJs, null);
        }
        ensureBannerSlotVisible();
    }

    private void configureSystemBars() {
        View decor = getWindow().getDecorView();
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), decor);
        bars.setAppearanceLightStatusBars(false);
        bars.setAppearanceLightNavigationBars(false);
        /* Keep nav bar present (dark) so the AdMob row never sinks under the
           gesture/home area. Status can stay translucent over content. */
        bars.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_DEFAULT
        );
        bars.show(WindowInsetsCompat.Type.navigationBars());
    }

    private void bindNavInsets() {
        final View root = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
            /* IgnoringVisibility keeps the reserved strip even if bars flicker. */
            Insets nav = windowInsets.getInsetsIgnoringVisibility(
                WindowInsetsCompat.Type.navigationBars()
            );
            Insets tap = windowInsets.getInsetsIgnoringVisibility(
                WindowInsetsCompat.Type.tappableElement()
            );
            Insets cut = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());
            Insets status = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
            int bottomPx = Math.max(nav.bottom, tap.bottom);
            v.setPadding(0, 0, 0, bottomPx);
            if (v instanceof ViewGroup) {
                ViewGroup g = (ViewGroup) v;
                g.setClipToPadding(false);
                g.setClipChildren(false);
            }

            float d = getResources().getDisplayMetrics().density;
            int top = Math.round(Math.max(status.top, cut.top) / d);
            int right = Math.round(Math.max(status.right, cut.right) / d);
            int left = Math.round(Math.max(status.left, cut.left) / d);
            int bannerCssPx = Math.max(1, Math.round(bannerSlotHeightPx() / d));

            lastInsetJs =
                "(function(){var s=document.documentElement&&document.documentElement.style;if(!s)return;"
                + "var root=document.documentElement;"
                + "root.classList.add('has-ad-banner','ads-chrome');"
                + "s.setProperty('--android-inset-top','" + top + "px');"
                + "s.setProperty('--android-inset-right','" + right + "px');"
                + "s.setProperty('--android-inset-left','" + left + "px');"
                + "s.setProperty('--android-inset-bottom','0px');"
                + "s.setProperty('--inset-top','" + Math.max(top, 10) + "px');"
                + "s.setProperty('--inset-bottom','0px');"
                + "s.setProperty('--ad-safe-bottom','0px');"
                + "s.setProperty('--ad-banner-h','0px');"
                + "s.setProperty('--native-ad-slot-h','" + bannerCssPx + "px');"
                + "s.setProperty('--ad-safe-gap','2px');})()";
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(lastInsetJs, null);
            }
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(root);
        root.post(() -> {
            configureSystemBars();
            ViewCompat.requestApplyInsets(root);
            setupNativeBanner();
            bindJsBridge();
        });
    }

    private void bindJsBridge() {
        if (jsBridgeBound) return;
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().addJavascriptInterface(new JsBridge(), "LatrunculiNative");
        getBridge().getWebView().addJavascriptInterface(new JsBridge(), "GameAdsNative");
        jsBridgeBound = true;
    }

    private class JsBridge {
        @JavascriptInterface
        public void setPlayAds(final boolean inPlay) {
            runOnUiThread(() -> {
                startAds();
                if (inPlay && ads != null) ads.setAdsEnabled(true);
                ensureBannerSlotVisible();
            });
        }

        @JavascriptInterface
        public void setAdsOff() {
            runOnUiThread(() -> {
                if (ads != null) ads.setAdsEnabled(false);
            });
        }

        @JavascriptInterface
        public void setAdsOn() {
            runOnUiThread(() -> {
                startAds();
                if (ads != null) ads.setAdsEnabled(true);
                ensureBannerSlotVisible();
            });
        }

        /** Called when ads-config.developerForceAds is on — show Google sample banners. */
        @JavascriptInterface
        public void useTestAdUnits() {
            runOnUiThread(() -> {
                startAds();
                if (ads != null) {
                    ads.setPreferTestUnits(true);
                    ads.setAdsEnabled(true);
                }
                ensureBannerSlotVisible();
            });
        }

        @JavascriptInterface
        public void preloadInterstitial() {
            runOnUiThread(() -> {
                if (ads != null) ads.preloadInterstitial();
            });
        }

        @JavascriptInterface
        public void buyRemoveAds() {
            runOnUiThread(() -> {
                if (billing != null) billing.launch();
            });
        }

        @JavascriptInterface
        public void restorePurchases() {
            runOnUiThread(() -> {
                if (billing != null) billing.restore();
            });
        }

        @JavascriptInterface
        public void showInterstitial() {
            runOnUiThread(() -> {
                if (ads != null) ads.showInterstitial(MainActivity.this::notifyJsInterstitialDone);
            });
        }
    }

    private void notifyJsPurchaseOk() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().evaluateJavascript(
            "(function(){try{if(window.GameAds&&window.GameAds.onNativePurchase)window.GameAds.onNativePurchase(true);}catch(e){}})()",
            null
        );
    }

    private void notifyJsInterstitialDone() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().evaluateJavascript(
            "(function(){try{if(window.GameAds&&window.GameAds._onNativeInterstitialDone)window.GameAds._onNativeInterstitialDone();}catch(e){}})()",
            null
        );
    }

    private int bannerSlotHeightPx() {
        if (bannerSlotPx > 0) return bannerSlotPx;
        return Math.round(BANNER_MIN_DP * getResources().getDisplayMetrics().density);
    }

    private void ensureBannerSlotVisible() {
        if (bannerSlot == null) return;
        bannerSlot.setVisibility(View.VISIBLE);
        ViewGroup.LayoutParams lp = bannerSlot.getLayoutParams();
        if (lp != null) {
            int h = bannerSlotHeightPx();
            if (lp.height != h) {
                lp.height = h;
                bannerSlot.setLayoutParams(lp);
            }
        }
        bannerSlot.setBackgroundColor(NAV_BAR_COLOR);
        bannerSlot.bringToFront();
        if (rootColumn != null) rootColumn.requestLayout();
    }

    private void setupNativeBanner() {
        if (layoutWrapped) {
            ensureBannerSlotVisible();
            startAds();
            return;
        }
        if (getBridge() == null || getBridge().getWebView() == null) return;
        WebView webView = getBridge().getWebView();
        if (!(webView.getParent() instanceof ViewGroup)) return;

        ViewGroup host = (ViewGroup) webView.getParent();
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) return;

        /* Prefer wrapping the immediate bridge host under content. */
        ViewGroup wrapTarget = host;
        ViewGroup insertParent = null;
        int index = -1;
        ViewGroup.LayoutParams hostLp = host.getLayoutParams();

        if (host.getParent() instanceof ViewGroup) {
            insertParent = (ViewGroup) host.getParent();
            index = insertParent.indexOfChild(host);
        }
        if (insertParent == null) {
            insertParent = content;
            if (content.getChildCount() > 0) {
                View child = content.getChildAt(0);
                if (child instanceof ViewGroup) {
                    wrapTarget = (ViewGroup) child;
                    hostLp = wrapTarget.getLayoutParams();
                    index = 0;
                }
            }
        }

        bannerSlotPx = Math.round(BANNER_MIN_DP * getResources().getDisplayMetrics().density);
        bannerSlot = new FrameLayout(this);
        bannerSlot.setId(View.generateViewId());
        bannerSlot.setBackgroundColor(NAV_BAR_COLOR);
        bannerSlot.setVisibility(View.VISIBLE);
        bannerSlot.setMinimumHeight(bannerSlotPx);

        insertParent.removeView(wrapTarget);

        rootColumn = new LinearLayout(this);
        rootColumn.setOrientation(LinearLayout.VERTICAL);
        rootColumn.setBackgroundColor(NAV_BAR_COLOR);
        rootColumn.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        LinearLayout.LayoutParams webLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0,
            1f
        );
        wrapTarget.setLayoutParams(webLp);
        rootColumn.addView(wrapTarget, webLp);
        rootColumn.addView(bannerSlot, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            bannerSlotPx
        ));

        ViewGroup.LayoutParams columnLp = hostLp != null
            ? new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            : new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            );
        if (index >= 0) insertParent.addView(rootColumn, index, columnLp);
        else insertParent.addView(rootColumn, columnLp);

        layoutWrapped = true;
        Log.i(TAG, "banner slot wrapped h=" + bannerSlotPx + "px parent=" + insertParent.getClass().getSimpleName());
        ensureBannerSlotVisible();
        startAds();
        View root = findViewById(android.R.id.content);
        if (root != null) ViewCompat.requestApplyInsets(root);
    }

    private void startAds() {
        if (bannerSlot == null) return;
        if (ads == null) {
            ads = new AdsManager(this, NAV_BAR_COLOR, bannerUnitId(), interstitialUnitId());
            ads.bindSlot(bannerSlot);
        }
        ads.start();
        ensureBannerSlotVisible();
    }

    private String bannerUnitId() {
        try {
            return getString(R.string.admob_banner_id);
        } catch (Exception e) {
            return "";
        }
    }

    private String interstitialUnitId() {
        try {
            int id = getResources().getIdentifier("admob_interstitial_id", "string", getPackageName());
            return id != 0 ? getString(id) : "";
        } catch (Exception e) {
            return "";
        }
    }

    private void primeAudioJs() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().evaluateJavascript(
            "(function(){try{if(window.latrunculiPrimeAudio)window.latrunculiPrimeAudio();}catch(e){}})()",
            null
        );
    }
}
