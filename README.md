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

İkinci yüklenen 874 sayfalık PDF'nin 9 dahiliye dersinden **121 bilgi odaklı kart, 69 konu başlığı** seçilmiştir. Kitabın kalın yazıları, spot kutuları, tabloları ve `en sık / en önemli` vurguları esas alınmıştır. Her cümle ve gizlenen bilgi `data/editorial_cards.tsv` dosyasında açıkça yazılıdır. En uzun sözcüğü gizleyen eski otomatik yöntem kaldırılmıştır. Cevap tarafında önce bilgi, ardından tamamlanmış cümle gösterilir.

Uzman onaylı değildir; tüm önemli bilgileri kapsadığı iddia edilmez. Karttaki sayfa PDF'nin fiziksel sayfa sırasıdır. İlk PDF 32 MiB aktarım sınırı nedeniyle işlenemedi. Tüm tıp dersleri henüz mevcut değildir. Eski kartların öğrenme durumu yeni ve farklı kartlara aktarılmaz; önceki kayıtlar tarayıcıda korunur, sayaçlarda yalnızca mevcut kartlar sayılır.

Editoryal kayıtlardan kartları yeniden üretmek için:

```sh
python3 scripts/build_cards.py
```

Aynı kaynak PDF verilirse gizlenen her cevabın belirtilen sayfada bulunduğu da kontrol edilir (Poppler `pdftotext` gerekir). Bu kontrol tıbbi uzman incelemesinin yerini tutmaz:

```sh
python3 scripts/build_cards.py /path/to/source.pdf
```

Kontroller: `python3 -m unittest discover -s tests` ve `node --check app.js`. Tek dosyalık sürüm için içerik değişikliğinden sonra `python3 scripts/package_app.py` çalıştırın.

Kaynak PDF ve kişisel filigranlar depoya eklenmemiştir. Tıbbi içerik uzman incelemesi gerektirir. İnternet olmadan temel sistem yazı tipleriyle çalışır; Google Fonts yalnızca görünüm içindir.
