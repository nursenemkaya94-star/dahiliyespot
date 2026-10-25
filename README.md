# TUS Spot

Türkçe, telefona uyumlu ders ve konu bazlı bilgi kartları. Python 3 dışında çalışma bağımlılığı yoktur.

`TUS-Spot.html` doğrudan tarayıcıda açılabilen, internet ve kurulum gerektirmeyen tek dosyalık sürümdür. Yeniden oluşturmak için `python3 scripts/package_app.py` çalıştırın.

## Çalıştırma

```sh
cd /workspace/tus-spot
python3 -m http.server 3000 --bind 0.0.0.0
```

Kart çevirme, ders/konu arama, konu seçimi, favoriler ve tekrar listesi desteklenir. İlerleme aynı tarayıcının yerel depolamasında tutulur; hesaplar veya cihazlar arasında eşitlenmez. Tarayıcı verileri silinirse ilerleme kaybolur.

## İçerik

İkinci yüklenen 874 sayfalık PDF'den 9 dahiliye dersi çıkarılmıştır. Kartlar `en sık`, `tanı`, `karakteristik` gibi ifadeler içeren paragrafların otomatik seçimine dayanır. Uzman onaylı değildir; tüm önemli bilgileri kapsadığı iddia edilmez. Karttaki sayfa PDF'nin fiziksel sayfa sırasıdır. İlk PDF 32 MiB aktarım sınırı nedeniyle işlenemedi. Tüm tıp dersleri henüz mevcut değildir.

Kartları aynı kaynak PDF'den yeniden üretmek için (Poppler `pdftotext` gerekir):

```sh
python3 scripts/build_cards.py /path/to/source.pdf
```

Kaynak PDF ve kişisel filigranlar depoya eklenmemiştir. Otomatik seçim ve tıbbi içerik insan incelemesi gerektirir. İnternet olmadan temel sistem yazı tipleriyle çalışır; Google Fonts yalnızca görünüm içindir.
