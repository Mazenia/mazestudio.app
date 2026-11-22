---
title: "Why your Android alarm or reminder doesn't go off on time (and how to fix it by brand)"
seoTitle: "Android alarm not going off on time: fixes by brand"
description: "Battery optimization can delay or silence alarms and reminders on Android. What causes it, and the fix for Samsung, Xiaomi, OnePlus, Huawei and Pixel."
date: 2026-11-21
app: tolli
translation: la-alarma-no-suena-a-tiempo-android
---

You set a reminder for 10:45 and it shows up at 10:52. Or a timer app that worked all morning goes silent after lunch. On Android this is rarely a bug in the app. Most of the time the phone is saving battery by putting apps to sleep, and the reminder has to wait until something wakes them up.

The clock app that came with your phone is usually treated as an exception. Reminder apps, timers, medication alarms and interval bells from the Play Store are not, so they are the ones that arrive late or never. Three settings are behind almost every case.

## 1. Battery optimization

When the screen has been off for a while, Android groups background work into batches to save power. An app under battery optimization can be held until the next batch, which can be several minutes away. Some brands go further and close apps they think you are not using.

The fix is to mark the app as unrestricted. Menu names change a little between versions, but the path is close to this:

- **Samsung:** Settings › Battery › Background usage limits › Never sleeping apps › add the app.
- **Xiaomi, Redmi and POCO:** Settings › Apps › Manage apps › the app › Battery saver › No restrictions. Turn on Autostart too.
- **OnePlus:** Settings › Battery › Battery optimization › the app › Don't optimize.
- **Huawei and Honor:** Settings › Battery › App launch › the app › Manage manually, and turn on all three switches.
- **Pixel:** Settings › Apps › the app › App battery usage › Allow background usage › Unrestricted.
- **Other phones:** Settings › Apps › the app › Battery › Unrestricted.

If your brand isn't listed, the site [dontkillmyapp.com](https://dontkillmyapp.com/) keeps step-by-step guides for most manufacturers.

## 2. Alarms and reminders permission

Since Android 12, an app needs a special permission to ring at an exact minute. Without it, Android may move the alarm a few minutes to fit its own schedule. On newer versions this permission is often off by default for apps you install yourself.

You can check it in Settings › Apps › Special app access › Alarms & reminders. The app you rely on should be allowed. On some phones the same switch appears inside the app's own settings page.

## 3. Do Not Disturb and volume

Do Not Disturb can let alarms through or block them, depending on how it is set up. Open Settings › Sound (or Notifications) › Do Not Disturb and check that alarms are allowed. Also check which volume the app uses. Many reminder apps follow the notification volume, so they stay silent when the ringer is down. Apps that use the alarm volume keep ringing.

## A quick test

After changing the settings, set a reminder for five minutes from now, lock the phone and leave it on the table. If it arrives on the minute, you are done. If it is still late, restart the phone once and repeat the test, because some brands only apply the change after a restart.

## How Tolli handles it

[Tolli](/tolli/) is a little bell for Android that dings every 10, 15, 30 or 60 minutes. Because a late ding is useless, it uses exact alarms and the alarm volume, and it checks these settings for you. If battery saving or Do Not Disturb could silence it, Tolli shows a warning with the steps for your phone's brand, the same ones listed above. It is free, with no account and no ads.

If you want to know why a chime every 15 or 30 minutes helps in the first place, read [the 15-minute rule](/blog/15-minute-rule/) or [why hearing the time helps you keep track of it](/blog/hourly-chime-app/).
