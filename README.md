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

İkinci yüklenen 874 sayfalık PDF'nin 9 dahiliye dersinden **500 bilgi odaklı kart / 42 konu** seçilmiştir. Kitabın kalın yazıları, spot kutuları ve `en sık / en önemli` vurguları esas alınmıştır. `data/editorial_cards.tsv` beş sütun içerir: ders, PDF sayfası, konu, değiştirilmemiş kaynak cümlesi ({{cevap}} işaretiyle), bağımsız olarak anlaşılabilen soru. 500 sorunun her biri gözden geçirilmiş ve bağlamı cümle içine yazılmıştır; ayrı başlık eklenmez. “Bu sendrom”, “bu hastalar” ve “ilk tercih” gibi tek başına belirsiz alıntılarda hangi hastalık, ilaç, hasta grubu veya tedavi hedefinin sorulduğu belirtilir. Cevap tarafında önce gizlenen bilgi, ardından kaynak sayfadan aynen alınan cümle gösterilir. Kaynaktaki imla ve sözcükler değiştirilmez; yalnızca PDF satır boşlukları birleştirilir. Kaynak cümlesi ve bilgi hedefi değişmediğinden kart kimlikleri sabittir; bu soru düzenlemesi mevcut favori ve öğrenme kayıtlarını korur.

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

## Konu dağılımı ve araştırma durumu

`data/study_plan.json` klinik öncelikli geçici çalışma planını içerir. Diyabet, tiroid, pnömoni, üriner enfeksiyon, romatoid artrit, lupus, sepsis ve şok gibi konuların payı artırılmış; nadir genetik sendromlar azaltılmıştır. Bu rakamlar bilimsel prevalans ölçümü veya doğrulanmış TUS/YDUS sınav yüzdeleri değildir. Sınav kaynakları araştırması, dış ağ bağlantılarının 403 erişim engeli alması nedeniyle tamamlanmamıştır. Ortam ağ ayarlarına Google, Bing, TUSDATA, TUSEM ve TUSWORLD için izin taslağı kaydedilmiştir; taslak çalışan ortamda kendiliğinden etkinleşmez. Erişim etkinleşince kaynaklar okunmalı, dönem ve sınav türü ayrı kaydedilmeli, analiz doğrultusunda plan yeniden değerlendirilmelidir.

**Konu Dağılımı** sekmesi kart sayılarını doğrudan yüklenen içerikten hesaplar; her konu için kart sayısı, uygulamadaki toplam içindeki payı ve konuya geçiş gösterir. Sınav analizi doğrulanana kadar bu durum sayfada açıkça belirtilir. Kaynak araştırması yapılmış gibi bağlantı veya istatistik eklenmemiştir.

Ayrıntılı güncel sayılar: [KONU-DAGILIMI.md](KONU-DAGILIMI.md).

## Endokrinoloji soru denemesi

**Sorular** sekmesi `data/questions.json` içindeki 50 özgün, dört seçenekli soruyu sunar. Kullanıcının örnek PDF’sindeki klinik vaka ve bilgi yorumlama yaklaşımı incelenerek hazırlanmıştır; örnek sınavın soruları ve olası cevap hataları kopyalanmamıştır. Dağılım: diyabet 18, tiroid 16, adrenal 7, hipofiz 5, kalsiyum/kemik 4. Bu pilot dağılım sınav yüzdesi değildir. Açıklamalar kitabın ilgili fiziksel PDF sayfalarına bağlanan özgün özetlerdir; flashcard arka yüzlerindeki birebir kaynak alıntılarından farklıdır. Klinik uzman incelemesi yapılmamıştır.

Yanıt seçildikten sonra seçenekler kilitlenir ve doğru cevap, gerekçe, kaynak bağlantısı açılır. Konu, yanlış ve çözülmemiş soru filtreleri; soru numarasından geçiş ve tek soruyu yeniden çözme bulunur. Yanıtlar `tusspot-endo-quiz-v1`, konum/filtreler `tusspot-endo-quiz-place-v1` ile cihazın tarayıcısına kaydedilir. Flashcard ilerlemesi ayrı korunur. Tam deneme sıfırlama ikinci bir onay gerektirir. Kayıtlar cihazlar arasında senkronize değildir.
