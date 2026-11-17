package com.pedrofener.farmdays;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;

import java.util.Calendar;

/**
 * Desenha o widget em pixel art:
 *  - modelo (placa de madeira, painel verde, faixa do mês, faixa da estação) gerado
 *    por tools/build_assets.py em res/drawable-nodpi/widget_template.png (76x56 px);
 *  - textos com a fonte pixel original FarmPixel (assets/public/fonts), sem antialias;
 *  - ampliação inteira sem filtro (nearest-neighbor) para ficar nítido.
 * As caixas abaixo precisam bater com DAY_BOX/MONTH_BOX/SEASON_BOX do build_assets.py.
 */
public final class WidgetRenderer {

    public static final int WIDTH = 76;
    public static final int HEIGHT = 56;

    private static final int[] DAY_BOX = {5, 5, 70, 25};
    private static final int[] MONTH_BOX = {5, 28, 70, 38};
    private static final int[] SEASON_BOX = {5, 41, 70, 50};

    public static final String[] MONTHS = {
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    };

    private static Typeface font;

    private WidgetRenderer() { }

    private static Typeface font(Context context) {
        if (font == null) {
            try {
                font = Typeface.createFromAsset(context.getAssets(), "public/fonts/FarmPixel-Bold.ttf");
            } catch (Exception e) {
                font = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD);
            }
        }
        return font;
    }

    public static Bitmap render(Context context, Calendar now, int scale) {
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inScaled = false;
        Bitmap base = BitmapFactory.decodeResource(context.getResources(), R.drawable.widget_template, opts);
        Bitmap bmp = base.copy(Bitmap.Config.ARGB_8888, true);
        Canvas c = new Canvas(bmp);

        Paint p = new Paint();
        p.setAntiAlias(false);
        p.setFilterBitmap(false);
        p.setSubpixelText(false);
        p.setTypeface(font(context));

        String day = String.valueOf(now.get(Calendar.DAY_OF_MONTH));
        String month = MONTHS[now.get(Calendar.MONTH)];
        String season = Seasons.seasonName(now);

        drawCentered(c, p, day, DAY_BOX, 2, 0xFFFFF4C8, 0xFF1F4A14, 0);
        drawCentered(c, p, month, MONTH_BOX, 1, 0xFFFFF0C8, 0xFF5B2A10, 0);
        int end = drawCentered(c, p, season, SEASON_BOX, 1, 0xFFFFF4C8, 0xFF1F4A14, 7);

        Bitmap flower = BitmapFactory.decodeResource(context.getResources(), R.drawable.widget_flower, opts);
        if (flower != null) {
            int fy = SEASON_BOX[1] + (SEASON_BOX[3] - SEASON_BOX[1] + 1 - flower.getHeight()) / 2;
            c.drawBitmap(flower, end - flower.getWidth(), fy, p);
        }

        Bitmap out = Bitmap.createScaledBitmap(bmp, WIDTH * scale, HEIGHT * scale, false);
        if (out != bmp) bmp.recycle();
        return out;
    }

    /**
     * Texto centralizado na caixa com sombra de 1 px.
     * mult = tamanho do pixel da fonte (1 => 11 px, 2 => 22 px).
     * extra = espaço reservado à direita (ex.: florzinha). Retorna o x final.
     */
    private static int drawCentered(Canvas c, Paint p, String text, int[] box, int mult,
                                    int fill, int shadow, int extra) {
        p.setTextSize(11f * mult);
        int w = Math.round(p.measureText(text)) - mult + extra; // remove o espaçamento final
        int bw = box[2] - box[0] + 1;
        int bh = box[3] - box[1] + 1;
        int capH = 7 * mult;
        int x = box[0] + (bw - w) / 2;
        int baseline = box[1] + (bh - capH) / 2 + capH;
        p.setColor(shadow);
        c.drawText(text, x + 1, baseline + 1, p);
        p.setColor(fill);
        c.drawText(text, x, baseline, p);
        return x + w;
    }
}
