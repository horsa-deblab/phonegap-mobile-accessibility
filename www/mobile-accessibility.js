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

var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    MobileAccessibilityNotifications = require('phonegap-plugin-mobile-accessibility.MobileAccessibilityNotifications');

var MobileAccessibility = function() {
    this._isBoldTextEnabled = false;
    this._isClosedCaptioningEnabled = false;
    this._isDarkerSystemColorsEnabled = false;
    this._isGrayscaleEnabled = false;
    this._isGuidedAccessEnabled = false;
    this._isInvertColorsEnabled = false;
    this._isMonoAudioEnabled = false;
    this._isReduceMotionEnabled = false;
    this._isReduceTransparencyEnabled = false;
    this._isScreenReaderRunning = false;
    this._isSpeakScreenEnabled = false;
    this._isSpeakSelectionEnabled = false;
    this._isSwitchControlRunning = false;
    this._isTouchExplorationEnabled = false;
    this._usePreferredTextZoom = false;
    this._isHighContrastEnabled = false;
    this._highContrastScheme = undefined;

    // Create new event handlers on the window (returns a channel instance)
    this.channels = {
        boldtextstatuschanged           : cordova.addWindowEventHandler(MobileAccessibilityNotifications.BOLD_TEXT_STATUS_CHANGED),
        closedcaptioningstatuschanged   : cordova.addWindowEventHandler(MobileAccessibilityNotifications.CLOSED_CAPTIONING_STATUS_CHANGED),
        darkersystemcolorsstatuschanged : cordova.addWindowEventHandler(MobileAccessibilityNotifications.DARKER_SYSTEM_COLORS_STATUS_CHANGED),
        grayscalestatuschanged          : cordova.addWindowEventHandler(MobileAccessibilityNotifications.GRAYSCALE_STATUS_CHANGED),
        guidedaccessstatuschanged       : cordova.addWindowEventHandler(MobileAccessibilityNotifications.GUIDED_ACCESS_STATUS_CHANGED),
        invertcolorsstatuschanged       : cordova.addWindowEventHandler(MobileAccessibilityNotifications.INVERT_COLORS_STATUS_CHANGED),
        monoaudiostatuschanged          : cordova.addWindowEventHandler(MobileAccessibilityNotifications.MONO_AUDIO_STATUS_CHANGED),
        reducemotionstatuschanged       : cordova.addWindowEventHandler(MobileAccessibilityNotifications.REDUCE_MOTION_STATUS_CHANGED),
        reducetransparencystatuschanged : cordova.addWindowEventHandler(MobileAccessibilityNotifications.REDUCE_TRANSPARENCY_STATUS_CHANGED),
        screenreaderstatuschanged       : cordova.addWindowEventHandler(MobileAccessibilityNotifications.SCREEN_READER_STATUS_CHANGED),
        speakscreenstatuschanged        : cordova.addWindowEventHandler(MobileAccessibilityNotifications.SPEAK_SCREEN_STATUS_CHANGED),
        speakselectionstatuschanged     : cordova.addWindowEventHandler(MobileAccessibilityNotifications.SPEAK_SELECTION_STATUS_CHANGED),
        switchcontrolstatuschanged      : cordova.addWindowEventHandler(MobileAccessibilityNotifications.SWITCH_CONTROL_STATUS_CHANGED),
        touchexplorationstatechanged    : cordova.addWindowEventHandler(MobileAccessibilityNotifications.TOUCH_EXPLORATION_STATUS_CHANGED),
        highcontrastchanged             : cordova.addWindowEventHandler(MobileAccessibilityNotifications.HIGH_CONTRAST_CHANGED)
    };
    for (var key in this.channels) {
        this.channels[key].onHasSubscribersChange = MobileAccessibility.onHasSubscribersChange;
    }
};

/**
 * @private
 * @ignore
 */
