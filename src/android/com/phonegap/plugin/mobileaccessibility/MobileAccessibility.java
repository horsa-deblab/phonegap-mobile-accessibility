/**
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

package com.phonegap.plugin.mobileaccessibility;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Build;
import android.webkit.WebView;

import java.lang.IllegalAccessException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * This class provides information on the status of native accessibility services to JavaScript.
 */
public class MobileAccessibility extends CordovaPlugin {
    private AbstractMobileAccessibilityHelper mMobileAccessibilityHelper;
    private CallbackContext mCallbackContext = null;
    private boolean mIsScreenReaderRunning = false;
    private boolean mCachedIsScreenReaderRunning = false;
    private float mFontScale = 1;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            mMobileAccessibilityHelper = new KitKatMobileAccessibilityHelper();
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            mMobileAccessibilityHelper = new JellyBeanMobileAccessibilityHelper();
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
            mMobileAccessibilityHelper = new IceCreamSandwichMobileAccessibilityHelper();
        } else {
            mMobileAccessibilityHelper = new DonutMobileAccessibilityHelper();
        }
        mMobileAccessibilityHelper.initialize(this);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        try {
            if (action.equals("getTextZoom")) {
                getTextZoom(callbackContext);
                return true;
            } else if(action.equals("setTextZoom")) {
                if (args.length() > 0) {
                    double textZoom = args.getDouble(0);
                    if (textZoom > 0) {
                        setTextZoom(textZoom, callbackContext);
                    }
                }
                return true;
            } else if(action.equals("updateTextZoom")) {
                updateTextZoom(callbackContext);
                return true;
            } else if (action.equals("start")) {
                start(callbackContext);
                return true;
            } else if (action.equals("stop")) {
                stop();
                return true;
            }
        } catch (JSONException e) {
            e.printStackTrace();
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
        }
        return false;
    }

    /**
     * Called when the system is about to pause the current activity
     *
     * @param multitasking        Flag indicating if multitasking is turned on for app
     */
    @Override
    public void onPause(boolean multitasking) {
        //Log.i("MobileAccessibility", "onPause");
        mCachedIsScreenReaderRunning = mIsScreenReaderRunning;
    }

    /**
     * Called when the activity will start interacting with the user.
     *
     * @param multitasking        Flag indicating if multitasking is turned on for app
     */
    @Override
    public void onResume(boolean multitasking) {
        //Log.i("MobileAccessibility", "onResume");
        if (mIsScreenReaderRunning && !mCachedIsScreenReaderRunning) {
            //Log.i("MobileAccessibility", "Reloading page on reload because the Accessibility State has changed.");
            mCachedIsScreenReaderRunning = mIsScreenReaderRunning;
            stop();
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    WebView view;
                    try {
                        view = (WebView) webView;
                        view.reload();
                    } catch(ClassCastException ce) {  // cordova-android 4.0+
                        try {   // cordova-android 4.0+
                            Method getView = webView.getClass().getMethod("getView");
                            Method reload = getView.invoke(webView).getClass().getMethod("reload");
                            reload.invoke(webView);
                        } catch (NoSuchMethodException e) {
                            e.printStackTrace();
                        } catch (InvocationTargetException e) {
                            e.printStackTrace();
                        } catch (IllegalAccessException e) {
                            e.printStackTrace();
                        }
                    }
                }
            });
        }
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    public void onDestroy() {
        stop();
    }


    private void getTextZoom(final CallbackContext callbackContext) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                final double textZoom = mMobileAccessibilityHelper.getTextZoom();
                if (callbackContext != null) {
                    callbackContext.success((int) textZoom);
                }
            }
        });
    }

    private void setTextZoom(final double textZoom, final CallbackContext callbackContext) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                mMobileAccessibilityHelper.setTextZoom(textZoom);
                if (callbackContext != null) {
                    callbackContext.success((int) mMobileAccessibilityHelper.getTextZoom());
                }
            }
        });
    }

    public void setTextZoom(final double textZoom) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                mMobileAccessibilityHelper.setTextZoom(textZoom);
            }
        });
    }

    private void updateTextZoom(final CallbackContext callbackContext) {
        float fontScale = cordova.getActivity().getResources().getConfiguration().fontScale;
        if (fontScale != mFontScale) {
            mFontScale = fontScale;
        }
        final double textZoom = Math.round(mFontScale * 100);
        setTextZoom(textZoom, callbackContext);
    }

    private void start(CallbackContext callbackContext) {
        //Log.i("MobileAccessibility", "MobileAccessibility.start");
        mCallbackContext = callbackContext;
        mMobileAccessibilityHelper.addStateChangeListeners();
    }

    private void stop() {
        //Log.i("MobileAccessibility", "MobileAccessibility.stop");
        if (mCallbackContext != null) {
            mMobileAccessibilityHelper.removeStateChangeListeners();
            mCallbackContext = null;
        }
    }
}
