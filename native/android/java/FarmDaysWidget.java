package com.pedrofener.farmdays;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.widget.RemoteViews;

import java.util.Calendar;

/**
 * Widget nativo da tela inicial (Android AppWidget).
 *
 * Atualização automática da data:
 *  - alarme na próxima meia-noite local (reagendado a cada atualização);
 *  - TIME_SET / TIMEZONE_CHANGED / DATE_CHANGED / LOCALE_CHANGED;
 *  - updatePeriodMillis (30 min) como garantia extra caso o sistema atrase o alarme.
 */
public class FarmDaysWidget extends AppWidgetProvider {

    public static final String ACTION_MIDNIGHT = "com.pedrofener.farmdays.WIDGET_MIDNIGHT";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
        scheduleMidnight(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle newOptions) {
        updateWidget(context, manager, id);
    }

    @Override
    public void onEnabled(Context context) {
        scheduleMidnight(context);
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(midnightIntent(context));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent != null ? intent.getAction() : null;
        if (action == null) return;
        if (ACTION_MIDNIGHT.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_DATE_CHANGED.equals(action)
                || Intent.ACTION_LOCALE_CHANGED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            updateAll(context);
        }
    }

    /** Atualiza todas as instâncias do widget. */
    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, FarmDaysWidget.class));
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
        scheduleMidnight(context);
    }

    static void updateWidget(Context context, AppWidgetManager manager, int id) {
        Calendar now = Calendar.getInstance();
        int scale = pickScale(context, manager, id);
        Bitmap bmp = WidgetRenderer.render(context, now, scale);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_farmdays);
        views.setImageViewBitmap(R.id.widget_image, bmp);

        int day = now.get(Calendar.DAY_OF_MONTH);
        String month = WidgetRenderer.MONTHS[now.get(Calendar.MONTH)];
        String season = Seasons.seasonName(now);
        views.setContentDescription(R.id.widget_image, day + " de " + month + ", " + season);

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(context, 0, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pi);
        }
        manager.updateAppWidget(id, views);
    }

    /** Escala inteira (nearest-neighbor) para o pixel art ficar nítido no tamanho do widget. */
    static int pickScale(Context context, AppWidgetManager manager, int id) {
        float density = context.getResources().getDisplayMetrics().density;
        int wDp = 160, hDp = 120;
        try {
            Bundle o = manager.getAppWidgetOptions(id);
            if (o != null) {
                int mw = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0);
                int mh = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
                if (mw > 0) wDp = mw;
                if (mh > 0) hDp = mh;
            }
        } catch (Exception ignored) { }
        int sw = (int) (wDp * density / WidgetRenderer.WIDTH);
        int sh = (int) (hDp * density / WidgetRenderer.HEIGHT);
        int s = Math.min(sw, sh);
        if (s < 3) s = 3;
        if (s > 12) s = 12;
        return s;
    }

    static PendingIntent midnightIntent(Context context) {
        Intent i = new Intent(context, FarmDaysWidget.class);
        i.setAction(ACTION_MIDNIGHT);
        return PendingIntent.getBroadcast(context, 0, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Agenda (sem permissão de alarme exato) um disparo logo após a próxima meia-noite local. */
    static void scheduleMidnight(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar next = Calendar.getInstance();
        next.add(Calendar.DAY_OF_MONTH, 1);
        next.set(Calendar.HOUR_OF_DAY, 0);
        next.set(Calendar.MINUTE, 0);
        next.set(Calendar.SECOND, 5);
        next.set(Calendar.MILLISECOND, 0);
        try {
            am.setAndAllowWhileIdle(AlarmManager.RTC, next.getTimeInMillis(), midnightIntent(context));
        } catch (Exception e) {
            am.set(AlarmManager.RTC, next.getTimeInMillis(), midnightIntent(context));
        }
    }
}
