# TUS Spot

Türkçe, telefona uyumlu ders ve konu bazlı bilgi kartları. Python 3 dışında çalışma bağımlılığı yoktur.

`TUS-Spot.html` kartları içinde barındıran tek dosyalık sürümdür. PDF okuyucu için `library/`, `vendor/pdfjs/`, `pdf-viewer.html` ve `pdf-viewer.js` dosyaları gerekir; PDF görüntüleme HTTP üzerinden yapılır. Yeniden oluşturmak için `python3 scripts/package_app.py` çalıştırın.

## Çalıştırma

```sh
cd /workspace/tus-spot
python3 -m http.server 3000 --bind 0.0.0.0
```

Kart çevirme, ders/konu arama, konu seçimi, favoriler ve tekrar listesi desteklenir. İlerleme aynı tarayıcının yerel depolamasında tutulur; hesaplar veya cihazlar arasında eşitlenmez. Tarayıcı verileri silinirse ilerleme kaybolur.

**PDF Kitap** sekmesi her iki kitabı uygulama içinde açar; yeni sekmede açma seçeneği de vardır. Kartın kaynak bağlantısı yerel PDF.js okuyucusuna dosya yolunu ve PDF içindeki fiziksel sayfa sırasını iletir. Okuyucu seçilen sayfayı doğrudan çizer; aynı dosyada başka sayfaya geçiş de yeniden çizilir. Böylece tarayıcının yerleşik PDF görüntüleyicisinin `#page` desteğine bağlı kalınmaz. İlk kitapta basılı kitap sayfası ile parça içindeki sayfa ayrı gösterilir. Eski mobil tarayıcılara uyumlu PDF.js 5.4.624 legacy derlemesi ve Apache-2.0 lisansı `vendor/pdfjs/` altında saklanır; CDN gerekmez. Uygulama, okuyucu açılmadan PDF'yi indirmez.

## İçerik

İkinci yüklenen 874 sayfalık PDF'nin 9 dahiliye dersinden **500 bilgi odaklı kart / 42 konu** seçilmiştir. Kitabın kalın yazıları, spot kutuları ve `en sık / en önemli` vurguları esas alınmıştır. `data/editorial_cards.tsv` beş sütun içerir: ders, PDF sayfası, konu, değiştirilmemiş kaynak cümlesi ({{cevap}} işaretiyle), bağımsız olarak anlaşılabilen soru. 500 sorunun her biri gözden geçirilmiş ve bağlamı cümle içine yazılmıştır; ayrı başlık eklenmez. “Bu sendrom”, “bu hastalar” ve “ilk tercih” gibi tek başına belirsiz alıntılarda hangi hastalık, ilaç, hasta grubu veya tedavi hedefinin sorulduğu belirtilir. Cevap tarafında önce gizlenen bilgi, ardından kaynak sayfadan aynen alınan cümle gösterilir. Kaynaktaki imla ve sözcükler değiştirilmez; yalnızca PDF satır boşlukları birleştirilir. Kaynak cümlesi ve bilgi hedefi değişmediğinden kart kimlikleri sabittir; bu soru düzenlemesi mevcut favori ve öğrenme kayıtlarını korur.

Uzman onaylı değildir; tüm önemli bilgileri kapsadığı iddia edilmez. Karttaki sayfa PDF'nin fiziksel sayfa sırasıdır. İlk kitap küçük parçalara bölünerek 658 sayfanın tamamı alınmıştır. Tüm tıp dersleri henüz mevcut değildir. Eski kartların öğrenme durumu yeni ve farklı kartlara aktarılmaz; önceki kayıtlar tarayıcıda korunur, sayaçlarda yalnızca mevcut kartlar sayılır.

Editoryal kayıtlardan kartları yeniden üretmek için:

```sh
python3 scripts/build_cards.py
```

Aynı kaynak PDF verilirse yalnızca cevap değil, **tamamlanmış cümlenin bütünü** belirtilen sayfada aranır (Poppler `pdftotext` gerekir). Bu kontrol büyük/küçük harfi, Türkçe karakterleri ve noktalama işaretlerini korur; sadece PDF satır/boşluk farklılıklarını yok sayar. Tıbbi uzman incelemesinin yerini tutmaz:

```sh
python3 scripts/build_cards.py /path/to/source.pdf
```

Kontroller: `python3 -m unittest discover -s tests`, `node --test tests/test_pdf_navigation.cjs`, `node --check app.js` ve `node --check pdf-viewer.js`. Tek dosyalık sürüm için içerik değişikliğinden sonra `python3 scripts/package_app.py` çalıştırın.

Kullanıcının isteğiyle ikinci kaynak PDF değiştirilmeden `library/dahiliye.pdf` olarak eklenmiştir. İlk kitap beş kaynak parçasıyla eksiksiz eklenmiştir. Tıbbi içerik uzman incelemesi gerektirir. Google Fonts yalnızca görünüm içindir.