function handlers() {
    return mobileAccessibility.channels.boldtextstatuschanged.numHandlers +
           mobileAccessibility.channels.closedcaptioningstatuschanged.numHandlers +
           mobileAccessibility.channels.darkersystemcolorsstatuschanged.numHandlers +
           mobileAccessibility.channels.grayscalestatuschanged.numHandlers +
           mobileAccessibility.channels.guidedaccessstatuschanged.numHandlers +
           mobileAccessibility.channels.invertcolorsstatuschanged.numHandlers +
           mobileAccessibility.channels.monoaudiostatuschanged.numHandlers +
           mobileAccessibility.channels.reducemotionstatuschanged.numHandlers +
           mobileAccessibility.channels.reducetransparencystatuschanged.numHandlers +
           mobileAccessibility.channels.screenreaderstatuschanged.numHandlers +
           mobileAccessibility.channels.speakscreenstatuschanged.numHandlers +
           mobileAccessibility.channels.speakselectionstatuschanged.numHandlers +
           mobileAccessibility.channels.switchcontrolstatuschanged.numHandlers +
           mobileAccessibility.channels.touchexplorationstatechanged.numHandlers +
           mobileAccessibility.channels.highcontrastchanged.numHandlers;
};

/**
 * Asynchronous call to native MobileAccessibility to return the current text zoom percent value for the WebView.
 * @param {function} callback A callback method to receive the asynchronous result from the native MobileAccessibility.
 */
MobileAccessibility.prototype.getTextZoom = function(callback) {
    exec(callback, null, "MobileAccessibility", "getTextZoom", []);
};

/**
 * Asynchronous call to native MobileAccessibility to set the current text zoom percent value for the WebView.
 * @param {Number} textZoom A percentage value by which text in the WebView should be scaled.
 * @param {function} callback A callback method to receive the asynchronous result from the native MobileAccessibility.
 */
MobileAccessibility.prototype.setTextZoom = function(textZoom, callback) {
    exec(callback, null, "MobileAccessibility", "setTextZoom", [textZoom]);
};

/**
 * Asynchronous call to native MobileAccessibility to retrieve the user's preferred text zoom from system settings and apply it to the application WebView.
 * @param {function} callback A callback method to receive the asynchronous result from the native MobileAccessibility.
 */
MobileAccessibility.prototype.updateTextZoom = function(callback) {
    exec(callback, null, "MobileAccessibility", "updateTextZoom", []);
};

MobileAccessibility.prototype.usePreferredTextZoom = function(bool) {
    var currentValue = window.localStorage.getItem("MobileAccessibility.usePreferredTextZoom") === "true";

    if (arguments.length === 0) {
        return currentValue;
    }

    if (currentValue != bool) {
        window.localStorage.setItem("MobileAccessibility.usePreferredTextZoom", bool);
    }

    var callback = function(){
        // Wrapping updateTextZoom call in a function to stop
        // the event parameter propagation. This fixes an error
        // on resume where cordova tried to call apply() on the
        // event, expecting a function.
        mobileAccessibility.updateTextZoom();
    };

    document.removeEventListener("resume", callback);

    if (bool) {
        // console.log("We should update the text zoom at this point: " + bool)
        document.addEventListener("resume", callback, false);
        mobileAccessibility.updateTextZoom();
    } else {
        mobileAccessibility.setTextZoom(100);
    }

    return Boolean(bool);
};

MobileAccessibility.prototype.MobileAccessibilityNotifications = MobileAccessibilityNotifications;

/**
 * Callback from native MobileAccessibility returning an object which describes the status of MobileAccessibility features.
 *
 * @param {Object} info
 * @config {Boolean} [isBoldTextEnabled] Boolean to indicate bold text status (ios).
 * @config {Boolean} [isClosedCaptioningEnabled] Boolean to indicate closed captioning status.
 * @config {Boolean} [isDarkerSystemColorsEnabled] Boolean to indicate darker system colors status (ios).
 * @config {Boolean} [isGrayscaleEnabled] Boolean to indicate grayscale status (ios).
 * @config {Boolean} [isGuidedAccessEnabled] Boolean to indicate guided access status (ios).
 * @config {Boolean} [isInvertColorsEnabled] Boolean to indicate invert colors status (ios).
 * @config {Boolean} [isMonoAudioEnabled] Boolean to indicate mono audio status (ios).
 * @config {Boolean} [isReduceMotionEnabled] Boolean to indicate reduce motion status (ios).
 * @config {Boolean} [isReduceTransparencyEnabled] Boolean to indicate reduce transparency status (ios).
 * @config {Boolean} [isScreenReaderRunning] Boolean to indicate screen reader status.
 * @config {Boolean} [isSpeakScreenEnabled] Boolean to indicate speak screen status (ios).
 * @config {Boolean} [isSpeakSelectionEnabled] Boolean to indicate speak selection status (ios).
 * @config {Boolean} [isSwitchControlRunning] Boolean to indicate switch control status (ios).
 * @config {Boolean} [isTouchExplorationEnabled] Boolean to indicate touch exploration status (android).
 */
