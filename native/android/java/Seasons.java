package com.pedrofener.farmdays;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * Estações do hemisfério sul (mesma lógica de www/js/seasons.js).
 * Equinócios/solstícios pelo algoritmo de Jean Meeus, convertidos para a data local.
 */
public final class Seasons {

    private static final double[][] TERMS = {
            {485, 324.96, 1934.136}, {203, 337.23, 32964.467}, {199, 342.08, 20.186},
            {182, 27.85, 445267.112}, {156, 73.14, 45036.886}, {136, 171.52, 22518.443},
            {77, 222.54, 65928.934}, {74, 296.72, 3034.906}, {70, 243.58, 9037.513},
            {58, 119.81, 33718.147}, {52, 297.17, 150.678}, {50, 21.02, 2281.226},
            {45, 247.54, 29929.562}, {44, 325.15, 31555.956}, {29, 60.93, 4443.417},
            {18, 155.12, 67555.328}, {17, 288.79, 4562.452}, {16, 198.04, 62894.029},
            {14, 199.76, 31436.921}, {12, 95.39, 14577.848}, {12, 287.11, 31931.756},
            {12, 320.81, 34777.259}, {9, 227.73, 1222.114}, {8, 15.45, 16859.074},
    };

    /** Índice 0..3 = início de Outono, Inverno, Primavera, Verão (hemisfério sul). */
    public static final String[] NAMES = {"Outono", "Inverno", "Primavera", "Verão"};

    private Seasons() { }

    /** Instante (ms UTC) do evento: which 0=março, 1=junho, 2=setembro, 3=dezembro. */
    static long eventMillis(int year, int which) {
        double y = (year - 2000) / 1000.0;
        double y2 = y * y, y3 = y2 * y, y4 = y3 * y;
        double jde0;
        switch (which) {
            case 0: jde0 = 2451623.80984 + 365242.37404 * y + 0.05169 * y2 - 0.00411 * y3 - 0.00057 * y4; break;
            case 1: jde0 = 2451716.56767 + 365241.62603 * y + 0.00325 * y2 + 0.00888 * y3 - 0.00030 * y4; break;
            case 2: jde0 = 2451810.21715 + 365242.01767 * y - 0.11575 * y2 + 0.00337 * y3 + 0.00078 * y4; break;
            default: jde0 = 2451900.05952 + 365242.74049 * y - 0.06223 * y2 - 0.00823 * y3 + 0.00032 * y4;
        }
        double t = (jde0 - 2451545.0) / 36525.0;
        double w = Math.toRadians(35999.373 * t - 2.47);
        double dl = 1 + 0.0334 * Math.cos(w) + 0.0007 * Math.cos(2 * w);
        double s = 0;
        for (double[] term : TERMS) s += term[0] * Math.cos(Math.toRadians(term[1] + term[2] * t));
        double jde = jde0 + (0.00001 * s) / dl - 69.0 / 86400.0;
        return Math.round((jde - 2440587.5) * 86400000.0);
    }

    /** Dia do ano local em que a estação começa. */
    private static int startDayOfYear(int year, int which, TimeZone tz) {
        Calendar c = Calendar.getInstance(tz);
        c.setTimeInMillis(eventMillis(year, which));
        if (c.get(Calendar.YEAR) != year) return which == 0 ? 0 : 400;
        return c.get(Calendar.DAY_OF_YEAR);
    }

    public static int seasonIndex(Calendar date) {
        int year = date.get(Calendar.YEAR);
        int doy = date.get(Calendar.DAY_OF_YEAR);
        TimeZone tz = date.getTimeZone();
        int idx = 3; // antes do equinócio de março: Verão
        for (int i = 0; i < 4; i++) {
            if (doy >= startDayOfYear(year, i, tz)) idx = i;
        }
        return idx;
    }

    public static String seasonName(Calendar date) {
        return NAMES[seasonIndex(date)];
    }
}