## Konu dağılımı ve araştırma durumu

`data/study_plan.json` klinik öncelikli geçici çalışma planını içerir. Diyabet, tiroid, pnömoni, üriner enfeksiyon, romatoid artrit, lupus, sepsis ve şok gibi konuların payı artırılmış; nadir genetik sendromlar azaltılmıştır. Bu rakamlar bilimsel prevalans ölçümü veya doğrulanmış TUS/YDUS sınav yüzdeleri değildir. Sınav kaynakları araştırması, dış ağ bağlantılarının 403 erişim engeli alması nedeniyle tamamlanmamıştır. Ortam ağ ayarlarına Google, Bing, TUSDATA, TUSEM ve TUSWORLD için izin taslağı kaydedilmiştir; taslak çalışan ortamda kendiliğinden etkinleşmez. Erişim etkinleşince kaynaklar okunmalı, dönem ve sınav türü ayrı kaydedilmeli, analiz doğrultusunda plan yeniden değerlendirilmelidir.

**Konu Dağılımı** sekmesi kart sayılarını doğrudan yüklenen içerikten hesaplar; her konu için kart sayısı, uygulamadaki toplam içindeki payı ve konuya geçiş gösterir. Sınav analizi doğrulanana kadar bu durum sayfada açıkça belirtilir. Kaynak araştırması yapılmış gibi bağlantı veya istatistik eklenmemiştir.

Ayrıntılı güncel sayılar: [KONU-DAGILIMI.md](KONU-DAGILIMI.md).

## Endokrinoloji soru denemesi

**Sorular** sekmesi `data/questions.json` içindeki 50 özgün, dört seçenekli soruyu sunar. Kullanıcının örnek PDF’sindeki klinik vaka ve bilgi yorumlama yaklaşımı incelenerek hazırlanmıştır; örnek sınavın soruları ve olası cevap hataları kopyalanmamıştır. Dağılım: diyabet 18, tiroid 16, adrenal 7, hipofiz 5, kalsiyum/kemik 4. Bu pilot dağılım sınav yüzdesi değildir. Açıklamalar kitabın ilgili fiziksel PDF sayfalarına bağlanan özgün özetlerdir; flashcard arka yüzlerindeki birebir kaynak alıntılarından farklıdır. Klinik uzman incelemesi yapılmamıştır.

Yanıt seçildikten sonra seçenekler kilitlenir ve doğru cevap, gerekçe, kaynak bağlantısı açılır. Konu, yanlış ve çözülmemiş soru filtreleri; soru numarasından geçiş ve tek soruyu yeniden çözme bulunur. Yanıtlar `tusspot-endo-quiz-v1`, konum/filtreler `tusspot-endo-quiz-place-v1` ile cihazın tarayıcısına kaydedilir. Flashcard ilerlemesi ayrı korunur. Tam deneme sıfırlama ikinci bir onay gerektirir. Kayıtlar cihazlar arasında senkronize değildir.

## İlk kitabın tamamı ve sayfa denetimi

Son yüklenen 11 dosyanın tamamı alındı. Dosya adlarına güvenilmeden içerikteki basılı sayfa numaraları kontrol edildi. Önceden alınan 1–140 ile birlikte bütün **1–658** aralığı tamamlandı; eksik veya yinelenen sayfa yok. Bölüm başlangıçlarında basılı numara olmayan sayfalar bölüm başlığı ve komşu sayfalarla doğrulandı. Üretilen dosyaların 658 sayfasının metni orijinal yüklemelerle birebir karşılaştırıldı. Parçaların birleştirilmesinde sayfalar yeniden çizilmedi; PDF sayfaları korunup dosya nesneleri sıkıştırıldı.

`data/first_volume_files.json` yüklenen dosyaların içerikten doğrulanmış başlangıç/bitiş sayfalarını kaydeder. `library/dahiliye-ilk-parca1.pdf` … `parca5.pdf` kaynak aralıkları sırasıyla **1–140, 141–280, 281–420, 421–560, 561–658**. PDF sekmesi her parçayı ayrı açarak gereksiz büyük tek dosya indirilmesini önler. Sayfa kutusu parçanın içindeki fiziksel sırayı kullanır; kartta basılı kitap sayfası ve parça sayfası birlikte gösterilir. İlk 140 sayfadan önce eklenen kartlarda kitap ve parça sayfası aynıdır.