MobileAccessibility.prototype._status = function(info) {
    if (info) {
        if (mobileAccessibility._isBoldTextEnabled !== info.isBoldTextEnabled) {
            mobileAccessibility._isBoldTextEnabled = info.isBoldTextEnabled;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.BOLD_TEXT_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isClosedCaptioningEnabled !== info.isClosedCaptioningEnabled) {
            mobileAccessibility._isClosedCaptioningEnabled = info.isClosedCaptioningEnabled;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.CLOSED_CAPTIONING_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isDarkerSystemColorsEnabled !== info.isDarkerSystemColorsEnabled) {
            mobileAccessibility._isDarkerSystemColorsEnabled = info.isDarkerSystemColorsEnabled;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.DARKER_SYSTEM_COLORS_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isGrayscaleEnabled !== info.isGrayscaleEnabled) {
            mobileAccessibility._isGrayscaleEnabled = info.isGrayscaleEnabled;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.GRAYSCALE_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isGuidedAccessEnabled !== info.isGuidedAccessEnabled) {
            mobileAccessibility._isGuidedAccessEnabled = info.isGuidedAccessEnabled;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.GUIDED_ACCESS_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isInvertColorsEnabled !== info.isInvertColorsEnabled) {
            mobileAccessibility._isInvertColorsEnabled = info.isInvertColorsEnabled;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.INVERT_COLORS_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isMonoAudioEnabled !== info.isMonoAudioEnabled) {
           mobileAccessibility._isMonoAudioEnabled = info.isMonoAudioEnabled;
           cordova.fireWindowEvent(MobileAccessibilityNotifications.MONO_AUDIO_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isReduceMotionEnabled !== info.isReduceMotionEnabled) {
           mobileAccessibility._isReduceMotionEnabled = info.isReduceMotionEnabled;
           cordova.fireWindowEvent(MobileAccessibilityNotifications.REDUCE_MOTION_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isReduceTransparencyEnabled !== info.isReduceTransparencyEnabled) {
           mobileAccessibility._isReduceTransparencyEnabled = info.isReduceTransparencyEnabled;
           cordova.fireWindowEvent(MobileAccessibilityNotifications.REDUCE_TRANSPARENCY_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isScreenReaderRunning !== info.isScreenReaderRunning) {
            mobileAccessibility._isScreenReaderRunning = info.isScreenReaderRunning;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.SCREEN_READER_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isSpeakScreenEnabled !== info.isSpeakScreenEnabled) {
           mobileAccessibility._isSpeakScreenEnabled = info.isSpeakScreenEnabled;
           cordova.fireWindowEvent(MobileAccessibilityNotifications.SPEAK_SCREEN_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isSpeakSelectionEnabled !== info.isSpeakSelectionEnabled) {
           mobileAccessibility._isSpeakSelectionEnabled = info.isSpeakSelectionEnabled;
           cordova.fireWindowEvent(MobileAccessibilityNotifications.SPEAK_SELECTION_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isSwitchControlRunning !== info.isSwitchControlRunning) {
           mobileAccessibility._isSwitchControlRunning = info.isSwitchControlRunning;
           cordova.fireWindowEvent(MobileAccessibilityNotifications.SWITCH_CONTROL_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isTouchExplorationEnabled !== info.isTouchExplorationEnabled) {
            mobileAccessibility._isTouchExplorationEnabled = info.isTouchExplorationEnabled;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.TOUCH_EXPLORATION_STATUS_CHANGED, info);
        }
        if (mobileAccessibility._isHighContrastEnabled !== info.isHighContrastEnabled) {
            mobileAccessibility._isHighContrastEnabled = info.isHighContrastEnabled;
            mobileAccessibility._highContrastScheme = info.highContrastScheme;
            cordova.fireWindowEvent(MobileAccessibilityNotifications.HIGH_CONTRAST_CHANGED, info);
        }
    }
};

/**
 * Error callback for MobileAccessibility start
 */
MobileAccessibility.prototype._error = function(e) {
    console.log("Error initializing MobileAccessibility: " + e);
};

var mobileAccessibility = new MobileAccessibility();

module.exports = mobileAccessibility;
