# TUS Spot

Türkçe, telefona uyumlu ders ve konu bazlı bilgi kartları. Python 3 dışında çalışma bağımlılığı yoktur.

`TUS-Spot.html` kartları içinde barındıran tek dosyalık sürümdür. PDF okuyucu için ayrıca `library/dahiliye.pdf` dosyası gerekir. Yeniden oluşturmak için `python3 scripts/package_app.py` çalıştırın.

## Çalıştırma

```sh
cd /workspace/tus-spot
python3 -m http.server 3000 --bind 0.0.0.0
```

Kart çevirme, ders/konu arama, konu seçimi, favoriler ve tekrar listesi desteklenir. İlerleme aynı tarayıcının yerel depolamasında tutulur; hesaplar veya cihazlar arasında eşitlenmez. Tarayıcı verileri silinirse ilerleme kaybolur.

**PDF Kitap** sekmesi ikinci PDF'yi uygulama içinde açar; yeni sekmede açma seçeneği de vardır. Kartın kaynak sayfasına tıklanınca okuyucuya `#page=N` ile gidilir. Sayfa bağlantısını uygulama tarayıcının PDF görüntüleyicisine iletir; bu parçayı yorumlama desteği tarayıcıya bağlıdır. Uygulama, okuyucu açılmadan PDF'yi indirmez.

## İçerik

İkinci yüklenen 874 sayfalık PDF'nin 9 dahiliye dersinden **300 bilgi odaklı kart** seçilmiştir. Kitabın kalın yazıları, spot kutuları ve `en sık / en önemli` vurguları esas alınmıştır. Her cümle ve gizlenen bilgi `data/editorial_cards.tsv` dosyasında açıkça yazılıdır. Cümleler kaynak sayfalardan aynen alınır; yalnızca PDF satır boşlukları birleştirilir. Kaynaktaki imla ve sözcükler değiştirilmez; “kitapta belirtilen” gibi açıklamalar eklenmez. Kartta ek konu açıklaması gösterilmez. Cevap tarafında önce gizlenen bilgi, ardından tamamlanmış kaynak cümlesi gösterilir.

Uzman onaylı değildir; tüm önemli bilgileri kapsadığı iddia edilmez. Karttaki sayfa PDF'nin fiziksel sayfa sırasıdır. İlk PDF 32 MiB aktarım sınırı nedeniyle işlenemedi. Tüm tıp dersleri henüz mevcut değildir. Eski kartların öğrenme durumu yeni ve farklı kartlara aktarılmaz; önceki kayıtlar tarayıcıda korunur, sayaçlarda yalnızca mevcut kartlar sayılır.

Editoryal kayıtlardan kartları yeniden üretmek için:

```sh
python3 scripts/build_cards.py
```

Aynı kaynak PDF verilirse yalnızca cevap değil, **tamamlanmış cümlenin bütünü** belirtilen sayfada aranır (Poppler `pdftotext` gerekir). Bu kontrol büyük/küçük harfi, Türkçe karakterleri ve noktalama işaretlerini korur; sadece PDF satır/boşluk farklılıklarını yok sayar. Tıbbi uzman incelemesinin yerini tutmaz:

```sh
python3 scripts/build_cards.py /path/to/source.pdf
```

Kontroller: `python3 -m unittest discover -s tests` ve `node --check app.js`. Tek dosyalık sürüm için içerik değişikliğinden sonra `python3 scripts/package_app.py` çalıştırın.

Kullanıcının isteğiyle ikinci kaynak PDF değiştirilmeden `library/dahiliye.pdf` olarak eklenmiştir. İlk PDF aktarım sınırı nedeniyle mevcut değildir. Tıbbi içerik uzman incelemesi gerektirir. Google Fonts yalnızca görünüm içindir.