İlk kitap için toplam **565 kart**: Nefroloji 170, Gastroenteroloji 100, Hepatoloji 100, Kardiyoloji 50, Göğüs Hastalıkları 45 ve Hematoloji 100. İkinci kitap 545 kart içerir; Onkoloji 100 karttır. Toplam **15 ders / 1.110 flashcard** vardır. Klinik ağırlıklandırma güncellemesinde 280 yeni kart eklenmiş, kardiyolojiden 30 kart aktif setten arşivlenmiş ve diğer 720 kartın kimlikleri, soruları ve kaynak bilgileri aynen korunmuştur. Arşivlenen kartların tarayıcı kayıtları silinmez; aktif sayaç ve koleksiyonlarda mevcut kartlar sayılır. Önemli konular seçilmiştir; PDF sayfalarının tam olması, tüm bilgilerin kartlaştırıldığı anlamına gelmez. Ağırlık klinik önceliklere dayalıdır; doğrulanmış sınav dağılımı değildir.

`data/editorial_first_part.tsv` ilk 90 kartı, `data/editorial_first_rest.tsv` sonraki 160 kartı saklar. `data/first_volume_plan.json` ilk kitabın ders/konu hedeflerini içerir. `scripts/build_cards.py` ikinci kitabın 500 kartını, `scripts/first_part_cards.py` ilk 90 kartı ve `scripts/first_volume_cards.py` kalan 160 kartı üretir. İlk kitabın bütün kaynak alıntıları her derlemede beş yerel PDF ile denetlenir. İkinci kitabı da denetlemek için `python3 scripts/build_cards.py library/dahiliye.pdf` kullanılır.

Yeni kartların `source` alanı doğru parçayı, `page` alanı o parçanın fiziksel sayfasını, `book_page` alanı basılı ilk kitap sayfasını belirtir. Önceki kartların kaynak varsayımları ve kimlikleri korunur. `data/study_plan.json` ikinci kitabın 500 kartlık planını korur; üretilen `cards.json` birleşik planı ve PDF kaynak haritasını içerir.

## Temel klinik plan ve hematoloji-onkoloji genişletmesi

`data/clinical_1000_plan.json` son ders/konu hedeflerini ve arşivlenen 30 kardiyoloji kartının kimliklerini içerir. `data/editorial_clinical_1000.tsv` 280 yeni bilgi hedefini, özgün kaynak alıntısını ve bağımsız bağlamı olan soruyu saklar. `scripts/clinical_1000_cards.py`, önceki 750 kartın üretimi sonrası 30 kardiyoloji kartını aktif setten çıkarıp 280 kartı ekler. Önceki TSV ve plan dosyaları kaynak/kimlik sürekliliği için korunur; temel dağılım `clinical_1000_plan.json`, son birleşik dağılım `cards.json` ve `KONU-DAGILIMI.md` içindedir. Temel derleme her kitap için 500 kartı doğrular; ardından hematolojiye 65 ve onkolojiye 45 kaynak denetimli kart eklenerek son kitap sayıları 565 ve 545 olur.

Öncelik servis ve poliklinikte önemli klinik kararlaradır: nefrolojide ABH, KBH, sıvı-elektrolit ve asit-baz bozuklukları, proteinüri ve diyaliz; gastroenterolojide reflü, disfaji, kanama, ülser, ishal/kabızlık, IBS, İBH, malabsorpsiyon ve pankreatobiliyer hastalıklar; hepatolojide viral hepatitler, yağlı karaciğer, test yorumlama ve siroz komplikasyonları. Kardiyolojide sık karşılaşılan kalp yetmezliği, AKS, hipertansiyon ve önemli aritmiler korunur. Dağılım ölçülmüş yatış veya başvuru sıklığı, prevalans ya da doğrulanmış TUS/YDUS yüzdesi değildir.

Konu Dağılımı sekmesi her kitap için sayıyı ayrı hesaplar ve ilk kitabın derslerinde klinik odağı açıklar. Endokrinoloji soru denemesi ayrı olarak 50 çoktan seçmeli soru içerir; 1.110 sayısı yalnızca flashcardları ifade eder.


`data/editorial_hemato_onco.tsv` son 110 kartın kaynak cümlelerini, gizlenen bilgi hedeflerini ve sorularını saklar. `scripts/hemato_onco_cards.py`, temel 1.000 karttan sonra çalışarak hematoloji ve onkolojiyi ayrı ayrı 100 karta tamamlar; diğer dersler ve önceki 1.000 kartın kimlikleri/içeriği korunur. Her yeni alıntı kendi PDF sayfasıyla otomatik karşılaştırılır. Yeni toplam 1.110 karttır. Kaynak metin denetimi klinik uzman incelemesi değildir.

PDF mobil uyumluluk kontrolü: HTTP sunucusu açıkken `node tests/check_pdf_mobile.cjs` (Playwright ve Chromium gerekir; `CHROMIUM_PATH` ve `TUSSPOT_BASE_URL` ile yollar değiştirilebilir). Test, eski tarayıcılarda bulunmayan `Promise.withResolvers` ve `URL.parse` özelliklerini kapatarak iki kitaptan sayfa yükleme ve aynı dosyada sayfa değiştirmeyi denetler.
